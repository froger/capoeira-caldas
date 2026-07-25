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

  it('uses default sleep and fills token defaults', async () => {
    vi.useFakeTimers();
    try {
      let n = 0;
      const fetchFn = async () => {
        n += 1;
        if (n === 1) {
          return { ok: true, json: async () => ({ error: 'authorization_pending' }) };
        }
        return { ok: true, json: async () => ({ access_token: 'tok' }) };
      };
      const flow = new DeviceFlow({
        clientId: 'c',
        fetchFn: fetchFn as unknown as typeof fetch,
      });
      const pending = flow.pollForToken('dc', 1);
      await vi.advanceTimersByTimeAsync(1000);
      const token = await pending;
      expect(token).toEqual({ access_token: 'tok', token_type: 'bearer', scope: '' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws oauth error code when description is missing', async () => {
    const sleep = async () => undefined;
    const flow = new DeviceFlow({
      clientId: 'c',
      sleep,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({ error: 'expired_token' }),
      })) as unknown as typeof fetch,
    });
    await expect(flow.pollForToken('d', 1)).rejects.toThrow(/expired_token/);
  });

  it('falls back when oauth body has no error fields', async () => {
    const sleep = async () => undefined;
    const flow = new DeviceFlow({
      clientId: 'c',
      sleep,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({}),
      })) as unknown as typeof fetch,
    });
    await expect(flow.pollForToken('d', 1)).rejects.toThrow(/device flow failed/);
  });

  it('uses global fetch when fetchFn is omitted', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as never;
    try {
      const flow = new DeviceFlow({ clientId: 'c', sleep: async () => undefined });
      await expect(flow.start()).rejects.toThrow(/503/);
    } finally {
      globalThis.fetch = original;
    }
  });
});
