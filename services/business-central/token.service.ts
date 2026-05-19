type TokenCache = {
  token: string;
  expiresAt: number;
};

class BusinessCentralTokenService {
  private cache: TokenCache | null = null;

  // prevents multiple simultaneous token requests
  private refreshPromise: Promise<string> | null = null;

  async getAccessToken(): Promise<string> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.token;
    }

    // deduplicate concurrent requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.requestNewToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async requestNewToken(): Promise<string> {
    const tenant = process.env.TENANT_ID!;

    const response = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.CLIENT_ID!,
          client_secret: process.env.CLIENT_SECRET!,
          scope: process.env.SCOPE!,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Token Error ${response.status}: ${JSON.stringify(data)}`
      );
    }

    // 5 min safety buffer (VERY important)
    const expiresInMs =
      (data.expires_in ?? 3600) * 1000;

    this.cache = {
      token: data.access_token,
      expiresAt: Date.now() + expiresInMs - 5 * 60 * 1000,
    };

    return data.access_token;
  }
}

export const tokenService =
  new BusinessCentralTokenService();