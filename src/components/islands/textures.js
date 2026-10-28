// Small canvas-generated textures for island decks, paving and edge bands.
// No image assets: every pattern is drawn from a seeded RNG at load time.
import { mulberry32 } from './layout.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

function shade(THREE, tone, dl, ds = 0) {
  return '#' + new THREE.Color(tone).offsetHSL(0, ds, dl).getHexString();
}

function finish(THREE, canvas, repeatX = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, 1);
  t.anisotropy = 4;
  return t;
}

// Deck surface. style.ground picks the pattern, style.tone the base colour.
export function groundTexture(THREE, style, seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);
  const tone = style.tone;
  g.fillStyle = hex(tone);
  g.fillRect(0, 0, 256, 256);

  const specks = (n, cols, r0, r1, alpha) => {
    for (let i = 0; i < n; i++) {
      g.globalAlpha = alpha * (0.4 + rnd() * 0.6);
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.beginPath();
      g.arc(rnd() * 256, rnd() * 256, r0 + rnd() * (r1 - r0), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const tiles = (size, cols, grout) => {
    for (let y = 0; y < 256; y += size)
      for (let x = 0; x < 256; x += size) {
        g.fillStyle = cols[Math.floor(rnd() * cols.length)];
        g.fillRect(x + 1, y + 1, size - 2, size - 2);
      }
    g.strokeStyle = grout;
    g.lineWidth = 2;
    for (let i = 0; i <= 256; i += size) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
  };

  switch (style.ground) {
    case 'tiles':
      tiles(32, [hex(tone), shade(THREE, tone, 0.025), shade(THREE, tone, -0.02)], shade(THREE, tone, -0.08));
      specks(300, [shade(THREE, tone, -0.06), shade(THREE, tone, 0.06)], 0.4, 1.1, 0.45);
      break;
    case 'boards':
      for (let y = 0; y < 256; y += 16) {
        g.fillStyle = [hex(tone), shade(THREE, tone, -0.03), shade(THREE, tone, 0.03)][Math.floor(rnd() * 3)];
        g.fillRect(0, y + 1, 256, 14);
        g.fillStyle = shade(THREE, tone, -0.1);
        for (let x = (y * 7) % 64; x < 256; x += 64) g.fillRect(x, y + 1, 2, 14);
      }
      break;
    case 'rows':
      for (let y = 0; y < 256; y += 16) {
        g.fillStyle = (y / 16) % 2 ? shade(THREE, tone, -0.1, -0.1) : hex(tone);
        g.fillRect(0, y, 256, 16);
      }
      specks(500, [shade(THREE, tone, 0.06), shade(THREE, tone, -0.08)], 0.6, 1.6, 0.6);
      break;
    case 'checker':
      for (let y = 0; y < 256; y += 32)
        for (let x = 0; x < 256; x += 32) {
          g.fillStyle = [hex(tone), '#f2c4d0', '#f6e3a6', '#c4e2c4'][((x + y) / 32) % 4];
          g.fillRect(x + 1, y + 1, 30, 30);
        }
      break;
    case 'court':
      g.strokeStyle = '#f6eee6';
      g.lineWidth = 3;
      for (let y = 16; y < 256; y += 32) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(256, y);
        g.stroke();
      }
      specks(800, [shade(THREE, tone, -0.05), shade(THREE, tone, 0.05)], 0.4, 1.0, 0.55);
      break;
    case 'gravel':
      specks(2400, [shade(THREE, tone, -0.07), shade(THREE, tone, 0.07), shade(THREE, tone, -0.12), shade(THREE, tone, 0.03)], 0.5, 1.6, 0.8);
      break;
    default: {
      // grass with a sprinkle of flowers
      specks(3000, [shade(THREE, tone, -0.05), shade(THREE, tone, 0.05), shade(THREE, tone, -0.09), shade(THREE, tone, 0.02)], 0.4, 1.4, 0.55);
      specks(60, ['#f3e7a6', '#ffffff', '#f2c4b2', '#d9c6f0'], 0.9, 1.6, 0.85);
    }
  }
  return finish(THREE, c);
}

// Pale paving for the walking ring around each deck.
export function ringTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const rnd = mulberry32(5);
  g.fillStyle = '#c9c2b8';
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16)
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = ['#f6f3ee', '#efebe4', '#faf8f4'][Math.floor(rnd() * 3)];
      g.fillRect(x + 1, y + 1, 14, 14);
    }
  return finish(THREE, c);
}

// Decorated strip just below each deck edge — the island's "edge identity".
export function bandTexture(THREE, style, seed) {
  const [kind, a, b] = style.band;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);
  g.fillStyle = a;
  g.fillRect(0, 0, 512, 64);
  switch (kind) {
    case 'bricks':
      for (let y = 0; y < 64; y += 16)
        for (let x = (y / 16) % 2 ? -16 : 0; x < 512; x += 32) {
          g.fillStyle = rnd() < 0.5 ? a : b;
          g.fillRect(x + 1, y + 1, 30, 14);
        }
      break;
    case 'stripes':
      for (let x = 0; x < 512; x += 32) {
        g.fillStyle = (x / 32) % 2 ? a : b;
        g.fillRect(x, 0, 32, 64);
      }
      break;
    case 'glass':
      for (let x = 0; x < 512; x += 32) {
        g.fillStyle = b;
        g.fillRect(x + 2, 6, 26, 52);
        g.fillStyle = '#3e7c8c';
        g.fillRect(x, 0, 2, 64);
      }
      break;
    case 'timber':
      for (let x = 0; x < 512; x += 24) {
        g.fillStyle = rnd() < 0.5 ? a : b;
        g.fillRect(x + 1, 0, 22, 64);
      }
      break;
    case 'ivy':
      for (let x = 0; x < 512; x += 6) {
        const h = 12 + rnd() * 40;
        g.fillStyle = b;
        g.fillRect(x, 0, 5, h);
        g.beginPath();
        g.arc(x + 2.5, h, 3.5, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 'dots':
      for (let k = 0; k < 40; k++) {
        g.fillStyle = [a, b, '#fcea8b', '#db6a41', '#ffffff', '#6f7fb5'][k % 6];
        g.beginPath();
        g.arc(rnd() * 512, rnd() * 64, 6 + rnd() * 14, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 'hazard':
      g.fillStyle = b;
      for (let x = -64; x < 576; x += 32) {
        g.beginPath();
        g.moveTo(x, 64);
        g.lineTo(x + 16, 64);
        g.lineTo(x + 48, 0);
        g.lineTo(x + 32, 0);
        g.fill();
      }
      break;
  }
  return finish(THREE, c, 3);
}
