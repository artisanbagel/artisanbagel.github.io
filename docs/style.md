# Style guide

Reference page: `/style/` (not in the nav). Shows every token and component with live values.

## Where to change what

| Change | File |
|--------|------|
| Colors, text sizes, spacing, radius, widths | `src/styles/tokens.css` |
| Fonts (family, weights, styles) | `astro.config.mjs`, `fonts` |
| Component styles | `src/styles/global.css` |
| Reference page | `src/pages/style.astro` |

## Rules

- Colors, text sizes, spacing, radius and page widths come from `tokens.css`. No literal values in `global.css` or pages. Allowed literals: `1px` borders, `2px` focus offset, shadow offsets, component sizes (grid minimums, input widths), ratios.
- Components use the named colors (`--fg`, `--accent`, `--mark`, ...). Palette variables (`--base03`, `--yellow`, ...) are used only inside `tokens.css`.
- One job per color. The job is the comment next to each token.
- New component: reuse a class first. If new, add it to its section in `global.css` and an example to `/style/`.
- Shared classes have no prefix (`.row`, `.label`, `.button`). Game classes start with the game prefix (`.ufg-tile`).
- Styles live in `global.css`. No `<style>` blocks in pages.

## Color

- Solarized, exact values. Light by default, dark when the OS is dark. No toggle.
- Text on `--mark` uses `--on-mark` (dark, 4.7:1 in both modes).
- Below WCAG AA (4.5:1), kept as is: links (3.4:1 light), `--muted` (4.1:1 light), `--error` (3.3:1 dark).

## Type

- Fonts: IBM Plex Sans (`--font-sans`) for all text. IBM Plex Mono (`--font-mono`) for code, board input, moves.
- Weights: 400 and 600 (`--weight-bold`). Mono: 400 only.
- Sizes: `--text-xl` h1, `--text-lg` h2, `--text-base` body, `--text-sm` everything smaller. No other sizes.

## Layout

- `--max` (42rem): text pages.
- `--max-wide` (64rem): game pages. `<Base wide>`; every Up For Grabs page gets it from its layout.
- Spacing: `--space-1` to `--space-7` only.
- One radius: `--radius`.

## Motion

- Duration `--motion`, easing `--ease`. Longer steps are multiples of `--motion`.
- Reduced motion: `--motion` is `0ms`. Scripts read it through `motion()` in `src/games/up-for-grabs/core/pieces.ts` and skip animation at 0.

## Up For Grabs

- Board and tiles: `--ufg-*` tokens. Tile faces stay light in dark mode.
- Loose tiles (pool, title) tilt by `--tilt`, set per tile from its id. Tiles in a word sit straight.

## Text

- Sentence case: headings, buttons, labels (`Find moves`, `Random end position`). Names keep their capitals (`Up For Grabs`).
- Separator: ` · ` (`Pool · 9`, page titles).
- Page title: `Page · Section · Daulet Tuleubayev`.
- Game words in capitals.
