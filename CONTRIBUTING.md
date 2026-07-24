# Contributing to Capoeira site

## Structure

```text
capoeira/
├── src/
│   ├── components/     # Astro UI components
│   ├── content/        # Markdown blog + events
│   ├── data/           # YAML structured content (edit here!)
│   ├── i18n/           # UI chrome strings (ui.pt.yml, ui.en.yml)
│   ├── layouts/        # Page shells
│   ├── pages/          # Routes (thin — compose components)
│   └── styles/         # global.css (Tailwind + DaisyUI theme)
├── public/             # Images, icons, CNAME
├── docker/             # Docker build/dev/preview
├── tests/              # Playwright screenshot tests (EN)
└── scripts/            # smoke.sh, validate-content.mjs
```

## Content editing

| What | Where |
|------|-------|
| Site name, contact, positioning copy | `src/data/site.{pt,en}.yml` |
| Schedule | `src/data/schedule.{pt,en}.yml` |
| Instructors | `src/data/instructors.{pt,en}.yml` |
| Pricing | `src/data/pricing.{pt,en}.yml` |
| FAQ | `src/data/faq.{pt,en}.yml` |
| Gallery | `src/data/gallery.{pt,en}.yml` |
| Nav labels, section titles | `src/i18n/ui.{pt,en}.yml` |
| Blog posts | `src/content/blog/*.md` |
| Events | `src/content/events/*.md` |

## Check before PR

```bash
./bin/check          # full: build + smoke + validate + screenshots
./bin/check --quick  # skip screenshots (copy-only changes)
```

## Docker

```bash
docker compose -f docker/docker-compose.yml run --rm dev      # dev server :4321
docker compose -f docker/docker-compose.yml run --rm build    # production build
docker compose -f docker/docker-compose.yml run --rm preview  # preview dist/
```

## Screenshot baselines

EN pages only. After intentional visual changes:

```bash
npm run test:screenshots:update
```

Commit updated PNGs under `tests/screenshots/baselines/`.
