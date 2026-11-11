import type { Roots } from '../core/roots';
import type { Board, Move } from '../core/types';
import type { Words } from '../core/words';

// Every move left on the board. Empty list: no words left.
// A move rearranges letters into a new word from `words`. Letters come from:
//   the pool only                              player: null, from: []
//   one or more of one player's words + pool   player: p,    from: [i, ...]
// Every move uses at least one pool letter. Never words from two players.
// The new word has at least MIN_WORD_LENGTH letters (core/rules.ts) and may not
// keep the root of any word it uses: roots.get(OLD)?.has(NEW) means same root.
export function solve(board: Board, words: Words, roots: Roots): Move[] {
  throw new Error('Solver not implemented');
}
