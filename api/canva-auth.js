import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

function base64urlEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateCodeVerifier()  { return base64urlEncode(crypto.randomBytes(32)); }
function generateCodeChallenge(v) { return base64urlEncode(crypto.createHash("sha256").update(v).digest()); }

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { account_id } = req.query;
  if (!account_id) return res.status(400).json({ error: "account_id required" });

  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state         = crypto.randomUUID();

  const { error } = await supabase.from("oauth_states").insert({
    state,
    account_id,
    code_verifier: codeVerifier,
    provider:      "canva",
  });

  if (error) {
    console.error("Failed to store oauth state:", error);
    return res.status(500).json({ error: "Failed to initiate OAuth", detail: error.message });
  }

  const params = new URLSearchParams({
    client_id:             process.env.CANVA_CLIENT_ID,
    response_type:         "code",
    redirect_uri:          process.env.CANVA_REDIRECT_URI,
    scope:                 "design:content:write design:meta:read asset:write",
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  res.redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`);
}
