// Letter tiles as DOM pieces, keyed by tile id. A tile keeps its element when it moves,
// so each move animates from the old place to the new one.

export interface Piece {
  id: number;
  letter: string;
}

interface Place {
  x: number; // center
  y: number;
  w: number;
  h: number;
  rotate: string;
}

const STAGGER = 25; // ms between new tiles
const MAX_STAGGER = 800;

const rootStyle = () => getComputedStyle(document.documentElement);

export function stillMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// --motion and --ease from tokens.css.
export function motion(): { duration: number; easing: string } {
  const s = rootStyle();
  return {
    duration: stillMotion() ? 0 : parseFloat(s.getPropertyValue('--motion')) || 0,
    easing: s.getPropertyValue('--ease').trim() || 'ease',
  };
}

// The same small tilt for a seed every time, so loose tiles look set down by hand. -4 to 4 degrees.
export function tilt(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 8;
}

export function tile(letter: string, seed?: number): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'ufg-tile';
  el.textContent = letter;
  if (seed !== undefined) el.style.setProperty('--tilt', `${tilt(seed).toFixed(1)}deg`);
  return el;
}

export class Pieces {
  private els = new Map<number, HTMLSpanElement>();

  // The element for a tile. State classes are reset on every call.
  el(p: Piece): HTMLSpanElement {
    let el = this.els.get(p.id);
    if (!el) {
      el = tile(p.letter, p.id);
      el.dataset.id = String(p.id);
      this.els.set(p.id, el);
    }
    el.className = 'ufg-tile';
    el.textContent = p.letter;
    return el;
  }

  // Where every tile is now. Call before changing the DOM.
  measure(): Map<number, Place> {
    const out = new Map<number, Place>();
    for (const [id, el] of this.els) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      out.set(id, { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, rotate: getComputedStyle(el).rotate });
    }
    return out;
  }

  // After changing the DOM: tiles slide from where they were. With a `bag`, new tiles flip out of it
  // and removed tiles fly back into it; without one, new tiles pop in.
  play(before: Map<number, Place>, bag?: DOMRect): void {
    const { duration, easing } = motion();
    for (const [id, el] of this.els) {
      if (el.isConnected) continue;
      this.els.delete(id);
      const was = before.get(id);
      if (duration && bag && was) ghost(el, was, bag, duration, easing);
    }
    if (!duration) return;

    let fresh = 0;
    for (const [id, el] of this.els) {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const was = before.get(id);
      if (was) {
        const rotate = getComputedStyle(el).rotate;
        const dx = was.x - x;
        const dy = was.y - y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && rotate === was.rotate) continue;
        el.animate([{ translate: `${dx}px ${dy}px`, rotate: was.rotate }, { translate: '0 0', rotate }], { duration, easing });
      } else if (bag) {
        const delay = Math.min(fresh++ * STAGGER, MAX_STAGGER);
        flipIn(el, bag.left + bag.width / 2 - x, bag.top + bag.height / 2 - y, duration, delay);
      } else {
        el.animate([{ opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1 }], { duration: duration / 2, easing });
      }
    }
  }
}

// Leaves the bag face down, turns over on the way to its place.
function flipIn(el: HTMLElement, dx: number, dy: number, duration: number, delay: number) {
  const s = getComputedStyle(el);
  const face = s.backgroundColor;
  const ink = s.color;
  const back = rootStyle().getPropertyValue('--ufg-back').trim();
  el.animate(
    [
      { offset: 0, translate: `${dx}px ${dy}px`, scale: '1 1', backgroundColor: back, color: 'transparent' },
      { offset: 0.5, scale: '0 1', backgroundColor: back, color: 'transparent' },
      { offset: 0.5, scale: '0 1', backgroundColor: face, color: ink },
      { offset: 1, translate: '0 0', scale: '1 1', backgroundColor: face, color: ink },
    ],
    { duration: duration * 1.5, delay, easing: 'ease-out', fill: 'backwards' },
  );
}

// A removed tile: a copy flies from where it was into the bag.
function ghost(el: HTMLElement, was: Place, bag: DOMRect, duration: number, easing: string) {
  const g = el.cloneNode(true) as HTMLElement;
  g.classList.remove('marked');
  Object.assign(g.style, {
    position: 'fixed',
    left: `${was.x - was.w / 2}px`,
    top: `${was.y - was.h / 2}px`,
    zIndex: '10',
    pointerEvents: 'none',
    rotate: was.rotate,
  });
  document.body.append(g);
  const dx = bag.left + bag.width / 2 - was.x;
  const dy = bag.top + bag.height / 2 - was.y;
  const a = g.animate(
    [
      { translate: '0 0', scale: '1', opacity: 1 },
      { translate: `${dx}px ${dy}px`, scale: '0.6', opacity: 0 },
    ],
    { duration, easing },
  );
  a.onfinish = a.oncancel = () => g.remove();
}
