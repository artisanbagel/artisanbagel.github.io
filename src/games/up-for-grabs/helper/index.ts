// Client entry for the helper page.
import { loadRoots, type Roots } from '../core/roots';
import type { Board, Move } from '../core/types';
import { loadWords, parseWords, type Words } from '../core/words';
import { formatBoard, parseBoard } from './format';
import { randomEndPosition } from './random';
import { solve } from './solver';
import { minus, renderBoard, sourceWords } from './view';

const REPORT_URL = 'https://github.com/artisanbagel/artisanbagel.github.io/issues/new';

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const listSelect = byId<HTMLSelectElement>('ufg-list');
const listFile = byId<HTMLInputElement>('ufg-list-file');
const listInfo = byId<HTMLSpanElement>('ufg-list-info');
const boardEl = byId<HTMLDivElement>('ufg-board');
const solveBtn = byId<HTMLButtonElement>('ufg-solve');
const result = byId<HTMLSpanElement>('ufg-result');
const movesEl = byId<HTMLUListElement>('ufg-moves');
const playerCount = byId<HTMLSelectElement>('ufg-players');
const randomBtn = byId<HTMLButtonElement>('ufg-random');
const input = byId<HTMLTextAreaElement>('ufg-input');
const inputError = byId<HTMLParagraphElement>('ufg-error');

let words: Words | undefined;
let roots: Roots | undefined;
const fileLists = new Map<string, Words>(); // loaded from files, by <option> value
let board: Board = { players: [], pool: '' };
let moves: Move[] = [];
let selected = -1;

let wordsStatus = 'Loading';
let rootsStatus = 'Loading root data'; // empty once loaded

function renderInfo() {
  listInfo.textContent = [wordsStatus, rootsStatus].filter(Boolean).join(' · ');
}

function updateButtons() {
  randomBtn.disabled = !words;
  solveBtn.disabled = !words || !roots || !!inputError.textContent;
}

function draw() {
  renderBoard(boardEl, board, words?.set, moves[selected]);
}

function showBoard(b: Board) {
  board = b;
  moves = [];
  selected = -1;
  result.textContent = '';
  movesEl.replaceChildren();
  draw();
}

// All board input goes through here: random, and later CV. Typed text uses showBoard.
function setBoard(b: Board) {
  input.value = formatBoard(b);
  inputError.textContent = '';
  updateButtons();
  showBoard(b);
}

function randomBoard(list: readonly string[]): Board {
  return randomEndPosition(list, Number(playerCount.value));
}

// --- Word lists

function useWords(w: Words) {
  words = w;
  wordsStatus = `${w.list.length.toLocaleString()} words`;
  renderInfo();
  updateButtons();
  showBoard(board);
}

async function selectList(value: string) {
  const fromFile = fileLists.get(value);
  if (fromFile) return useWords(fromFile);
  wordsStatus = 'Loading';
  renderInfo();
  try {
    const w = await loadWords(value);
    if (listSelect.value === value) useWords(w);
  } catch (e) {
    wordsStatus = `Failed to load: ${(e as Error).message}`;
    renderInfo();
  }
}

listSelect.addEventListener('change', () => selectList(listSelect.value));

// Read in the browser only; never uploaded.
listFile.addEventListener('change', async () => {
  const file = listFile.files?.[0];
  listFile.value = '';
  if (!file) return;
  const w = parseWords(file.name, await file.text());
  if (!w.list.length) {
    wordsStatus = `${file.name}: no words found`;
    renderInfo();
    return;
  }
  const value = `file:${file.name}`;
  fileLists.set(value, w);
  if (![...listSelect.options].some((o) => o.value === value)) listSelect.add(new Option(file.name, value));
  listSelect.value = value;
  useWords(w);
});

// --- Moves

function describe(m: Move): string {
  const from = sourceWords(board, m);
  const parts: string[] = [];
  if (m.player !== null) parts.push(`${from.join(' + ')} (${board.players[m.player]?.name ?? '?'})`);
  const added = minus(m.to, from.join(''));
  if (added === null) parts.push('?');
  else if (added) parts.push(`${[...added].sort().join('')} (Pool)`);
  return `${parts.join(' + ')} → ${m.to}`;
}

function reportLink(m: Move, text: string): HTMLAnchorElement {
  const params = new URLSearchParams({
    title: `Same root: ${sourceWords(board, m).join(' + ')} → ${m.to}`,
    body: `Move: ${text}\nWord list: ${words?.name ?? '?'}`,
  });
  const a = document.createElement('a');
  a.href = `${REPORT_URL}?${params}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = 'Report';
  a.title = 'Report: new word keeps the root';
  return a;
}

function renderMoves() {
  movesEl.replaceChildren(
    ...moves.map((m, i) => {
      const text = describe(m);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        selected = selected === i ? -1 : i;
        movesEl.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === selected)));
        draw();
      });
      const li = document.createElement('li');
      li.append(btn);
      if (m.player !== null) li.append(reportLink(m, text));
      return li;
    }),
  );
}

// --- Events

input.addEventListener('input', () => {
  try {
    showBoard(parseBoard(input.value));
    inputError.textContent = '';
  } catch (e) {
    inputError.textContent = (e as Error).message;
  }
  updateButtons();
});

randomBtn.addEventListener('click', () => {
  if (words) setBoard(randomBoard(words.list));
});

solveBtn.addEventListener('click', () => {
  if (!words || !roots) return;
  showBoard(board);
  const start = performance.now();
  try {
    moves = solve(board, words, roots);
  } catch (e) {
    console.error(e);
    result.textContent = (e as Error).message;
    return;
  }
  const ms = Math.round(performance.now() - start);
  result.textContent = `${moves.length ? `${moves.length} moves` : 'No moves left'} · ${ms} ms`;
  renderMoves();
});

selectList(listSelect.value).then(() => {
  if (words && !input.value.trim()) setBoard(randomBoard(words.list));
});

loadRoots()
  .then((r) => {
    roots = r;
    rootsStatus = '';
  })
  .catch((e: Error) => {
    rootsStatus = `Root data failed to load: ${e.message}`;
  })
  .finally(() => {
    renderInfo();
    updateButtons();
  });
