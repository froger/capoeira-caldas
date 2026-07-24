import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
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

export function getSite(locale: 'pt' | 'en'): SiteConfig {
  return loadYaml<SiteConfig>(`site.${locale}.yml`);
}

export function getSchedule(locale: 'pt' | 'en'): { classes: ScheduleClass[] } {
  return loadYaml(`schedule.${locale}.yml`);
}

export function getInstructors(locale: 'pt' | 'en'): { instructors: Instructor[] } {
  return loadYaml(`instructors.${locale}.yml`);
}

export function getTestimonials(locale: 'pt' | 'en'): { testimonials: Testimonial[] } {
  return loadYaml(`testimonials.${locale}.yml`);
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
  return loadYaml(`gallery.${locale}.yml`);
}

export function getFaq(locale: 'pt' | 'en'): { items: FaqItem[] } {
  return loadYaml(`faq.${locale}.yml`);
}

export function getClasses(locale: 'pt' | 'en'): { programs: ClassProgram[] } {
  return loadYaml(`classes.${locale}.yml`);
}

export function getClassProgram(locale: 'pt' | 'en', id: string): ClassProgram | undefined {
  return getClasses(locale).programs.find((p) => p.id === id);
}
