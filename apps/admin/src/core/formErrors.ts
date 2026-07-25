import { z } from 'zod';

export type FieldErrors = Record<string, string>;

export function zodToFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join('.');
    if (!path) {
      if (!out._) out._ = humanize(issue);
      continue;
    }
    if (!out[path]) out[path] = humanize(issue);
  }
  return out;
}

function humanize(issue: z.ZodIssue): string {
  if (issue.code === 'too_small' && issue.type === 'string') {
    return 'Required';
  }
  if (issue.code === 'invalid_enum_value') {
    return 'Invalid value';
  }
  if (issue.message && issue.message !== 'Required') {
    return issue.message;
  }
  return issue.message || 'Invalid';
}

export function prefixErrors(prefix: string, errors: FieldErrors): FieldErrors {
  const out: FieldErrors = {};
  for (const [key, message] of Object.entries(errors)) {
    out[key === '_' ? prefix : `${prefix}.${key}`] = message;
  }
  return out;
}

export type ValidatePairResult<T> =
  | { ok: true; data: { pt: T; en: T } }
  | { ok: false; errors: FieldErrors };

export function validateLocalePair<T>(
  schema: z.ZodType<T>,
  data: { pt: unknown; en: unknown },
): ValidatePairResult<T> {
  const pt = schema.safeParse(data.pt);
  const en = schema.safeParse(data.en);
  if (pt.success && en.success) {
    return { ok: true, data: { pt: pt.data, en: en.data } };
  }
  return {
    ok: false,
    errors: {
      ...(pt.success ? {} : prefixErrors('pt', zodToFieldErrors(pt.error))),
      ...(en.success ? {} : prefixErrors('en', zodToFieldErrors(en.error))),
    },
  };
}

export function hasFieldError(errors: FieldErrors, path: string): boolean {
  return Boolean(errors[path]);
}
