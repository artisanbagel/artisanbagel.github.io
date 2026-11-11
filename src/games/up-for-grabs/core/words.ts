// Word lists. Shared by all modes.

export interface Words {
  name: string;
  list: readonly string[]; // uppercase A-Z, no duplicates
  set: ReadonlySet<string>;
}

// Bundled lists, in public/games/up-for-grabs/words/.
export const WORD_LISTS = [
  { id: 'enable', name: 'ENABLE (word game)', file: 'enable.txt' }, // public domain
  { id: 'scowl', name: 'SCOWL (dictionary)', file: 'scowl.txt' }, // npm run build:scowl
];

// One word per line. Text after the first space is ignored; lines that are not letters are skipped.
export function parseWords(name: string, text: string): Words {
  const set = new Set<string>();
  for (const line of text.split('\n')) {
    const word = line.trim().split(/\s/)[0].toUpperCase();
    if (/^[A-Z]+$/.test(word)) set.add(word);
  }
  return { name, list: [...set], set };
}

const cache = new Map<string, Promise<Words>>();

export function loadWords(id: string): Promise<Words> {
  const info = WORD_LISTS.find((l) => l.id === id);
  if (!info) return Promise.reject(new Error(`Unknown word list: ${id}`));
  let loading = cache.get(id);
  if (!loading) {
    loading = fetch(`/games/up-for-grabs/words/${info.file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => parseWords(info.name, text));
    loading.catch(() => cache.delete(id));
    cache.set(id, loading);
  }
  return loading;
}
