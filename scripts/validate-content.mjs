import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(process.cwd());
const dataDir = join(root, 'src/data');
const i18nDir = join(root, 'src/i18n');
const pagesDir = join(i18nDir, 'pages');
const PAGE_NAMES = ['classes', 'about', 'contact', 'gallery', 'schedule', 'privacy'];

let errors = 0;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  errors += 1;
}

function loadYaml(path) {
  return parse(readFileSync(path, 'utf-8'));
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  if (!obj || typeof obj !== 'object') return keys;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flattenKeys(v, path));
    else keys.push(path);
  }
  return keys;
}

function loadMergedUi(locale) {
  const site = loadYaml(join(i18nDir, `site.${locale}.yml`));
  const pages = {};
  for (const name of PAGE_NAMES) {
    const path = join(pagesDir, `${name}.${locale}.yml`);
    if (!existsSync(path)) {
      fail(`missing ${path}`);
      continue;
    }
    pages[name] = loadYaml(path);
  }
  return { ...site, pages };
}

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

const sitePt = loadYaml(join(dataDir, 'site.pt.yml'));
const siteEn = loadYaml(join(dataDir, 'site.en.yml'));
for (const [label, site] of [['site.pt.yml', sitePt], ['site.en.yml', siteEn]]) {
  if (!site.name) fail(`${label} missing name`);
  if (!site.positioning?.primary_cta) fail(`${label} missing positioning.primary_cta`);
  if (!site.positioning?.navbar_cta) fail(`${label} missing positioning.navbar_cta`);
  if (!site.social?.x && site.social?.x !== '') fail(`${label} missing social.x`);
}

const uiPt = loadMergedUi('pt');
const uiEn = loadMergedUi('en');

const ptKeys = new Set(flattenKeys(uiPt));
const enKeys = new Set(flattenKeys(uiEn));
for (const key of ptKeys) {
  if (!enKeys.has(key)) fail(`i18n en missing key ${key}`);
}
for (const key of enKeys) {
  if (!ptKeys.has(key)) fail(`i18n pt missing key ${key}`);
}
for (const section of ['nav', 'routes', 'footer', 'home', 'common', 'pages']) {
  if (!uiPt[section] || !uiEn[section]) fail(`missing i18n section: ${section}`);
}

const ptRouteKeys = Object.keys(uiPt.routes ?? {}).sort().join(',');
const enRouteKeys = Object.keys(uiEn.routes ?? {}).sort().join(',');
if (ptRouteKeys !== enRouteKeys) {
  fail(`routes key mismatch pt=[${ptRouteKeys}] en=[${enRouteKeys}]`);
}

for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith('.yml')) continue;
  const match = file.match(/^(.+)\.(pt|en)\.yml$/);
  if (!match) {
    fail(`unexpected i18n page file name: ${file}`);
    continue;
  }
  if (!PAGE_NAMES.includes(match[1])) {
    fail(`unknown i18n page file: ${file}`);
  }
}

for (const locale of ['pt', 'en']) {
  const gallery = loadYaml(join(dataDir, `gallery.${locale}.yml`));
  for (const item of gallery.items ?? []) {
    for (const src of [item.src, ...(item.images ?? [])]) {
      if (!src) continue;
      const imgPath = join(root, 'public', src.replace(/^\//, ''));
      if (!existsSync(imgPath)) fail(`gallery image missing (${locale}): ${src}`);
    }
  }
}

if (errors > 0) {
  console.error(`validate-content: ${errors} error(s)`);
  process.exit(1);
}

console.log('OK: validate-content passed');
