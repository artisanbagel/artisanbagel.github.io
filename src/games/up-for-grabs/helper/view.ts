import { MIN_WORD_LENGTH } from '../core/rules';
import type { Board, Move } from '../core/types';

export function sourceWords(board: Board, move: Move): string[] {
  const player = move.player === null ? undefined : board.players[move.player];
  return move.from.map((i) => player?.words[i] ?? '?');
}

// Letters of `a` with each letter of `b` removed once. Null if `b` is not inside `a`.
export function minus(a: string, b: string): string | null {
  const rest = [...a];
  for (const ch of b) {
    const i = rest.indexOf(ch);
    if (i < 0) return null;
    rest.splice(i, 1);
  }
  return rest.join('');
}

function div(className: string, text?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function tiles(letters: string, marked = new Set<number>()): HTMLDivElement {
  const row = div('tiles');
  [...letters].forEach((ch, i) => {
    const tile = document.createElement('span');
    tile.className = marked.has(i) ? 'tile marked' : 'tile';
    tile.textContent = ch;
    row.append(tile);
  });
  return row;
}

// `known`: words outside it are flagged. `move`: its words and pool letters are highlighted.
export function renderBoard(el: HTMLElement, board: Board, known?: ReadonlySet<string>, move?: Move): void {
  const marked = new Set<number>();
  if (move) {
    const pool = [...board.pool];
    for (const ch of minus(move.to, sourceWords(board, move).join('')) ?? '') {
      const i = pool.findIndex((c, j) => c === ch && !marked.has(j));
      if (i >= 0) marked.add(i);
    }
  }

  const pool = div('ufg-pool');
  pool.append(div('ufg-label', `Pool · ${board.pool.length}`), tiles(board.pool, marked));

  const players = div('ufg-players');
  board.players.forEach((p, pi) => {
    const box = div('ufg-player');
    box.append(div('ufg-label', p.name));
    p.words.forEach((w, wi) => {
      const row = tiles(w);
      const invalid =
        w.length < MIN_WORD_LENGTH ? `Shorter than ${MIN_WORD_LENGTH} letters`
        : known && !known.has(w) ? 'Not in word list'
        : '';
      if (invalid) {
        row.classList.add('invalid');
        row.title = invalid;
      }
      if (move?.player === pi && move.from.includes(wi)) row.classList.add('from');
      box.append(row);
    });
    players.append(box);
  });

  el.replaceChildren(pool, players);
}
