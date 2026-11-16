// Root data. Shared by all modes.
// roots.get(WORD) holds the longer words that keep WORD's root. Uppercase.
// Files: public/games/up-for-grabs/roots.txt (built by `npm run build:roots`)
// and roots-extra.txt (by hand, from reports).

export type Roots = ReadonlyMap<string, ReadonlySet<string>>;

function parse(text: string, into: Map<string, Set<string>>) {
  for (const line of text.split('\n')) {
    if (line.startsWith('#')) continue;
    const [base, ...longer] = line.trim().toUpperCase().split(/\s+/);
    if (!base || !longer.length) continue;
    const set = into.get(base) ?? new Set<string>();
    for (const w of longer) set.add(w);
    into.set(base, set);
  }
}

async function fetchText(file: string): Promise<string> {
  const res = await fetch(`/games/up-for-grabs/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.text();
}

let loading: Promise<Roots> | undefined;

export function loadRoots(): Promise<Roots> {
  loading ??= Promise.all([fetchText('roots.txt'), fetchText('roots-extra.txt')]).then(([main, extra]) => {
    const roots = new Map<string, Set<string>>();
    parse(main, roots);
    const extras = new Map<string, Set<string>>();
    parse(extra, extras);
    // An extra pair WORD LONGER also covers everything that keeps LONGER's root.
    for (const [base, longer] of extras) {
      const set = roots.get(base) ?? new Set<string>();
      for (const w of longer) {
        set.add(w);
        for (const x of roots.get(w) ?? []) set.add(x);
      }
      roots.set(base, set);
    }
    return roots;
  });
  return loading;
}
