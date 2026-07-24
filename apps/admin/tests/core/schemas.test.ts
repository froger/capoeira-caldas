import { describe, expect, it } from 'vitest';
import {
  EventDocSchema,
  GalleryFileSchema,
  ScheduleFileSchema,
  AdminPageIdSchema,
} from '../../src/core/schemas';

describe('schemas', () => {
  it('parses gallery and schedule', () => {
    expect(
      GalleryFileSchema.parse({
        items: [{ id: 'a', src: '/x.jpg', title: 't', price: '1', images: ['/x.jpg'] }],
      }).items,
    ).toHaveLength(1);
    expect(
      ScheduleFileSchema.parse({
        classes: [
          { day: 'Mon', time: '18:00', level: 'All', instructor: 'I', location: 'L' },
        ],
      }).classes[0]?.day,
    ).toBe('Mon');
  });

  it('parses events and admin ids', () => {
    expect(
      EventDocSchema.parse({
        slug: 's',
        locale: 'pt',
        data: {
          title: 't',
          description: 'd',
          locale: 'pt',
          date: '2024-01-01',
          location: 'l',
        },
        body: 'b',
      }).slug,
    ).toBe('s');
    expect(AdminPageIdSchema.parse('page-terms-contact')).toBe('page-terms-contact');
    expect(() => AdminPageIdSchema.parse('nope')).toThrow();
  });
});
