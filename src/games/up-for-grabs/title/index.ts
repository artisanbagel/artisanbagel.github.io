// Title screen: letter tiles drifting behind the menu. Play opens the second menu (#play).
import { motion, stillMotion, tile } from '../core/pieces';
import { TILE_COUNTS } from '../core/tiles';

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const stage = byId('ufg-stage');
const layer = byId('ufg-float');
const mainMenu = byId('ufg-main');
const playMenu = byId('ufg-play-menu');

// --- Menu

function showMenu(focus: boolean) {
  const play = location.hash === '#play';
  mainMenu.hidden = play;
  playMenu.hidden = !play;
  if (focus) (play ? playMenu : mainMenu).querySelector<HTMLElement>('a, button')?.focus();
}

byId('ufg-play').addEventListener('click', () => {
  location.hash = 'play';
});
byId('ufg-back').addEventListener('click', () => {
  history.pushState(null, '', location.pathname);
  showMenu(true);
});
window.addEventListener('hashchange', () => showMenu(true));
showMenu(false);

// --- Title tiles land in place

const { duration, easing } = motion();
if (duration) {
  stage.querySelectorAll<HTMLElement>('.ufg-title .ufg-tile').forEach((el, i) => {
    const rotate = getComputedStyle(el).rotate;
    const angle = Math.random() * Math.PI * 2;
    const far = 200 + Math.random() * 200;
    el.animate(
      [
        { translate: `${Math.cos(angle) * far}px ${Math.sin(angle) * far}px`, rotate: `${Math.random() * 180 - 90}deg`, opacity: 0 },
        { translate: '0 0', rotate, opacity: 1 },
      ],
      { duration: duration * 2.5, delay: 150 + i * 60, easing, fill: 'backwards' },
    );
  });
}

// --- Floating tiles

const LETTERS = Object.entries(TILE_COUNTS).flatMap(([letter, n]) => Array<string>(n).fill(letter));
const COUNT = 28;
const PUSH_RADIUS = 140; // px
const PUSH = 1400; // px/s², at the pointer
const SETTLE = 1.2; // per second, back to drifting speed

interface Float {
  el: HTMLElement;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bx: number; // drifting velocity
  by: number;
  r: number;
  vr: number;
}

let width = stage.clientWidth;
let height = stage.clientHeight;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

const floats: Float[] = Array.from({ length: COUNT }, () => {
  const el = tile(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  el.style.setProperty('--ufg-tile', `${rand(1.4, 2.6).toFixed(2)}rem`);
  layer.append(el);
  const size = el.offsetWidth;
  const angle = rand(0, Math.PI * 2);
  const speed = rand(8, 26);
  const f: Float = {
    el,
    size,
    x: rand(0, Math.max(0, width - size)),
    y: rand(0, Math.max(0, height - size)),
    vx: 0,
    vy: 0,
    bx: Math.cos(angle) * speed,
    by: Math.sin(angle) * speed,
    r: rand(-30, 30),
    vr: rand(-12, 12),
  };
  f.vx = f.bx;
  f.vy = f.by;
  return f;
});

function draw(f: Float) {
  f.el.style.translate = `${f.x.toFixed(1)}px ${f.y.toFixed(1)}px`;
  f.el.style.rotate = `${f.r.toFixed(1)}deg`;
}

floats.forEach(draw);

if (!stillMotion()) {
  const pointer = { x: -1e4, y: -1e4 };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  stage.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -1e4;
  });
  new ResizeObserver(() => {
    width = stage.clientWidth;
    height = stage.clientHeight;
  }).observe(stage);

  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const f of floats) {
      const dx = f.x + f.size / 2 - pointer.x;
      const dy = f.y + f.size / 2 - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < PUSH_RADIUS && d > 1) {
        const k = ((PUSH_RADIUS - d) / PUSH_RADIUS) * PUSH * dt;
        f.vx += (dx / d) * k;
        f.vy += (dy / d) * k;
        f.vr += (dx > 0 ? 1 : -1) * k * 0.2;
      }
      f.vx += (f.bx - f.vx) * SETTLE * dt;
      f.vy += (f.by - f.vy) * SETTLE * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.r += f.vr * dt;
      f.vr *= 1 - Math.min(1, dt);
      if (Math.abs(f.vr) < 6) f.vr = Math.sign(f.vr || 1) * 6;

      // Bounce off the stage edges.
      const maxX = width - f.size;
      const maxY = height - f.size;
      if (f.x < 0 || f.x > maxX) {
        const dir = f.x < 0 ? 1 : -1;
        f.x = Math.max(0, Math.min(maxX, f.x));
        f.vx = dir * Math.abs(f.vx);
        f.bx = dir * Math.abs(f.bx);
      }
      if (f.y < 0 || f.y > maxY) {
        const dir = f.y < 0 ? 1 : -1;
        f.y = Math.max(0, Math.min(maxY, f.y));
        f.vy = dir * Math.abs(f.vy);
        f.by = dir * Math.abs(f.by);
      }
      draw(f);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
