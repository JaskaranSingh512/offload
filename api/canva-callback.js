import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, state, error } = req.query;
  if (error) return res.redirect(`/?canva_error=${encodeURIComponent(error)}`);
  if (!code || !state) return res.status(400).json({ error: "Missing code or state" });

  const { data: oauthState, error: stateError } = await supabase
    .from("oauth_states")
    .select("*")
    .eq("state", state)
    .eq("provider", "canva")
    .single();

  if (stateError || !oauthState) {
    console.error("State lookup failed:", stateError);
    return res.status(400).json({ error: "Invalid or expired state" });
  }

  const credentials = Buffer.from(
    `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`
  ).toString("base64");

  const tokenResp = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  process.env.CANVA_REDIRECT_URI,
      code_verifier: oauthState.code_verifier,
    }),
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    console.error("Token exchange failed:", err);
    return res.status(500).json({ error: "Token exchange failed", detail: err });
  }

  const { access_token, refresh_token, expires_in } = await tokenResp.json();

  // Store in social_accounts (provider = 'canva' now valid after enum migration)
  const { error: upsertError } = await supabase.from("social_accounts").upsert({
    account_id:          oauthState.account_id,
    provider:            "canva",
    status:              "connected",
    write_scope:         true,
    oauth_access_token:  access_token,
    oauth_refresh_token: refresh_token,
    token_expires_at:    new Date(Date.now() + expires_in * 1000).toISOString(),
  }, { onConflict: "account_id,provider" });

  if (upsertError) console.error("social_accounts upsert error:", upsertError);

  await supabase.from("oauth_states").delete().eq("state", state);

  res.redirect("/?canva_connected=true");
}
