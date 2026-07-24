import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { withBase } from './paths';
import type {
  ClassProgram,
  FaqItem,
  GalleryItem,
  Instructor,
  PricingAudience,
  PricingPlan,
  ScheduleClass,
  SiteConfig,
  Testimonial,
} from './types';

const dataDir = resolve(process.cwd(), 'src/data');

function loadYaml<T>(filename: string): T {
  const path = join(dataDir, filename);
  const content = readFileSync(path, 'utf-8');
  return parse(content) as T;
}

function asset(path?: string): string {
  return path ? withBase(path) : '';
}

export function getSite(locale: 'pt' | 'en'): SiteConfig {
  const site = loadYaml<SiteConfig>(`site.${locale}.yml`);
  return {
    ...site,
    positioning: {
      ...site.positioning,
      value_themes: site.positioning.value_themes.map((theme) => ({
        ...theme,
        image: theme.image ? asset(theme.image) : theme.image,
      })),
    },
  };
}

export function getSchedule(locale: 'pt' | 'en'): { classes: ScheduleClass[] } {
  return loadYaml(`schedule.${locale}.yml`);
}

export function getInstructors(locale: 'pt' | 'en'): { instructors: Instructor[] } {
  const data = loadYaml<{ instructors: Instructor[] }>(`instructors.${locale}.yml`);
  return {
    instructors: data.instructors.map((inst) => ({
      ...inst,
      photo: asset(inst.photo),
    })),
  };
}

export function getTestimonials(locale: 'pt' | 'en'): { testimonials: Testimonial[] } {
  const data = loadYaml<{ testimonials: Testimonial[] }>(`testimonials.${locale}.yml`);
  return {
    testimonials: data.testimonials.map((item) => ({
      ...item,
      avatar: asset(item.avatar),
    })),
  };
}

export function getPricing(
  locale: 'pt' | 'en',
  audience: PricingAudience,
): { plans: PricingPlan[]; bring_items: string[] } {
  const data = loadYaml<Record<PricingAudience, { plans: PricingPlan[]; bring_items: string[] }>>(
    `pricing.${locale}.yml`,
  );
  return data[audience];
}

export function getGallery(locale: 'pt' | 'en'): { items: GalleryItem[] } {
  const data = loadYaml<{ items: GalleryItem[] }>(`gallery.${locale}.yml`);
  return {
    items: data.items.map((item) => ({
      ...item,
      src: asset(item.src),
      images: item.images.map((img) => asset(img)),
    })),
  };
}

export function getFaq(locale: 'pt' | 'en'): { items: FaqItem[] } {
  return loadYaml(`faq.${locale}.yml`);
}

export function getClasses(locale: 'pt' | 'en'): { programs: ClassProgram[] } {
  const data = loadYaml<{ programs: ClassProgram[] }>(`classes.${locale}.yml`);
  return {
    programs: data.programs.map((program) => ({
      ...program,
      image: asset(program.image),
      path: withBase(program.path),
    })),
  };
}

export function getClassProgram(locale: 'pt' | 'en', id: string): ClassProgram | undefined {
  return getClasses(locale).programs.find((p) => p.id === id);
}
