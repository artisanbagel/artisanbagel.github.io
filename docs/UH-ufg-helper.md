# UH — Up For Grabs: helper

Status: IN PROGRESS
Owner: Daulet

## Goal
Input a board position. Show whether any words can still be made, and which.

## Problem
- Input: players and their words, letters in the pool.
- Output: every move left. Empty: game over.
- Move: letters rearranged into a new word. Sources:
  - pool letters only
  - one or more of one player's words + pool letters
  - never words from two players
- Every move uses at least one pool letter.
- New word: at least 4 letters.
- Not allowed: the new word keeps the root of a word it uses (plurals, prefixes, suffixes).

## Files
- `src/pages/games/up-for-grabs/helper.astro` — page
- `src/games/up-for-grabs/helper/solver.ts` — solver (stub)
- `src/games/up-for-grabs/helper/format.ts` — board text format
- `src/games/up-for-grabs/helper/random.ts` — random end position
- `src/games/up-for-grabs/helper/view.ts` — board view
- `src/games/up-for-grabs/helper/index.ts` — page wiring
- `src/games/up-for-grabs/core/` (shared) — types, rules, tile set, word lists, root data loader
- `public/games/up-for-grabs/words/` — bundled word lists. `scowl.txt` built by `scripts/build-scowl.mjs` (`npm run build:scowl`)
- `public/games/up-for-grabs/roots.txt` — root data, built by `scripts/build-roots.mjs` (`npm run build:roots`)
- `public/games/up-for-grabs/roots-extra.txt` — root pairs added by hand, from reports

## Decisions
- Board input format: text, one line each. `POOL: AEQX`, `NAME: WORD WORD`.
- Solver language: TypeScript. Site is static, so the solver runs in the browser.
- Tile set: placeholder, 98 tiles (`core/tiles.ts`).
- Minimum word length: 4 (`core/rules.ts`).
- Several words from one player in one move: allowed.
- Combining with no pool letters: not allowed.
- Word lists: selectable. Own `.txt` file loads in the browser only, never uploaded. Bundled:
  - ENABLE (word game): public domain, 172,823 words.
  - SCOWL (dictionary): size 70 US speller list, release 2026.02.25, 126,764 words. MIT-like license; notice kept in the file. Credit shown on the helper page.
  - Overlap: 113,291 in both. ENABLE only: 59,532 (rare word-game words: SCOWDER, PRILLING). SCOWL only: 13,473 (newer words: DAYCARE, PHISHING, UPSKILLING).
  - Official Scrabble lists (NWL, Collins) and Merriam-Webster are copyrighted; not hostable.
- Root rule: liberal. Block only pairs the root data lists. No affix guessing (MOTH → MOTHER, CORN → CORNER, LATE → RELATE).
- Root data: MorphyNet English, trimmed to bundled word lists. Own-file words outside them have no root data.
- Root reports: "Report" link per move opens a prefilled GitHub issue. Needs a GitHub account. Add confirmed pairs to `roots-extra.txt`.

## Root data
- MorphyNet English (github.com/kbatsuren/MorphyNet, CC BY-SA 3.0). Credit shown on the helper page.
  - Base → derived/inflected pairs. Pairs only; not a word list.
  - Source: Wiktionary etymology templates (base + affix), inflection tables, headword lines. Plus pairs inferred from other languages (3% of English pairs).
  - Follow pairs one way (base → longer). Merging into families joins unrelated words.
  - Gaps: 41,145 ENABLE words not in MorphyNet; some missing links (FORM → REFORM, SIGN → DESIGN).
  - Blocks some origin-only pairs: HAND → HANDSOME, PORT → REPORT, COUNT → COUNTY.
- `roots.txt`: base 4+ letters; target holds every base letter; chains followed (HAPPY → UNHAPPY → UNHAPPILY).
  - 46,074 bases, 122,351 pairs, 1.8 MB (0.4 MB gzipped).
  - Rebuild after changing a bundled word list.
- `roots-extra.txt`: same format. A pair WORD LONGER also blocks everything `roots.txt` lists for LONGER.
- Other sources:
  - MorphoLex-en: root per word, 68,624 words, CC BY-NC-SA 4.0.
  - CELEX: hand-checked, research-only license. Not usable on the site.

## Tasks
- [x] Board types
- [x] Board text input
- [x] Board view
- [x] Random end position
- [x] Moves list, highlight on board
- [x] Word list selection, own file
- [x] Report link per move
- [x] Root data file (MorphyNet) + extra pairs file
- [ ] Solver
- [ ] Random end position: reject boards with moves left (needs solver)
- [ ] Board input from photo (CV)
