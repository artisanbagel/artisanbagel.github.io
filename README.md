# artisanbagel.github.io

Personal site. Astro, static output, deployed to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`.

## Add a project

Create one Markdown file in `src/content/projects/`:

```md
---
title: Project name
date: 2026-10-20
summary: One sentence shown in the list.
repo: https://github.com/artisanbagel/project   # optional
link: https://project.example.com               # optional
draft: false                                    # true hides it
---

The write-up.
```

The file name is the URL: `route-optimizer.md` serves at `/projects/route-optimizer/`.

## Games

- Pages: `src/pages/games/`
- Logic: `src/games/<game>/`. `core/` is shared; one folder per mode.
- Data: `public/games/<game>/`. Up For Grabs: `npm run build:scowl` rebuilds the SCOWL word list, `npm run build:roots` the root data.

## Style

- Values: `src/styles/tokens.css`. Fonts: `astro.config.mjs`.
- Rules: `docs/style.md`.
- Reference page: `/style/`.

## Plans

`docs/`. Index: `docs/README.md`.

## Run locally

Needs Node 22 or newer (`.nvmrc` says 26).

```sh
npm install
npm run dev
```

## Custom domain

Put the domain in `public/CNAME` (one line, no protocol), then at the
registrar add four `A` records for the apex to GitHub's Pages IPs and a
`CNAME` record for `www` pointing at `artisanbagel.github.io`.
