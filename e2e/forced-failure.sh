#!/usr/bin/env bash
set -euo pipefail

# Proves the golden-payload fallback on the DEPLOYED app.
#
# app/api/generate/route.ts:
#   - reads `req.headers.get("x-force-fail") === "1"` and throws to force the error path.
#   - on failure it re-anchors the bundled golden payload and the final SSE event is:
#       send("done", { ok: true, count: clean.length, golden: usedGolden });
#     which serializes to a frame containing `"golden":true` (usedGolden === true on fallback).
#   - it reads the JSON body as `{ channels?: string[] }`; channels is optional and defaults to
#     ["reddit","tiktok","instagram","x"] when absent, so a minimal valid body is `{"channels":["reddit","x"]}`.
#
# NOTE: the route self-gates on auth — `supabase.auth.getUser()` → 401 JSON when there's no session.
# An unauthenticated prod call (no Vercel bypass, no cookie) will therefore NOT stream golden; it will
# return a 401 (or, behind Vercel preview protection, an HTML SSO wall). This script detects that case
# and says so clearly instead of silently reporting FAIL as if the fallback were broken.

# DEPLOY_URL: $1 > $DEPLOY_URL > .env.example NEXT_PUBLIC_APP_URL default.
DEPLOY_URL="${1:-${DEPLOY_URL:-https://offload-sable.vercel.app}}"

CURL_ARGS=(
  -N
  -sS
  -X POST "$DEPLOY_URL/api/generate"
  -H 'x-force-fail: 1'
  -H 'content-type: application/json'
  -d '{"channels":["reddit","x"]}'
)

# Vercel deployment-protection bypass header (preview/protected deployments).
if [[ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]]; then
  CURL_ARGS+=(-H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET")
fi

echo "POST $DEPLOY_URL/api/generate (x-force-fail: 1)"
RESPONSE="$(curl "${CURL_ARGS[@]}")"

# Auth / protection wall detection — explain rather than fail silently.
if printf '%s' "$RESPONSE" | grep -q '"error":"Not authenticated"'; then
  echo "FAIL: route returned 401 Not authenticated — the prod route self-gates on a Supabase session."
  echo "      Provide an authenticated session (or run via the Playwright 'live' project) to exercise the fallback."
  exit 1
fi
if printf '%s' "$RESPONSE" | grep -qi '<!DOCTYPE html\|<html'; then
  echo "FAIL: got HTML instead of an SSE stream — likely the Vercel deployment-protection SSO wall."
  echo "      Set VERCEL_AUTOMATION_BYPASS_SECRET to bypass protection on this deployment."
  exit 1
fi

# Success assertion: the streamed SSE 'done' frame must carry the golden flag.
if printf '%s' "$RESPONSE" | grep -q '"golden":true'; then
  echo "PASS: golden fallback streamed ('\"golden\":true' present in SSE output)."
  exit 0
fi

echo "FAIL: '\"golden\":true' not found in the streamed response."
echo "----- response -----"
printf '%s\n' "$RESPONSE"
exit 1
