// Client entry for the local page: one device, everyone at the same table.
import { formatBoard, parseBoard } from '../core/format';
import { minus } from '../core/letters';
import { Pieces } from '../core/pieces';
import { loadRoots, type Roots } from '../core/roots';
import { MIN_WORD_LENGTH } from '../core/rules';
import { solve, waysToMake } from '../core/solver';
import type { Board, Move } from '../core/types';
import { loadWords, parseWords, type Words } from '../core/words';
import { flip, fromBoard, grab, newGame, poolTileToBag, spell, toBoard, wordToBag, type Game } from './game';
import { readPhoto } from './photo';
import { randomEndPosition } from './random';

const REPORT_URL = 'https://github.com/artisanbagel/artisanbagel.github.io/issues/new';
const MAX_SHOWN = 300; // moves listed after Check
const MAX_HISTORY = 200;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const listSelect = byId<HTMLSelectElement>('ufg-list');
const listFile = byId<HTMLInputElement>('ufg-list-file');
const listInfo = byId<HTMLSpanElement>('ufg-list-info');

const setupEl = byId<HTMLElement>('ufg-setup');
const countSelect = byId<HTMLSelectElement>('ufg-count');
const nameInputs = [...document.querySelectorAll<HTMLInputElement>('.ufg-name')];

const gameEl = byId<HTMLElement>('ufg-game');
const flipBtn = byId<HTMLButtonElement>('ufg-flip');
const undoBtn = byId<HTMLButtonElement>('ufg-undo');
const checkBtn = byId<HTMLButtonElement>('ufg-check');
const editBtn = byId<HTMLButtonElement>('ufg-edit');
const statusEl = byId<HTMLSpanElement>('ufg-status');
const grabForm = byId<HTMLFormElement>('ufg-grab');
const chipsEl = byId<HTMLDivElement>('ufg-chips');
const wordInput = byId<HTMLInputElement>('ufg-word');
const grabMsg = byId<HTMLDivElement>('ufg-grab-msg');

const editorEl = byId<HTMLElement>('ufg-editor');
const photoInput = byId<HTMLInputElement>('ufg-photo');
const photoImg = byId<HTMLImageElement>('ufg-photo-img');
const photoInfo = byId<HTMLSpanElement>('ufg-photo-info');
const randomBtn = byId<HTMLButtonElement>('ufg-random');
const textInput = byId<HTMLTextAreaElement>('ufg-input');
const inputError = byId<HTMLParagraphElement>('ufg-error');

const tableEl = byId<HTMLDivElement>('ufg-table');
const bagBtn = byId<HTMLButtonElement>('ufg-bag');
const bagCount = byId<HTMLSpanElement>('ufg-bag-count');
const poolEl = byId<HTMLDivElement>('ufg-pool');
const seatsEl = byId<HTMLDivElement>('ufg-seats');

const movesPanel = byId<HTMLElement>('ufg-moves-panel');
const result = byId<HTMLParagraphElement>('ufg-result');
const movesEl = byId<HTMLUListElement>('ufg-moves');

let words: Words | undefined;
let roots: Roots | undefined;
const fileLists = new Map<string, Words>(); // loaded from files, by <option> value
let wordsStatus = 'Loading';
let rootsStatus = 'Loading root data'; // empty once loaded

