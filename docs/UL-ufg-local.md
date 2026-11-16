# UL — Up For Grabs: title screen and local play

Status: IN PROGRESS
Owner: Daulet

## Goal
Title screen with floating tiles. Menu: Play (Local, Lobby), Daily challenge. Local: one device, regular play, helper in the same UI. Board drawn as pieces, animated.

## Files
- `src/pages/games/up-for-grabs/index.astro` — title screen
- `src/games/up-for-grabs/title/index.ts` — floating tiles, menu
- `src/pages/games/up-for-grabs/local.astro` — local page
- `src/games/up-for-grabs/local/game.ts` — game state: bag, pool, players; flip, grab, edits
- `src/games/up-for-grabs/local/index.ts` — page wiring
- `src/games/up-for-grabs/core/pieces.ts` (shared) — tiles as pieces; slide, flip, back-to-bag animation
- `src/layouts/UpForGrabs.astro` — breadcrumb

## Decisions
- Menu: Play → Local, Lobby. Daily challenge. The Play menu is `#play` on the title page.
- Local play: grab anytime. One person flips. Any player grabs: pick their name (or number key), type the word. The site finds the tiles. More than one way: the player picks.
- Keys: Space flip, 1–6 player, Enter grab, Esc clear.
- Undo: every flip and grab. One edit session undoes as one step.
- Edit board (helper): text box, Photo, Random end position, click a pool tile or word to put it back. Bag: tile set minus the board.
- Every tile is a piece with an id. Moves slide. New tiles flip out of the bag. Removed tiles fly back in.
- Reduced motion: no animation.
- Game over: bag empty and Check finds no moves.

## Open questions
- Scoring: UNDECIDED. Shows letters held; most letters wins for now.
- Keep a game across reloads: UNDECIDED
- Touch: build a word by tapping pool tiles: UNDECIDED

## Tasks
- [x] Title screen: floating tiles, menu
- [x] Local: setup, flip, grab, steal, undo
- [x] Helper in Local: edit board, check, photo button
- [x] Pieces and animation
- [ ] Scoring rule
