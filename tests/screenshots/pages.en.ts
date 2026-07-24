function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') return '/';
  let base = value.startsWith('/') ? value : `/${value}`;
  if (!base.endsWith('/')) base += '/';
  return base;
}

const base = normalizeBase(process.env.BASE_PATH);

const routes = [
  'en/',
  'en/contact',
  'en/about',
  'en/classes',
  'en/schedule',
  'en/gallery',
  'en/privacy',
] as const;

const names = [
  'en-home',
  'en-contact',
  'en-about',
  'en-classes',
  'en-schedule',
  'en-gallery',
  'en-privacy',
] as const;

export default routes.map((route, i) => ({
  route: `${base}${route}`,
  name: names[i],
}));
