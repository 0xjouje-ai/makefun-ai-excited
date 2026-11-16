// Draws a tiny astronaut watching a ringed planet above an aurora and moon.
// The scene is rendered procedurally per pixel, then encoded as a PNG with a
// small built-in encoder using node:zlib (plus Node's filesystem APIs).
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

const W = 1024, H = 1024;
const rgb = Buffer.alloc(W * H * 3);
const clamp = (v: number) => Math.max(0, Math.min(255, v));
const smooth = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(x: number, y: number) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return smooth(smooth(hash(ix, iy), hash(ix + 1, iy), u), smooth(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}
function setPixel(x: number, y: number, r: number, g: number, b: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3; rgb[i] = clamp(r); rgb[i + 1] = clamp(g); rgb[i + 2] = clamp(b);
}

for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const t = y / H, horizon = Math.exp(-Math.pow((y - 700) / 38, 2));
  let r = smooth(8, 28, t) + 88 * horizon, g = smooth(8, 8, t) + 44 * horizon, b = smooth(39, 73, t) + 28 * horizon;
  // broad aurora ribbons
  const wave = 645 + 65 * Math.sin(x / 180) + 28 * Math.sin(x / 67);
  for (const [off, col, width] of [[-105, [15, 184, 182], 30], [-42, [218, 35, 157], 24], [22, [105, 61, 226], 34]] as const) {
    const d = Math.abs(y - (wave + off + 0.00035 * (x - 500) * (x - 500)));
    const glow = Math.exp(-d / width) * (y < 750 ? 1 : 0);
    r += col[0] * glow * .42; g += col[1] * glow * .42; b += col[2] * glow * .42;
  }
  // tiny restrained grain for texture
  const grain = (noise(x / 42, y / 42) - .5) * 3;
  setPixel(x, y, r + grain, g + grain, b + grain);
}

// Stars, with deterministic placement, varied sizes and additive soft halos.
function glowPixel(x: number, y: number, r: number, g: number, b: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  setPixel(x, y, rgb[i] + r, rgb[i + 1] + g, rgb[i + 2] + b);
}
for (let i = 0; i < 440; i++) {
  const x = Math.floor(hash(i, 7) * W), y = Math.floor(hash(i, 19) * 690);
  const a = 105 + hash(i, 31) * 150, size = hash(i, 43);
  const radius = size > .96 ? 3 : size > .76 ? 1 : 0;
  const warm = hash(i, 59) > .8;
  for (let oy = -radius; oy <= radius; oy++) for (let ox = -radius; ox <= radius; ox++) {
    const falloff = Math.exp(-(ox * ox + oy * oy) / (radius === 3 ? 1.7 : .75));
    glowPixel(x + ox, y + oy, a * (warm ? 1 : .78) * falloff, a * .88 * falloff, a * (warm ? .72 : 1) * falloff);
  }
}
// Small cratered moon balances the open upper-left sky.
const mx = 205, my = 145, mr = 43;
const craters = [[-15, -12, 9], [11, -23, 6], [17, 6, 12], [-10, 22, 7], [-28, 7, 5], [0, 4, 4]];
for (let y = my - mr; y <= my + mr; y++) for (let x = mx - mr; x <= mx + mr; x++) {
  const dx = x - mx, dy = y - my, radius = Math.hypot(dx, dy) / mr;
  if (radius >= 1) continue;
  const z = Math.sqrt(1 - radius * radius);
  const light = .22 + .78 * Math.max(0, -.48 * dx / mr - .35 * dy / mr + .8 * z);
  let relief = 1 + (noise(x / 9, y / 9) - .5) * .16;
  for (const [cx, cy, r] of craters) {
    const distance = Math.hypot(dx - cx, dy - cy) / r;
    relief -= .26 * Math.exp(-(distance ** 2) * 2);
    relief += .14 * Math.exp(-(((distance - .95) / .16) ** 2)) * (.6 - .4 * (dx - cx + dy - cy) / (r * 2));
  }
  setPixel(x, y, 168 * light * relief, 181 * light * relief, 201 * light * relief);
}
// Shooting stars.
for (const [sx, sy, len] of [[170, 250, 95], [410, 180, 75], [850, 180, 110]]) for (let k = 0; k < len; k++) {
  const x = sx + k, y = sy + Math.floor(k * .38), a = 220 * (1 - k / len);
  setPixel(x, y, a, a * .86, a * .65); setPixel(x, y + 1, a * .5, a * .4, a * .3);
}

