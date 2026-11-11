# TH — Theme and style guide

Status: DONE
Owner: Daulet

## Goal
Solarized light. Solarized dark when the OS is in dark mode. One place to edit every style value.

## Files
- `src/styles/tokens.css` — every value
- `src/styles/global.css` — component styles
- `astro.config.mjs` — fonts
- `src/pages/style.astro` — reference page, `/style/`
- `docs/style.md` — rules

## Decisions
- Font: IBM Plex Sans + IBM Plex Mono. Self-hosted through Astro's fonts config.
- Contrast: Solarized values kept exact. Text on highlights is dark (`--on-mark`).
- `/style/`: public, not in the nav.
- Width: 42rem text pages, 64rem game pages.
- Light/dark: follows the OS. No toggle.

## Tasks
- [x] Solarized palette variables
- [x] Light and dark mappings
- [x] Tokens file: colors, type, spacing, radius, widths
- [x] Font
- [x] Reference page
- [x] Style guide
