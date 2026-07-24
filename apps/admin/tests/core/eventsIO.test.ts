import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deleteEventPair,
  listEventSlugs,
  readEventPair,
  writeEventPair,
} from '../../src/core/eventsIO';

describe('eventsIO', () => {
  it('writes paired events and lists slugs', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-ev-'));
    mkdirSync(join(root, 'src/content/events'), { recursive: true });
    writeEventPair(root, {
      pt: {
        slug: 'demo',
        locale: 'pt',
        data: {
          title: 'T',
          description: 'D',
          locale: 'pt',
          date: '2025-01-01',
          location: 'Here',
          rsvp_url: 'https://example.com',
        },
        body: 'Corpo',
      },
      en: {
        slug: 'demo',
        locale: 'en',
        data: {
          title: 'Te',
          description: 'De',
          locale: 'en',
          date: '2025-01-01',
          location: 'Here',
        },
        body: 'Body',
      },
    });
    expect(listEventSlugs(root)).toEqual(['demo']);
    const pair = readEventPair(root, 'demo');
    expect(pair.pt.body).toBe('Corpo');
    expect(pair.en.data.title).toBe('Te');
    deleteEventPair(root, 'demo');
    expect(listEventSlugs(root)).toEqual([]);
  });

  it('rejects mismatched slugs', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-ev2-'));
    mkdirSync(join(root, 'src/content/events'), { recursive: true });
    expect(() =>
      writeEventPair(root, {
        pt: {
          slug: 'a',
          locale: 'pt',
          data: {
            title: 'T',
            description: 'D',
            locale: 'pt',
            date: '2025-01-01',
            location: 'L',
          },
          body: '',
        },
        en: {
          slug: 'b',
          locale: 'en',
          data: {
            title: 'T',
            description: 'D',
            locale: 'en',
            date: '2025-01-01',
            location: 'L',
          },
          body: '',
        },
      }),
    ).toThrow(/slug mismatch/);
  });
});
