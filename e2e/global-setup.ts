import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Session } from "@supabase/supabase-js";

// ===== LIVE-only Playwright globalSetup =====
// Provisions the test user against real Supabase and writes a browser storageState that
// reproduces what the @supabase/ssr browser client (lib/supabase/client.ts) would set, so the
// `live` project's pages boot already authenticated (RLS resolves as the test user's auth.uid()).
//
// This file is referenced by playwright.config.ts ONLY when E2E_LIVE is set (the mock run never
// imports it). Even so, it self-gates: if E2E_LIVE !== "1" or any required env var is missing it
// writes an EMPTY-but-valid storageState and returns, so globalSetup can never crash a run where
// the live spec top-level-skips anyway.

const STATE_PATH = "e2e/.auth/state.json";
const EMPTY_STATE = { cookies: [] as unknown[], origins: [] as unknown[] };

// @supabase/ssr 0.12 chunk size (utils/chunker.ts MAX_CHUNK_SIZE) and base64 marker.
const MAX_CHUNK_SIZE = 3180;
const BASE64_PREFIX = "base64-";

type PwCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
};

async function writeState(state: unknown): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

// Default storageKey of the supabase browser client: `sb-<project-ref>-auth-token`, where the
// project ref is the first label of the Supabase URL host (e.g. https://abcd.supabase.co → abcd).
// client.ts passes no custom cookieOptions.name, so this default applies.
function storageKey(supabaseUrl: string): string {
  const host = new URL(supabaseUrl).hostname;
  const ref = host.split(".")[0];
  return `sb-${ref}-auth-token`;
}

// Reproduce @supabase/ssr's cookie encoding: value is `base64-<base64url(JSON.stringify(session))>`,
// then split into `key`, or `key.0` / `key.1` / … chunks when the value exceeds MAX_CHUNK_SIZE.
// The encoded value is pure-ASCII base64url, so encodeURIComponent is an identity here and a raw
// slice matches the library's createChunks() output exactly.
function sessionCookies(key: string, session: Session): Array<{ name: string; value: string }> {
  const json = JSON.stringify(session);
  const value = BASE64_PREFIX + Buffer.from(json, "utf8").toString("base64url");
  if (value.length <= MAX_CHUNK_SIZE) return [{ name: key, value }];
  const chunks: Array<{ name: string; value: string }> = [];
  for (let i = 0, n = 0; i < value.length; i += MAX_CHUNK_SIZE, n += 1) {
    chunks.push({ name: `${key}.${n}`, value: value.slice(i, i + MAX_CHUNK_SIZE) });
  }
  return chunks;
}

export default async function globalSetup(): Promise<void> {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;

  // Self-gate: anything missing (or live disabled) → empty state, never crash.
  if (process.env.E2E_LIVE !== "1" || !email || !password || !url || !anon || !secret) {
    await writeState(EMPTY_STATE);
    return;
  }

  // 1. Provision the test user with the service-role admin client (bypasses RLS / confirmation).
  const admin = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    const msg = created.error.message.toLowerCase();
    const exists = msg.includes("already") || msg.includes("registered") || created.error.status === 422;
    if (!exists) throw created.error; // a real failure (bad key, etc.) should fail the run loudly
  }

  // 2. Sign in with the anon client to mint a real session (the same path the browser uses).
  const anonClient = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("global-setup: signInWithPassword returned no session.");

  // 3. Build the storageState cookies the browser client would have written.
  const baseURL = process.env.DEPLOY_URL || "http://localhost:3100";
  const target = new URL(baseURL);
  const secure = target.protocol === "https:";
  const expires = data.session.expires_at ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

  const cookies: PwCookie[] = sessionCookies(storageKey(url), data.session).map(({ name, value }) => ({
    name,
    value,
    domain: target.hostname,
    path: "/",
    expires,
    httpOnly: false, // the browser client writes via document.cookie, so not httpOnly
    secure,
    sameSite: "Lax",
  }));

  await writeState({ cookies, origins: [] });
}
