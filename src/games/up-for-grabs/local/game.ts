// Local game state. Tiles carry ids so the board can animate each piece as it moves.
import type { Piece } from '../core/pieces';
import { TILE_COUNTS } from '../core/tiles';
import type { Board, Move } from '../core/types';

export interface Seat {
  name: string;
  words: Piece[][];
}

export interface Game {
  bag: Piece[]; // face down; flip takes the last
  pool: Piece[]; // face up, in flip order
  players: Seat[];
}

let nextId = 1;
const newPiece = (letter: string): Piece => ({ id: nextId++, letter });

export const spell = (w: Piece[]) => w.map((p) => p.letter).join('');

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tiles back into the bag at random places.
function intoBag(bag: Piece[], back: Piece[]): Piece[] {
  const out = [...bag];
  for (const p of back) out.splice(Math.floor(Math.random() * (out.length + 1)), 0, p);
  return out;
}

export function newGame(names: string[]): Game {
  const letters = Object.entries(TILE_COUNTS).flatMap(([letter, n]) => Array<string>(n).fill(letter));
  return { bag: shuffle(letters.map(newPiece)), pool: [], players: names.map((name) => ({ name, words: [] })) };
}

export function flip(g: Game): Game {
  const top = g.bag.at(-1);
  if (!top) return g;
  return { ...g, bag: g.bag.slice(0, -1), pool: [...g.pool, top] };
}

export function toBoard(g: Game): Board {
  return {
    pool: spell(g.pool),
    players: g.players.map((s) => ({ name: s.name, words: s.words.map(spell) })),
  };
}

// `claimer` makes `move`. The new word takes the source words' tiles first, then pool tiles.
export function grab(g: Game, claimer: number, move: Move): Game {
  const players = g.players.map((s) => ({ ...s, words: [...s.words] }));
  const source: Piece[] = [];
  if (move.player !== null) {
    const owner = players[move.player];
    for (const i of move.from) source.push(...owner.words[i]);
    owner.words = owner.words.filter((_, i) => !move.from.includes(i));
  }
  const pool = [...g.pool];
  const word = [...move.to].map((letter) => {
    let i = source.findIndex((p) => p.letter === letter);
    if (i >= 0) return source.splice(i, 1)[0];
    i = pool.findIndex((p) => p.letter === letter);
    if (i < 0) throw new Error(`No ${letter} in the pool`);
    return pool.splice(i, 1)[0];
  });
  if (source.length) throw new Error('Move leaves letters unused');
  players[claimer].words.push(word);
  return { ...g, pool, players };
}

export function poolTileToBag(g: Game, id: number): Game {
  const p = g.pool.find((q) => q.id === id);
  if (!p) return g;
  return { ...g, pool: g.pool.filter((q) => q !== p), bag: intoBag(g.bag, [p]) };
}

export function wordToBag(g: Game, seat: number, word: number): Game {
  const w = g.players[seat]?.words[word];
  if (!w) return g;
  const players = g.players.map((s, i) => (i === seat ? { ...s, words: s.words.filter((_, j) => j !== word) } : s));
  return { ...g, players, bag: intoBag(g.bag, w) };
}

// Game from a typed or photographed board. The bag holds the rest of the tile set.
// Tiles of `prev` are reused for the same letter in the same place first (pool, same word,
// same player), then anywhere, so unchanged tiles stay put.
export function fromBoard(board: Board, prev?: Game): Game {
  const spare = new Map<string, Piece[]>(); // place → tiles
  const add = (key: string, ps: Piece[]) => spare.set(key, [...(spare.get(key) ?? []), ...ps]);
  if (prev) {
    add('pool', prev.pool);
    for (const s of prev.players) {
      for (const w of s.words) {
        add(`${s.name}:${spell(w)}`, w);
        add(s.name, w);
      }
    }
    add('', [...prev.pool, ...prev.players.flatMap((s) => s.words.flat()), ...prev.bag]);
  }
  const used = new Set<number>();
  const find = (letter: string, keys: string[]): Piece | undefined => {
    for (const key of keys) {
      const p = spare.get(key)?.find((q) => q.letter === letter && !used.has(q.id));
      if (p) {
        used.add(p.id);
        return p;
      }
    }
  };

  interface Slot {
    letter: string;
    keys: string[];
    piece?: Piece;
  }
  const slots = (letters: string, keys: string[]): Slot[] => [...letters].map((letter) => ({ letter, keys }));
  const pool = slots(board.pool, ['pool']);
  const players = board.players.map((pl) => ({
    name: pl.name,
    words: pl.words.map((w) => slots(w, [`${pl.name}:${w}`, pl.name])),
  }));
  const all = [...pool, ...players.flatMap((p) => p.words.flat())];
  for (const s of all) s.piece = find(s.letter, s.keys);
  for (const s of all) s.piece ??= find(s.letter, ['']) ?? newPiece(s.letter);
  const piece = (s: Slot) => s.piece as Piece;

  const left: Record<string, number> = { ...TILE_COUNTS };
  for (const ch of [board.pool, ...board.players.flatMap((p) => p.words)].join('')) left[ch] = (left[ch] ?? 0) - 1;
  const bag = Object.entries(left).flatMap(([letter, n]) =>
    Array.from({ length: Math.max(0, n) }, () => find(letter, ['']) ?? newPiece(letter)),
  );

  return {
    bag: shuffle(bag),
    pool: pool.map(piece),
    players: players.map((p) => ({ name: p.name, words: p.words.map((w) => w.map(piece)) })),
  };
}
