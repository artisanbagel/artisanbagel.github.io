import type { Board } from '../core/types';

// Text format, one line per entry:
//   POOL: AEQX
//   NAME: WORD WORD ...
// Case-insensitive. Words split on spaces or commas.

export function parseBoard(text: string): Board {
  const board: Board = { players: [], pool: '' };
  let hasPool = false;
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const at = `Line ${i + 1}`;

    const colon = line.indexOf(':');
    if (colon < 0) throw new Error(`${at}: expected NAME: WORDS`);
    const name = line.slice(0, colon).trim();
    if (!name) throw new Error(`${at}: missing name`);

    const items = line.slice(colon + 1).toUpperCase().split(/[\s,]+/).filter(Boolean);
    const bad = items.find((w) => !/^[A-Z]+$/.test(w));
    if (bad) throw new Error(`${at}: "${bad}" is not letters A-Z`);

    if (name.toUpperCase() === 'POOL') {
      if (hasPool) throw new Error(`${at}: second POOL line`);
      hasPool = true;
      board.pool = items.join('');
    } else {
      board.players.push({ name, words: items });
    }
  }
  return board;
}

export function formatBoard(board: Board): string {
  return [
    `POOL: ${board.pool}`,
    ...board.players.map((p) => `${p.name}: ${p.words.join(' ')}`),
  ].join('\n');
}
