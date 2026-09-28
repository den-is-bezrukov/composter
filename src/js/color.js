// ---- Illustration colour: selective correction of bright reds and warm cast (tuned in the colour lab) ----
const COLOR0 = { hue: 0, sat: 100, val: 100, cast: 0 }, FEATHER0 = 3;
const color = { ...COLOR0, feather: FEATHER0, cache: null, out: null, showOriginal: false, raf: 0 };
const colorChanged = () => Object.keys(COLOR0).some(k => color[k] !== COLOR0[k]);
const sm = (e0, e1, x) => { let t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const angDist = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

function boxBlur(m, w, h, r) {
  const tmp = new Float32Array(m.length), win = 2 * r + 1;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0; const row = y * w;
      for (let x = -r; x <= r; x++) acc += m[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) { tmp[row + x] = acc / win; acc += m[row + Math.min(w - 1, x + r + 1)] - m[row + Math.max(0, x - r)]; }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) { m[y * w + x] = acc / win; acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
    }
  }
}

// HSV channels and masks are built once per picture; the sliders only re-run the cheap part
function colorAnalyse(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const src = x.getImageData(0, 0, w, h), d = src.data, n = w * h;
  const H = new Float32Array(n), S = new Float32Array(n), V = new Float32Array(n), R = new Float32Array(n), C = new Float32Array(n);
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
    let hu = 0;
    if (dl > 1e-6) { if (mx === r) hu = ((g - b) / dl) % 6; else if (mx === g) hu = (b - r) / dl + 2; else hu = (r - g) / dl + 4; hu *= 60; if (hu < 0) hu += 360; }
    const s = mx > 1e-6 ? dl / mx : 0;
    H[j] = hu; S[j] = s; V[j] = mx;
    const red = sm(45, 25, angDist(hu, 0)) * sm(0.45, 0.6, s) * sm(0.3, 0.45, mx);
    R[j] = red;
    C[j] = sm(70, 45, angDist(hu, 25)) * (1 - red) * sm(0.04, 0.12, s) * (1 - sm(0.75, 0.9, mx));
  }
  color.cache = { w, h, src, H, S, V, rawR: R, rawC: C, feather: -1, canvas: c, ctx: x };
}

function applyColor() {
  color.raf = 0;
  if (!state.img || !colorChanged()) { color.out = null; draw(); return; }
  if (!color.cache) colorAnalyse(state.img);
  if (color.cache.feather !== color.feather) {
    // Feather in px of a 1600 px picture, scaled to this picture's size
    const k0 = color.cache, r = Math.round(color.feather * Math.max(k0.w, k0.h) / 1600);
    k0.R = k0.rawR.slice(); k0.C = k0.rawC.slice();
    if (r > 0) { boxBlur(k0.R, k0.w, k0.h, r); boxBlur(k0.C, k0.w, k0.h, r); }
    k0.feather = color.feather;
  }
  // Lab recipe for a softer coral: hue +5°, saturation 85%, brightness 122%, cast 70%
  const k = color.cache, dh = color.hue, ds = color.sat / 100, dv = color.val / 100, cast = color.cast / 100;
  const out = k.ctx.createImageData(k.w, k.h), d = k.src.data, o = out.data;
  for (let j = 0, i = 0; j < k.R.length; j++, i += 4) {
    o[i + 3] = d[i + 3];
    const red = k.R[j], cm = k.C[j];
    if (red < 0.002 && cm < 0.002) { o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; continue; }
    const h = k.H[j] + dh * red;
    let s = k.S[j] * (1 + (ds - 1) * red) * (1 - cast * cm), v = k.V[j] * (1 + (dv - 1) * red);
    s = s > 1 ? 1 : s; v = v > 1 ? 1 : v;
    const hh = ((h % 360) + 360) % 360 / 60, q6 = Math.floor(hh) % 6, f = hh - Math.floor(hh);
    const p = v * (1 - s), q = v * (1 - s * f), tt = v * (1 - s * (1 - f));
    let r, g, b;
    if (q6 === 0) { r = v; g = tt; b = p; } else if (q6 === 1) { r = q; g = v; b = p; } else if (q6 === 2) { r = p; g = v; b = tt; }
    else if (q6 === 3) { r = p; g = q; b = v; } else if (q6 === 4) { r = tt; g = p; b = v; } else { r = v; g = p; b = q; }
    o[i] = r * 255 + 0.5; o[i + 1] = g * 255 + 0.5; o[i + 2] = b * 255 + 0.5;
  }
  if (!color.out) color.out = document.createElement('canvas');
  color.out.width = k.w; color.out.height = k.h;
  color.out.getContext('2d').putImageData(out, 0, 0);
  draw();
}

// ---- Controls ----
const scheduleColor = () => { if (!color.raf) color.raf = requestAnimationFrame(applyColor); };
const COLOR_UI = { hue: 'cHue', sat: 'cSat', val: 'cVal', cast: 'cCast', feather: 'cFeather' };
const colorResettable = () => colorChanged() || color.feather !== FEATHER0;
function syncColorUI() { for (const [k, id] of Object.entries(COLOR_UI)) $(id).value = color[k]; }
for (const [k, id] of Object.entries(COLOR_UI)) onRange(id, v => { color[k] = v; scheduleColor(); });
$('colorReset').addEventListener('click', () => { Object.assign(color, COLOR0, { feather: FEATHER0 }); syncColorUI(); applyColor(); });
