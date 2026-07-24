import { describe, expect, it } from 'vitest';
import { isDirty } from '../../src/core/dirty';
import { useDirtyForm } from '../../src/shared/dirtyForm';

// Hook tested indirectly via dirty core; ensure module exports.
describe('dirtyForm module', () => {
  it('exports useDirtyForm', () => {
    expect(typeof useDirtyForm).toBe('function');
    expect(isDirty({ a: 1 }, { a: 1 })).toBe(false);
  });
});
