import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(process.cwd());
const dataDir = join(root, 'src/data');
const i18nDir = join(root, 'src/i18n');

let errors = 0;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  errors += 1;
}

function loadYaml(path) {
  return parse(readFileSync(path, 'utf-8'));
}

// Required data files
for (const file of [
  'site.pt.yml', 'site.en.yml',
  'schedule.pt.yml', 'schedule.en.yml',
  'instructors.pt.yml', 'instructors.en.yml',
  'classes.pt.yml', 'classes.en.yml',
  'pricing.pt.yml', 'pricing.en.yml',
  'faq.pt.yml', 'faq.en.yml',
  'gallery.pt.yml', 'gallery.en.yml',
  'testimonials.pt.yml', 'testimonials.en.yml',
]) {
  const path = join(dataDir, file);
  if (!existsSync(path)) fail(`missing ${path}`);
  else {
    try {
      loadYaml(path);
    } catch (e) {
      fail(`invalid YAML in ${path}: ${e.message}`);
    }
  }
}

// site.pt.yml positioning keys
const sitePt = loadYaml(join(dataDir, 'site.pt.yml'));
for (const key of ['name', 'positioning']) {
  if (!sitePt[key]) fail(`site.pt.yml missing ${key}`);
}
if (!sitePt.positioning?.headline) fail('site.pt.yml missing positioning.headline');

// i18n key parity (top-level nav keys)
const uiPt = loadYaml(join(i18nDir, 'ui.pt.yml'));
const uiEn = loadYaml(join(i18nDir, 'ui.en.yml'));
for (const section of ['nav', 'routes', 'footer', 'home']) {
  if (!uiPt[section] || !uiEn[section]) fail(`missing i18n section: ${section}`);
  for (const key of Object.keys(uiPt[section])) {
    if (!(key in uiEn[section])) fail(`ui.en.yml missing key ${section}.${key}`);
  }
}

// Gallery image paths exist
const gallery = loadYaml(join(dataDir, 'gallery.pt.yml'));
for (const item of gallery.items ?? []) {
  const imgPath = join(root, 'public', item.src.replace(/^\//, ''));
  if (!existsSync(imgPath)) fail(`gallery image missing: ${item.src}`);
}

if (errors > 0) {
  console.error(`validate-content: ${errors} error(s)`);
  process.exit(1);
}

console.log('OK: validate-content passed');
