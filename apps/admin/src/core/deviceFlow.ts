export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type DeviceFlowDeps = {
  fetchFn?: typeof fetch;
  clientId: string;
  sleep?: (ms: number) => Promise<void>;
};

const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function formBody(data: Record<string, string>): string {
  return new URLSearchParams(data).toString();
}

export class DeviceFlow {
  private readonly fetchFn: typeof fetch;
  private readonly clientId: string;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(deps: DeviceFlowDeps) {
    this.fetchFn = deps.fetchFn ?? fetch;
    this.clientId = deps.clientId;
    this.sleep = deps.sleep ?? defaultSleep;
  }

  async start(): Promise<DeviceCodeResponse> {
    const res = await this.fetchFn(DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody({
        client_id: this.clientId,
        scope: 'repo',
      }),
    });
    if (!res.ok) {
      throw new Error(`device code request failed: ${res.status}`);
    }
    return (await res.json()) as DeviceCodeResponse;
  }

  async pollForToken(deviceCode: string, intervalSec: number): Promise<TokenResponse> {
    const intervalMs = Math.max(intervalSec, 1) * 1000;
    // Poll immediately — user may already have authorized before we start waiting.
    for (;;) {
      const res = await this.fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody({
          client_id: this.clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });
      const body = (await res.json()) as Record<string, string>;
      if (body.access_token) {
        return {
          access_token: body.access_token,
          token_type: body.token_type ?? 'bearer',
          scope: body.scope ?? '',
        };
      }
      if (body.error === 'authorization_pending') {
        await this.sleep(intervalMs);
        continue;
      }
      if (body.error === 'slow_down') {
        await this.sleep(intervalMs * 2);
        continue;
      }
      throw new Error(body.error_description ?? body.error ?? 'device flow failed');
    }
  }
}
