export async function getGoogleAdsOAuthUrl(redirectUri: string, state: string) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/adwords",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !secret) {
    return { accessToken: "mock-google-token", refreshToken: "mock-google-refresh" };
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });
  const data = (await res.json()) as { access_token?: string; refresh_token?: string };
  return { accessToken: data.access_token || "", refreshToken: data.refresh_token || "" };
}
