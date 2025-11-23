export const runtime = "edge";

let TOKEN_CACHE = {
  access_token: null as string | null,
  expires_at: null as number | null,
};

export async function GET(req: Request) {
  const tenantId = process.env.TENANT_ID!;
  const clientId = process.env.CLIENT_ID!;
  const clientSecret = process.env.CLIENT_SECRET!;
  const scope =
    process.env.SCOPE ||
    "https://api.businesscentral.dynamics.com/.default";

  const url = new URL(req.url);
  const force = url.searchParams.get("refresh") === "1";

  if (
    !force &&
    TOKEN_CACHE.access_token &&
    TOKEN_CACHE.expires_at &&
    Date.now() < TOKEN_CACHE.expires_at
  ) {
    return new Response(
      JSON.stringify({
        access_token: TOKEN_CACHE.access_token,
        cached: true,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(
      JSON.stringify({ error: "Failed to fetch token", details: text }),
      { status: 500 }
    );
  }

  const token = await res.json();

  TOKEN_CACHE.access_token = token.access_token;
  TOKEN_CACHE.expires_at =
    Date.now() + token.expires_in * 1000 - 5 * 60_000;

  return new Response(
    JSON.stringify({
      access_token: token.access_token,
      refreshed: true,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
