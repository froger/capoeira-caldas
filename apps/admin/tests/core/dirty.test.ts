import { describe, expect, it } from 'vitest';
import { isDirty, stableStringify } from '../../src/core/dirty';

describe('dirty', () => {
  it('detects changes ignoring key order', () => {
    expect(isDirty({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(false);
    expect(isDirty({ a: 1 }, { a: 2 })).toBe(true);
  });

  it('stringifies nested objects stably', () => {
    expect(stableStringify({ z: 1, a: { c: 2, b: 1 } })).toBe(
      stableStringify({ a: { b: 1, c: 2 }, z: 1 }),
    );
  });
});
