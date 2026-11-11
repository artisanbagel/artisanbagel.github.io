# Repo rules

- No free prose. Do not write copy, descriptions or explanations in pages, content, docs or READMEs unless asked. State things in the plainest terms, or use an ALL CAPS placeholder (`ABOUT TEXT`).
- Plans live in `docs/`, one file per project track. Index: `docs/README.md`.
- Track IDs exist only in `docs/`. Never use them in code, comments or file names.
- Comments: short, only where useful.

# Layout

- `src/pages/` — routes.
- `src/layouts/` — page frames.
- `src/components/` — shared components.
- `src/content/projects/` — one Markdown file per project.
- `src/games/<game>/` — game logic. `core/` is shared by all modes; one folder per mode.
- `src/styles/global.css` — all styles. Colors are Solarized variables.
- `public/games/<game>/` — game data files (word lists, root data).
- `scripts/` — data build scripts. Run through `npm run`.

# Git

- Commit to `dev`. Merge `dev` into `main` to deploy. Pushing `main` deploys the site.
