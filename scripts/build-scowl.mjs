// Builds public/games/up-for-grabs/words/scowl.txt from SCOWL size 70 (en_US large speller list).
// Run: npm run build:scowl, then npm run build:roots.
// Keeps lowercase letter-only words: drops names, abbreviations, possessives.

import { writeFileSync } from 'node:fs';

const RELEASE = '2026.02.25';
const BASE = `https://raw.githubusercontent.com/en-wl/wordlist-diff/rel-${RELEASE}`;
const LIST = 'en_US-large.txt'; // size 70; en_US.txt is size 60

async function get(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.text();
}

const [list, copyright] = await Promise.all([get(LIST), get('Copyright')]);

// Speller lists need only the first two paragraphs: copyright line and permission notice.
const notice = copyright.split(/\n\s*\n/).slice(0, 2).join('\n\n');
const words = [...new Set(list.split(/\r?\n/).map((w) => w.trim()).filter((w) => /^[a-z]+$/.test(w)))].sort();

const header = [
  `SCOWL size 70 (${LIST}), github.com/en-wl/wordlist, release ${RELEASE}. Lowercase letter-only words.`,
  '',
  ...notice.split('\n'),
].map((line) => `# ${line}`.trimEnd());

writeFileSync(new URL('../public/games/up-for-grabs/words/scowl.txt', import.meta.url), [...header, ...words].join('\n') + '\n');
console.log(`scowl.txt: ${words.length} words`);
