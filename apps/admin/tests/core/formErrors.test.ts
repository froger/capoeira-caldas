import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  hasFieldError,
  prefixErrors,
  validateLocalePair,
  zodToFieldErrors,
} from '../../src/core/formErrors';
import { EventDocSchema, ScheduleRowSchema } from '../../src/core/schemas';

describe('formErrors', () => {
  it('maps zod paths to messages', () => {
    const result = z.object({ title: z.string().min(1, 'Required') }).safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(zodToFieldErrors(result.error).title).toBe('Required');
  });

  it('humanizes root, enum, custom, and empty messages', () => {
    const root = z.string().min(1).safeParse('');
    expect(root.success).toBe(false);
    if (root.success) return;
    expect(zodToFieldErrors(root.error)._).toBe('Required');

    const enumFail = z.object({ kind: z.enum(['a', 'b']) }).safeParse({ kind: 'c' });
    expect(enumFail.success).toBe(false);
    if (enumFail.success) return;
    expect(zodToFieldErrors(enumFail.error).kind).toBe('Invalid value');

    const rootEnum = z.enum(['a', 'b']).safeParse('c');
    expect(rootEnum.success).toBe(false);
    if (rootEnum.success) return;
    expect(zodToFieldErrors(rootEnum.error)._).toBe('Invalid value');

    const custom = z.string().email('Bad email').safeParse('x');
    expect(custom.success).toBe(false);
    if (custom.success) return;
    expect(Object.values(zodToFieldErrors(custom.error))[0]).toBe('Bad email');

    const emptyMsg = z.string().refine(() => false, { message: '' }).safeParse('x');
    expect(emptyMsg.success).toBe(false);
    if (emptyMsg.success) return;
    expect(Object.values(zodToFieldErrors(emptyMsg.error))[0]).toBe('Invalid');
  });

  it('keeps the first error per path and prefixes keys', () => {
    const multi = z
      .object({
        title: z.string().min(1, 'Required').max(2, 'Too long'),
      })
      .safeParse({ title: '' });
    expect(multi.success).toBe(false);
    if (multi.success) return;
    expect(zodToFieldErrors(multi.error).title).toBe('Required');

    expect(prefixErrors('pt', { title: 'Required', _: 'bad' })).toEqual({
      'pt.title': 'Required',
      pt: 'bad',
    });
    expect(hasFieldError({ 'pt.title': 'Required' }, 'pt.title')).toBe(true);
    expect(hasFieldError({}, 'pt.title')).toBe(false);
  });

  it('validates locale pairs with prefixed paths', () => {
    const bad = validateLocalePair(EventDocSchema, {
      pt: {
        slug: '',
        locale: 'pt',
        data: {
          title: '',
          description: 'd',
          locale: 'pt',
          date: '2024-01-01',
          location: 'L',
        },
        body: '',
      },
      en: {
        slug: 'ok',
        locale: 'en',
        data: {
          title: 'T',
          description: 'd',
          locale: 'en',
          date: '2024-01-01',
          location: 'L',
        },
        body: '',
      },
    });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.errors['pt.slug']).toBe('Required');
    expect(bad.errors['pt.data.title']).toBe('Required');
  });

  it('returns ok data for valid pairs and en-only failures', () => {
    const row = {
      day: 'Mon',
      time: '18:00',
      level: 'All',
      instructor: 'I',
      location: 'L',
    };
    const ok = validateLocalePair(ScheduleRowSchema, { pt: row, en: row });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.data.pt.day).toBe('Mon');

    const enBad = validateLocalePair(ScheduleRowSchema, {
      pt: row,
      en: { ...row, day: '' },
    });
    expect(enBad.ok).toBe(false);
    if (enBad.ok) return;
    expect(enBad.errors['en.day']).toBe('Required');
  });
});
