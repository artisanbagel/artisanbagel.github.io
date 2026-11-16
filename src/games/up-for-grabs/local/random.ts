import type { Board } from '../core/types';
import { MIN_WORD_LENGTH } from '../core/rules';
import { TILE_COUNTS } from '../core/tiles';

const A = 'A'.charCodeAt(0);
const MAX_LEN = 10;
const TRIES = 200_000;

// Every tile dealt: players hold random words, the leftover tiles are the pool.
// Not checked with the solver, so moves may remain.
export function randomEndPosition(
  list: readonly string[],
  playerCount: number,
  rng: () => number = Math.random,
): Board {
  const left = new Array<number>(26).fill(0);
  for (const [letter, n] of Object.entries(TILE_COUNTS)) left[letter.charCodeAt(0) - A] = n;
  let total = left.reduce((a, b) => a + b, 0);

  const poolSize = 4 + Math.floor(rng() * 7); // 4-10
  const players = Array.from({ length: playerCount }, (_, i) => ({ name: `P${i + 1}`, words: [] as string[] }));
  const used = new Set<string>();

  for (let t = 0; t < TRIES && total > poolSize; t++) {
    const word = list[Math.floor(rng() * list.length)];
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_LEN) continue;
    if (total - word.length < poolSize || used.has(word) || !fits(word, left)) continue;
    for (const ch of word) left[ch.charCodeAt(0) - A]--;
    total -= word.length;
    used.add(word);
    players[Math.floor(rng() * playerCount)].words.push(word);
  }

  const pool = left.map((n, i) => String.fromCharCode(A + i).repeat(n)).join('');
  return { players, pool };
}

function fits(word: string, left: number[]): boolean {
  const need = new Array<number>(26).fill(0);
  for (const ch of word) {
    const i = ch.charCodeAt(0) - A;
    if (++need[i] > left[i]) return false;
  }
  return true;
}
