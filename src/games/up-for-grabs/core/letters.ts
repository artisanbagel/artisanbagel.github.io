// Letter helpers. Uppercase A-Z only.
const A = 65;

// Count of each letter, A at index 0.
export function counts(word: string): Uint8Array {
  const c = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) c[word.charCodeAt(i) - A]++;
  return c;
}

// One bit per letter present.
export function mask(word: string): number {
  let m = 0;
  for (let i = 0; i < word.length; i++) m |= 1 << (word.charCodeAt(i) - A);
  return m;
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
