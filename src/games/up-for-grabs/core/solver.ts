import { counts, mask } from './letters';
import type { Roots } from './roots';
import { MIN_WORD_LENGTH } from './rules';
import type { Board, Move } from './types';
import type { Words } from './words';

// A move rearranges letters into a new word from `words`. Letters come from:
//   the pool only                              player: null, from: []
//   one or more of one player's words + pool   player: p,    from: [i, ...]
// Every move uses at least one pool letter. Never words from two players.
// The new word has at least MIN_WORD_LENGTH letters (rules.ts) and may not
// keep the root of any word it uses: roots.get(OLD)?.has(NEW) means same root.

// Per player and new word: most words that fit inside it to try in combination.
const MAX_SOURCES = 12;

interface Index {
  list: string[];
  masks: Int32Array;
  counts: Uint8Array; // 26 per word
}

const indexes = new WeakMap<Words, Index>();

function indexFor(words: Words): Index {
  const cached = indexes.get(words);
  if (cached) return cached;
  const list = words.list.filter((w) => w.length >= MIN_WORD_LENGTH);
  const idx: Index = { list, masks: new Int32Array(list.length), counts: new Uint8Array(list.length * 26) };
  list.forEach((w, i) => {
    idx.masks[i] = mask(w);
    idx.counts.set(counts(w), i * 26);
  });
  indexes.set(words, idx);
  return idx;
}

interface Source {
  word: string;
  mask: number;
  counts: Uint8Array;
}

interface Table {
  pool: Uint8Array;
  poolMask: number;
  poolLength: number;
  players: { mask: number; words: Source[] }[];
}

function tableFor(board: Board): Table {
  return {
    pool: counts(board.pool),
    poolMask: mask(board.pool),
    poolLength: board.pool.length,
    players: board.players.map((p) => {
      const words = p.words.map((word) => ({ word, mask: mask(word), counts: counts(word) }));
      return { mask: words.reduce((m, w) => m | w.mask, 0), words };
    }),
  };
}

// a[aAt..] <= b[bAt..] for every letter.
function within(a: Uint8Array, aAt: number, b: Uint8Array, bAt: number): boolean {
  for (let k = 0; k < 26; k++) if (a[aAt + k] > b[bAt + k]) return false;
  return true;
}

const need = new Int16Array(26);

// Every move that makes `word` (letter counts at c[at..at+26]). Moves that keep a root go to `blocked`.
function movesTo(t: Table, word: string, m: number, c: Uint8Array, at: number, roots: Roots, out: Move[], blocked?: Move[]) {
  const len = word.length;
  if ((m & ~t.poolMask) === 0 && len <= t.poolLength && within(c, at, t.pool, 0)) {
    out.push({ player: null, from: [], to: word });
  }

  t.players.forEach((p, player) => {
    if (m & ~(p.mask | t.poolMask)) return;
    const fit: number[] = [];
    p.words.forEach((w, i) => {
      if (w.word.length < len && (w.mask & ~m) === 0 && within(w.counts, 0, c, at)) fit.push(i);
    });
    const n = Math.min(fit.length, MAX_SOURCES);

    // Every non-empty set of fitting words.
    for (let set = 1; set < 1 << n; set++) {
      for (let k = 0; k < 26; k++) need[k] = c[at + k];
      let used = 0;
      let ok = true;
      for (let b = 0; b < n && ok; b++) {
        if (!(set & (1 << b))) continue;
        const w = p.words[fit[b]];
        used += w.word.length;
        for (let k = 0; k < 26; k++) {
          if ((need[k] -= w.counts[k]) < 0) {
            ok = false;
            break;
          }
        }
      }
      if (!ok || used >= len) continue; // needs at least one pool letter
      for (let k = 0; k < 26 && ok; k++) if (need[k] > t.pool[k]) ok = false;
      if (!ok) continue;

      const from = fit.slice(0, n).filter((_, b) => set & (1 << b));
      const move: Move = { player, from, to: word };
      if (from.some((i) => roots.get(p.words[i].word)?.has(word))) blocked?.push(move);
      else out.push(move);
    }
  });
}

// Every move left on the board. Empty list: no words left.
export function solve(board: Board, words: Words, roots: Roots): Move[] {
  const idx = indexFor(words);
  const t = tableFor(board);
  const out: Move[] = [];
  for (let i = 0; i < idx.list.length; i++) {
    const m = idx.masks[i];
    if (m & t.poolMask) movesTo(t, idx.list[i], m, idx.counts, i * 26, roots, out);
  }
  return out;
}

export type Ways = { moves: Move[] } | { reason: string };

// Every way to make `word` (uppercase) on this board, or why it can't be made.
export function waysToMake(board: Board, word: string, words: Words, roots: Roots): Ways {
  if (!/^[A-Z]+$/.test(word)) return { reason: 'Letters A-Z only' };
  if (word.length < MIN_WORD_LENGTH) return { reason: `Shorter than ${MIN_WORD_LENGTH} letters` };
  if (!words.set.has(word)) return { reason: 'Not in word list' };

  const moves: Move[] = [];
  const blocked: Move[] = [];
  movesTo(tableFor(board), word, mask(word), counts(word), 0, roots, moves, blocked);
  if (moves.length) return { moves };

  const b = blocked[0];
  const owner = b && b.player !== null ? board.players[b.player] : undefined;
  if (b && owner) return { reason: `Keeps the root of ${b.from.map((i) => owner.words[i]).join(' + ')}` };
  return { reason: 'Letters not available' };
}
