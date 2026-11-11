// Builds public/games/up-for-grabs/roots.txt from MorphyNet English.
// Run: npm run build:roots
//
// Output: one line per word: WORD LONGER LONGER ...
// LONGER keeps WORD's root. Only words in the bundled word lists, WORD 4+ letters,
// LONGER holds every letter of WORD. Chains are followed (happy → unhappy → unhappily).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { MIN_WORD_LENGTH } from '../src/games/up-for-grabs/core/rules.ts';

const MORPHYNET = 'https://raw.githubusercontent.com/kbatsuren/MorphyNet/378144f64df58c78db5245af19d16a511ccecf3a/eng';
const DATA = new URL('../public/games/up-for-grabs/', import.meta.url);
const WORD = /^[a-z]+$/;

// Union of bundled word lists.
const known = new Set();
for (const file of readdirSync(new URL('words/', DATA))) {
  for (const line of readFileSync(new URL(`words/${file}`, DATA), 'utf8').split('\n')) {
    const w = line.trim().toLowerCase();
    if (WORD.test(w)) known.add(w);
  }
}

// base -> derived or inflected forms, over all MorphyNet words (chains can pass through words not in the lists).
const next = new Map();
for (const file of ['eng.derivational.v1.tsv', 'eng.inflectional.v1.tsv']) {
  const res = await fetch(`${MORPHYNET}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  for (const line of (await res.text()).split('\n')) {
    const [a, b] = line.split('\t').map((s) => s?.toLowerCase());
    if (!a || !b || a === b || !WORD.test(a) || !WORD.test(b)) continue;
    if (!next.has(a)) next.set(a, new Set());
    next.get(a).add(b);
  }
}

function descendants(word) {
  const seen = new Set();
  const stack = [word];
  while (stack.length) {
    for (const n of next.get(stack.pop()) ?? []) {
      if (n !== word && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen;
}

function holdsAll(big, small) {
  const count = new Array(26).fill(0);
  for (const ch of big) count[ch.charCodeAt(0) - 97]++;
  for (const ch of small) if (--count[ch.charCodeAt(0) - 97] < 0) return false;
  return big.length > small.length;
}

const lines = ['# Derived from MorphyNet (github.com/kbatsuren/MorphyNet), CC BY-SA 3.0.'];
let pairs = 0;
for (const base of [...next.keys()].sort()) {
  if (base.length < MIN_WORD_LENGTH || !known.has(base)) continue;
  const longer = [...descendants(base)].filter((w) => known.has(w) && holdsAll(w, base)).sort();
  if (!longer.length) continue;
  lines.push(`${base} ${longer.join(' ')}`);
  pairs += longer.length;
}

writeFileSync(new URL('roots.txt', DATA), lines.join('\n') + '\n');
console.log(`roots.txt: ${lines.length - 1} words, ${pairs} pairs`);