let game: Game = newGame([]);
let history: Game[] = [];
let editing = false;
let editStart: Game | undefined; // state before the first change of an edit session
let seat = -1; // player picked for the next grab
let moves: Move[] = [];
let shown = -1; // move highlighted on the table
const pieces = new Pieces();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(text: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', '', text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const letterCount = (i: number) => game.players[i].words.reduce((n, w) => n + w.length, 0);
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

// --- Rendering

function moveTiles(m: Move): Set<number> {
  const ids = new Set<number>();
  const from: string[] = [];
  if (m.player !== null) {
    for (const i of m.from) {
      const w = game.players[m.player].words[i];
      w.forEach((p) => ids.add(p.id));
      from.push(spell(w));
    }
  }
  for (const ch of minus(m.to, from.join('')) ?? '') {
    const p = game.pool.find((q) => q.letter === ch && !ids.has(q.id));
    if (p) ids.add(p.id);
  }
  return ids;
}

function renderTable() {
  const before = pieces.measure();
  const marked = shown >= 0 ? moveTiles(moves[shown]) : new Set<number>();
  const piece = (p: Game['pool'][number]) => {
    const t = pieces.el(p);
    if (marked.has(p.id)) t.classList.add('marked');
    return t;
  };

  bagCount.textContent = String(game.bag.length);
  bagBtn.disabled = editing || !game.bag.length;
  bagBtn.classList.toggle('empty', !game.bag.length);
  bagBtn.setAttribute('aria-label', `Flip · ${game.bag.length} in the bag`);
  poolEl.replaceChildren(...game.pool.map(piece));

  seatsEl.replaceChildren(
    ...game.players.map((s, i) => {
      const box = el('section', i === seat ? 'ufg-seat picked' : 'ufg-seat');
      const head = el('div', 'ufg-seat-head');
      head.append(el('b', '', s.name), `${plural(letterCount(i), 'letter')} · ${plural(s.words.length, 'word')}`);
      box.append(head);
      s.words.forEach((w, j) => {
        const row = el('div', 'ufg-word');
        row.dataset.seat = String(i);
        row.dataset.word = String(j);
        const text = spell(w);
        const invalid =
          text.length < MIN_WORD_LENGTH ? `Shorter than ${MIN_WORD_LENGTH} letters`
          : words && !words.set.has(text) ? 'Not in word list'
          : '';
        if (invalid) {
          row.classList.add('invalid');
          row.title = invalid;
        }
        row.append(...w.map(piece));
        box.append(row);
      });
      return box;
    }),
  );

  tableEl.classList.toggle('editing', editing);
  pieces.play(before, bagBtn.getBoundingClientRect());
}

function renderChips() {
  chipsEl.replaceChildren(
    ...game.players.map((s, i) => {
      const b = button(s.name, () => pick(i));
      b.setAttribute('aria-pressed', String(i === seat));
      if (i < 9) b.prepend(el('kbd', '', String(i + 1)), ' ');
      return b;
    }),
  );
}

function updateButtons() {
  flipBtn.disabled = editing || !game.bag.length;
  undoBtn.disabled = !history.length;
  checkBtn.disabled = !words || !roots || !!inputError.textContent;
  randomBtn.disabled = !words;
  statusEl.textContent = game.bag.length ? '' : 'Bag empty · Check for moves left';
}

function say(...nodes: (Node | string)[]) {
  grabMsg.replaceChildren(...nodes);
}

// After any change to the game.
function changed(keepText = false) {
  moves = [];
  shown = -1;
  movesPanel.hidden = true;
  if (seat >= game.players.length) seat = -1;
  if (editing && !keepText) {
    textInput.value = formatBoard(toBoard(game));
    inputError.textContent = '';
  }
  say();
  renderChips();
  renderTable();
  updateButtons();
}

function remember(g: Game) {
  history.push(g);
  if (history.length > MAX_HISTORY) history.shift();
}

// All changes in one edit session undo together.
function beforeEdit() {
  if (!editStart) return;
  remember(editStart);
  editStart = undefined;
}

// --- Play

function doFlip() {
  if (editing || !game.bag.length) return;
  remember(game);
  game = flip(game);
  changed();
}

function undo() {
  const prev = history.pop();
  if (!prev) return;
  game = prev;
  if (editing) editStart = game;
  changed();
}

function pick(i: number) {
  seat = i;
  renderChips();
  renderTable();
  wordInput.focus();
}

function fail(reason: string) {
  say(el('span', 'error', reason));
  wordInput.classList.remove('ufg-shake');
  void wordInput.offsetWidth; // restart the animation
  wordInput.classList.add('ufg-shake');
}

function apply(m: Move) {
  const claimer = seat;
  let next: Game;
  try {
    next = grab(game, claimer, m);
  } catch {
    return fail('Board changed. Grab again');
  }
  remember(game);
  game = next;
  seat = -1;
  wordInput.value = '';
  changed();
  say(el('span', 'muted', `${game.players[claimer].name} · ${m.to}`));
}

function tryGrab() {
  const word = wordInput.value.trim().toUpperCase();
  if (!word) return;
  if (seat < 0) return fail('Pick a player');
  if (!words || !roots) return fail('Word list still loading');
  const board = toBoard(game);
  const ways = waysToMake(board, word, words, roots);
  if ('reason' in ways) return fail(ways.reason);
  if (ways.moves.length === 1) return apply(ways.moves[0]);
  // More than one way to make it: the player picks.
  say(el('span', 'muted', 'From'), ...ways.moves.map((m) => button(describe(m, board), () => apply(m))));
}

// --- Check

function describe(m: Move, board: Board): string {
  const owner = m.player === null ? undefined : board.players[m.player];
  const from = owner ? m.from.map((i) => owner.words[i]) : [];
  const parts: string[] = [];
  if (owner) parts.push(`${from.join(' + ')} (${owner.name})`);
  const added = minus(m.to, from.join(''));
  if (added === null) parts.push('?');
  else if (added) parts.push(`${[...added].sort().join('')} (Pool)`);
  return `${parts.join(' + ')} → ${m.to}`;
}

function reportLink(m: Move, text: string, board: Board): HTMLAnchorElement {
  const owner = m.player === null ? undefined : board.players[m.player];
  const from = owner ? m.from.map((i) => owner.words[i]) : [];
  const params = new URLSearchParams({
    title: `Same root: ${from.join(' + ')} → ${m.to}`,
    body: `Move: ${text}\nWord list: ${words?.name ?? '?'}`,
  });
  const a = el('a', '', 'Report');
  a.href = `${REPORT_URL}?${params}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.title = 'Report: new word keeps the root';
  return a;
}

function gameOver(): string {
  const counts = game.players.map((_, i) => letterCount(i));
  const best = Math.max(0, ...counts);
  const leaders = game.players.filter((_, i) => counts[i] === best).map((s) => s.name);
  if (!leaders.length) return 'Game over';
  if (leaders.length > 1) return `Game over · Tie: ${leaders.join(', ')} · ${plural(best, 'letter')}`;
  return `Game over · ${leaders[0]} wins · ${plural(best, 'letter')}`;
}

function check() {
  if (!words || !roots) return;
  const board = toBoard(game);
  const start = performance.now();
  moves = solve(board, words, roots).sort((a, b) => b.to.length - a.to.length || a.to.localeCompare(b.to));
  const ms = Math.round(performance.now() - start);
  shown = -1;

  const parts = [moves.length ? plural(moves.length, 'move') : 'No moves left'];
  if (moves.length > MAX_SHOWN) parts.push(`first ${MAX_SHOWN} shown`);
  parts.push(`${ms} ms`);
  if (!moves.length && !game.bag.length) parts.push(gameOver());
  result.textContent = parts.join(' · ');

  movesEl.replaceChildren(
    ...moves.slice(0, MAX_SHOWN).map((m, i) => {
      const text = describe(m, board);
      const b = button(text, () => {
        shown = shown === i ? -1 : i;
        movesEl.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', String(j === shown)));
        renderTable();
      });
      b.setAttribute('aria-pressed', 'false');
      const li = el('li');
      li.append(b);
      if (m.player !== null) li.append(reportLink(m, text, board));
      return li;
    }),
  );
  movesPanel.hidden = false;
  renderTable();
}

// --- Edit

function setEditing(on: boolean) {
  editing = on;
  editStart = on ? game : undefined;
  editBtn.setAttribute('aria-pressed', String(on));
  editorEl.hidden = !on;
  grabForm.hidden = on;
  changed();
}

function editTo(next: Game, keepText = false) {
  beforeEdit();
  game = next;
  changed(keepText);
}

textInput.addEventListener('input', () => {
  let board: Board;
  try {
    board = parseBoard(textInput.value);
  } catch (e) {
    inputError.textContent = (e as Error).message;
    updateButtons();
    return;
  }
  inputError.textContent = '';
  editTo(fromBoard(board, game), true);
});

tableEl.addEventListener('click', (e) => {
  if (!editing) return;
  const target = e.target as HTMLElement;
  const t = target.closest<HTMLElement>('.ufg-pool .ufg-tile');
  if (t) return editTo(poolTileToBag(game, Number(t.dataset.id)));
  const w = target.closest<HTMLElement>('.ufg-word');
  if (w) editTo(wordToBag(game, Number(w.dataset.seat), Number(w.dataset.word)));
});

randomBtn.addEventListener('click', () => {
  if (!words) return;
  const board = randomEndPosition(words.list, Math.max(2, game.players.length));
  board.players.forEach((p, i) => (p.name = game.players[i]?.name ?? p.name));
  editTo(fromBoard(board, game));
});

let photoUrl = '';
photoInput.addEventListener('change', async () => {
  const file = photoInput.files?.[0];
  photoInput.value = '';
  if (!file) return;
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = URL.createObjectURL(file);
  photoImg.src = photoUrl;
  photoImg.hidden = false;
  photoInfo.textContent = 'Reading photo';
  try {
    const board = await readPhoto(file);
    editTo(fromBoard(board, game));
    photoInfo.textContent = 'Check the text against the photo';
  } catch (e) {
    photoInfo.textContent = `${(e as Error).message}. Type the board from the photo.`;
  }
});

// --- Setup

function showNameInputs() {
  const n = Number(countSelect.value);
  nameInputs.forEach((input, i) => (input.hidden = i >= n));
}

// ':' would break the text format; POOL is the pool's line.
function names(): string[] {
  return nameInputs.slice(0, Number(countSelect.value)).map((input, i) => {
    const name = input.value.replace(/[:\s]+/g, ' ').trim();
    return name && name.toUpperCase() !== 'POOL' ? name : `P${i + 1}`;
  });
}

function start(edit: boolean) {
  game = newGame(names());
  history = [];
  seat = -1;
  setupEl.hidden = true;
  gameEl.hidden = false;
  setEditing(edit);
}

// --- Word lists

function renderInfo() {
  listInfo.textContent = [wordsStatus, rootsStatus].filter(Boolean).join(' · ');
}

function useWords(w: Words) {
  words = w;
  wordsStatus = `${w.list.length.toLocaleString()} words`;
  renderInfo();
  if (!gameEl.hidden) changed(true);
  updateButtons();
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

// --- Events

countSelect.addEventListener('change', showNameInputs);
byId('ufg-start').addEventListener('click', () => start(false));
byId('ufg-setup-board').addEventListener('click', () => start(true));
byId('ufg-new').addEventListener('click', () => {
  if (history.length && !confirm('End this game?')) return;
  gameEl.hidden = true;
  setupEl.hidden = false;
});

flipBtn.addEventListener('click', doFlip);
bagBtn.addEventListener('click', doFlip);
undoBtn.addEventListener('click', undo);
checkBtn.addEventListener('click', check);
editBtn.addEventListener('click', () => setEditing(!editing));

grabForm.addEventListener('submit', (e) => {
  e.preventDefault();
  tryGrab();
});

wordInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  wordInput.value = '';
  wordInput.blur();
  say();
});

// Space flips. Number keys pick a player, also while typing the word.
document.addEventListener('keydown', (e) => {
  if (gameEl.hidden || editing || e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target as HTMLElement;
  const typing = target !== wordInput && !!target.closest('input, textarea, select');
  if (typing) return;
  if (e.key === ' ' && target === document.body) {
    e.preventDefault();
    doFlip();
  } else if (/^[1-9]$/.test(e.key)) {
    const i = Number(e.key) - 1;
    if (i < game.players.length) {
      e.preventDefault();
      pick(i);
    }
  }
});

showNameInputs();
renderInfo();
selectList(listSelect.value);

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
