import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function base64urlEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateCodeVerifier() {
  return base64urlEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  return base64urlEncode(crypto.createHash("sha256").update(verifier).digest());
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required as query param" });

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  // Store state + verifier temporarily so the callback can retrieve it
  await supabase.from("oauth_states").upsert({
    state,
    user_id,
    code_verifier: codeVerifier,
    provider: "canva",
    created_at: new Date().toISOString(),
  });

  const params = new URLSearchParams({
    client_id: process.env.CANVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.CANVA_REDIRECT_URI,
    scope: "design:content:write design:meta:read asset:write",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  res.redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`);
}
