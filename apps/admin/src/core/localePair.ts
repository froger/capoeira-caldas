import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import type { z } from 'zod';

export function readYamlFile<T>(path: string, schema: z.ZodType<T>): T {
  const raw = parse(readFileSync(path, 'utf-8'));
  return schema.parse(raw);
}

export function writeYamlFile(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringify(data, { lineWidth: 0 }), 'utf-8');
}

export type LocalePair<T> = { pt: T; en: T };

export function writeLocalePair<T>(
  paths: LocalePair<string>,
  data: LocalePair<T>,
  schema: z.ZodType<T>,
): void {
  const pt = schema.parse(data.pt);
  const en = schema.parse(data.en);
  writeYamlFile(paths.pt, pt);
  writeYamlFile(paths.en, en);
}

export function readLocalePair<T>(
  paths: LocalePair<string>,
  schema: z.ZodType<T>,
): LocalePair<T> {
  return {
    pt: readYamlFile(paths.pt, schema),
    en: readYamlFile(paths.en, schema),
  };
}
