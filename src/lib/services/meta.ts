export async function getMetaOAuthUrl(redirectUri: string, state: string) {
  const appId = process.env.META_APP_ID;
  if (!appId) return null;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: "ads_read,leads_retrieval,pages_messaging",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCode(code: string, redirectUri: string) {
  const appId = process.env.META_APP_ID;
  const secret = process.env.META_APP_SECRET;
  if (!appId || !secret) {
    return { accessToken: "mock-meta-token", refreshToken: "mock-meta-refresh" };
  }
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: secret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`);
  const data = (await res.json()) as { access_token?: string };
  return { accessToken: data.access_token || "", refreshToken: "" };
}
