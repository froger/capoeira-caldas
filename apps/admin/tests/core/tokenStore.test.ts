import { describe, expect, it } from 'vitest';
import { TokenStore } from '../../src/core/tokenStore';

describe('TokenStore', () => {
  it('saves loads and clears', () => {
    let stored: string | null = null;
    const store = new TokenStore(
      {
        encrypt: (p) => `enc:${p}`,
        decrypt: (c) => c.replace(/^enc:/, ''),
      },
      {
        read: () => stored,
        write: (v) => {
          stored = v;
        },
      },
    );
    expect(store.load()).toBeNull();
    store.save('secret');
    expect(store.load()).toBe('secret');
    store.clear();
    expect(store.load()).toBeNull();
  });

  it('clears on decrypt failure', () => {
    let stored: string | null = 'bad';
    const store = new TokenStore(
      {
        encrypt: (p) => p,
        decrypt: () => {
          throw new Error('boom');
        },
      },
      {
        read: () => stored,
        write: (v) => {
          stored = v;
        },
      },
    );
    expect(store.load()).toBeNull();
    expect(stored).toBeNull();
  });
});