// Planet disc and atmosphere.
const pcx = 748, pcy = 345, pr = 278;
for (let y = Math.max(0, pcy - pr - 8); y <= pcy + pr + 8; y++) for (let x = pcx - pr - 8; x <= pcx + pr + 8; x++) {
  const dx = x - pcx, dy = y - pcy, d = Math.hypot(dx, dy);
  if (d < pr + 12) {
    const edge = Math.max(0, Math.min(1, (pr + 12 - d) / 12));
    if (d <= pr) {
      const nx = dx / pr, ny = dy / pr, z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const phase = (noise(nx * 2.2 + 9, ny * 3 + 4) - .5) * 1.4
        + .18 * Math.sin(nx * 5 + ny * 3);
      const amplitude = .25 + .13 * noise(nx * 3 + 21, ny * 2 + 7);
      const band = .5 + amplitude * Math.sin(ny * 8 * Math.PI + phase)
        + .06 * Math.sin(ny * 19 * Math.PI + phase * 2);
      const illumination = -.48 * nx - .24 * ny + .84 * z;
      const terminator = smooth(.46, 1, Math.max(0, Math.min(1, (illumination + .12) / .55)));
      const light = (.48 + .52 * Math.pow(z, .65)) * terminator;
      const rr = smooth(195, 238, band) * light, gg = smooth(82, 158, band) * light, bb = smooth(52, 126, band) * light;
      setPixel(x, y, rr, gg, bb);
    } else setPixel(x, y, 42 * edge, 170 * edge, 204 * edge);
  }
}
// Tilted elliptical rings, drawn as luminous arcs around the planet.
const ang = -0.22, ca = Math.cos(ang), sa = Math.sin(ang);
for (let y = 0; y < 720; y++) for (let x = 360; x < W; x++) {
  const dx = x - pcx, dy = y - pcy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
  const e = Math.abs(Math.hypot(u / 390, v / 105) - 1);
  if (e < .035 && (v > 18 || dx > 0)) { const glow = Math.exp(-e * 45); setPixel(x, y, 225 * glow, 155 * glow, 77 * glow); }
}

// Glowing horizon and jagged cliff silhouette.
for (let x = 0; x < W; x++) {
  const top = 746 + 10 * Math.sin(x / 47) + 5 * Math.sin(x / 13);
  for (let y = Math.floor(top); y < H; y++) {
    const edge = y - top; const jag = 20 * Math.sin(x / 31) + 11 * Math.sin(x / 9);
    const cliffTop = top + jag * Math.max(0, (x - 80) / 944);
    if (y >= cliffTop) { const shade = 12 + 22 * (1 - y / H); setPixel(x, y, shade, 7, 28 + shade); }
  }
  const glow = Math.exp(-Math.pow((top - 734) / 18, 2)); setPixel(x, Math.floor(top), 245 * glow, 130 * glow, 80 * glow);
}
// Astronaut silhouette on the ridge.
for (let y = 625; y < 753; y++) for (let x = 466; x < 516; x++) {
  const ax = 491 + (x - 491) / 1.17, ay = 753 + (y - 753) / 1.17;
  const body = ((ax - 491) / 13) ** 2 + ((ay - 699) / 38) ** 2 < 1;
  const head = (ax - 491) ** 2 + (ay - 656) ** 2 < 13 ** 2;
  const pack = ax > 473 && ax < 481 && ay > 675 && ay < 716;
  const leg = (ax > 480 && ax < 489 && ay > 720) || (ax > 494 && ax < 502 && ay > 720);
  if (body || head || pack || leg) setPixel(x, y, 3, 5, 15);
}
// Tiny cyan visor light on the planet-facing side of the helmet.
for (let y = 635; y <= 644; y++) for (let x = 494; x <= 503; x++) {
  const glow = Math.exp(-((x - 499) ** 2 + (y - 640) ** 2) / 3);
  glowPixel(x, y, 65 * glow, 235 * glow, 255 * glow);
}

function crc32(buf: Buffer) { let c = 0xffffffff; for (const n of buf) { c ^= n; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Buffer) { const t = Buffer.from(type); const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); t.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([t, data])), 8 + data.length); return out; }
const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output'; fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, 'entry.png'), png);
