import { describe, expect, it, vi } from 'vitest';
import { DeviceFlow } from '../../src/core/deviceFlow';

describe('DeviceFlow', () => {
  it('starts and polls until token', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          device_code: 'dc',
          user_code: 'ABCD',
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'authorization_pending' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'slow_down' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'tok',
          token_type: 'bearer',
          scope: 'repo',
        }),
      });

    const sleep = vi.fn(async () => undefined);
    const flow = new DeviceFlow({ clientId: 'cid', fetchFn: fetchFn as unknown as typeof fetch, sleep });
    const started = await flow.start();
    expect(started.user_code).toBe('ABCD');
    const token = await flow.pollForToken('dc', 1);
    expect(token.access_token).toBe('tok');
    expect(sleep).toHaveBeenCalled();
  });

  it('fails when device code HTTP errors', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const flow = new DeviceFlow({ clientId: 'cid', fetchFn: fetchFn as unknown as typeof fetch });
    await expect(flow.start()).rejects.toThrow(/500/);
  });

  it('fails on oauth error', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'access_denied', error_description: 'nope' }),
    });
    const sleep = vi.fn(async () => undefined);
    const flow = new DeviceFlow({ clientId: 'cid', fetchFn: fetchFn as unknown as typeof fetch, sleep });
    await expect(flow.pollForToken('dc', 1)).rejects.toThrow(/nope/);
  });
});
