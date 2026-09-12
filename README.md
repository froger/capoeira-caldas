# Associação Capoeira Caldas — static site

Associação de capoeira com música ao vivo. Astro 5 + Tailwind CSS 4 + DaisyUI 5.

## Quick start

```bash
docker compose -f docker/docker-compose.yml run --rm dev
# → http://localhost:4321
```

## Check before PR

```bash
./bin/check
```

## Edit content

| Content | File |
|---------|------|
| Site info, positioning, contact | `src/data/site.pt.yml` |
| Schedule | `src/data/schedule.pt.yml` |
| Instructors | `src/data/instructors.pt.yml` |
| Pricing | `src/data/pricing.pt.yml` |
| UI labels (nav, buttons) | `src/i18n/site.pt.yml` + `src/i18n/pages/*.pt.yml` |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full map.

## Build

```bash
docker compose -f docker/docker-compose.yml run --rm build   # → dist/
./scripts/smoke.sh
```

## GitHub Pages

1. Enable Pages → Source: **GitHub Actions**
2. Set custom domain in repo settings
3. Put that hostname in `public/CNAME` (not `*.example.org`)
4. Push to `main` — workflow deploys `dist/`

Build URLs come from `SITE` (origin, default `https://<CNAME>` or `https://<owner>.github.io`) and `BASE_PATH` (pathname, default `/` when `public/CNAME` is a real host, otherwise `/<repo>/`). Override with env or GitHub Actions variables `SITE` / `BASE_PATH`. Empty workflow_dispatch inputs fall through to those defaults.

## Static form limitations

- Contact form uses `mailto:` or optional Formspree URL in `site.pt.yml`
- Newsletter points to external provider URL
- Blog comments are decorative only (no server)

## Locales

- Portuguese (default): `/`
- English: `/en/`

## License

Content © Associação Capoeira Caldas. Code: MIT (adjust as needed).
