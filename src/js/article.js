// ---- Article: a headline in Roboto Flex and an illustration on black ----
const FS = 180, LH = 180, PAD = 30;
// Roboto Flex hhea: ascent 1900, descent 500, upm 2048 — baseline inside a 180px line box
const BASE = (LH - (2400 / 2048) * FS) / 2 + (1900 / 2048) * FS;
const LAYOUTS = {
  top:      { size: 960,  cy: 930 },
  bottom:   { size: 1200, cy: 525 },
  sandwich: { size: 900,  cy: 720 },
};
const state = { img: null, layout: 'top', wd: 'auto', narrow: 52, size: 960, dx: 0, dy: 0, z: 'under' };

// The layout's default size sits in the middle of «Масштаб», ±700 px either way
function resetPos() {
  const L = LAYOUTS[state.layout], r = $('size');
  r.min = L.size - 700; r.max = L.size + 700; r.dataset.zero = L.size;
  state.size = L.size; state.dx = 0; state.dy = 0;
  r.value = state.size; $('dx').value = 0; $('dy').value = 0;
}
const posChanged = () => state.size !== LAYOUTS[state.layout].size || !!state.dx || !!state.dy;

// ---- Headline text ----
// Regular spaces are break points; U+00A0 keeps words together
function lines(txt) {
  return txt.split('\n').map(s => s.replace(/[ \t]+/g, ' ').replace(/ ? + ?/g, ' ').replace(/^[  ]+|[  ]+$/g, '').toUpperCase()).filter(Boolean);
}

function setFont(family, size) {
  ctx.font = `${size}px "${family}"`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = (size * 0.01) + 'px';
}

// Greedy word wrap inside the text box, like a fixed-width text layer in Figma
function wrap(ls, boxW) {
  const fits = s => ctx.measureText(s).width <= boxW;
  const out = [];
  for (const l of ls) {
    let cur = '';
    for (let word of l.split(' ')) {
      // A word wider than the box is split by letters so nothing gets clipped
      while (!fits(word)) {
        if (cur) { out.push(cur); cur = ''; }
        let n = word.length - 1;
        while (n > 1 && !fits(word.slice(0, n))) n--;
        out.push(word.slice(0, n)); word = word.slice(n);
      }
      const next = cur ? cur + ' ' + word : word;
      if (cur && !fits(next)) { out.push(cur); cur = word; }
      else cur = next;
    }
    if (cur) out.push(cur);
  }
  return out;
}

// Size is always 180; «По умолчанию» is width 60, «Настроить» takes the slider value.
// Leaves the font set on ctx
function layoutBlock(ls, boxW) {
  const fam = state.wd === 'auto' ? 'RF60' : 'RF' + state.narrow;
  setFont(fam, FS);
  const overflow = ls.join(' ').split(' ').some(w => ctx.measureText(w).width > boxW);
  return { rows: wrap(ls, boxW), overflow };
}

// Sandwich takes one field: the first Enter splits top from bottom
// (while the headline is edited on the preview, even with one side empty).
// Without it the words are split in half, see splitWords()
function textBlocks() {
  const raw = $('t1').value;
  if (state.layout !== 'sandwich') return [lines(raw), []];
  const i = raw.indexOf('\n');
  if (i >= 0) {
    const a = lines(raw.slice(0, i)), b = lines(raw.slice(i + 1));
    if ((a.length && b.length) || inline.part) return [a, b];
  }
  const words = lines(raw.replace(/\n/g, ' ')).join(' ').split(' ').filter(Boolean);
  if (words.length < 2) return [words, []];
  const k = splitWords(words);
  return [[words.slice(0, k).join(' ')], [words.slice(k).join(' ')]];
}

// How many words go on top: fewest rows per part first,
// then no short word (preposition) left hanging at the end of the top, then equal length
function splitWords(words) {
  const better = (s, t) => { for (let j = 0; j < s.length; j++) if (s[j] !== t[j]) return s[j] < t[j]; return false; };
  let best = null;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
    const rows = Math.max(layoutBlock([a], W - 2 * PAD).rows.length, layoutBlock([b], W - 2 * PAD).rows.length);
    const score = [rows, words[k - 1].length <= 2 ? 1 : 0, Math.abs(a.length - b.length)];
    if (!best || better(score, best.score)) best = { score, k };
  }
  return best.k;
}

// Static wdth instances 25–60 (canvas can't set variation axes), registered on first use
const WIDTHS = JSON.parse($('widths').textContent);
const loadedW = new Set([60]);
async function ensureWidth(w) {
  if (loadedW.has(w)) return;
  const face = new FontFace('RF' + w, `url(data:font/woff2;base64,${WIDTHS[w]}) format("woff2")`);
  document.fonts.add(await face.load());
  loadedW.add(w);
}

// ---- Drawing ----
// Each block's place is kept in textBoxes (post pixels) for editing on the preview;
// an empty block still gets one line there, so it can be double-clicked
let textBoxes = [];
function drawBlock(ls, boxX, boxW, atBottom, part) {
  const f = ls.length ? layoutBlock(ls, boxW) : null, n = f ? f.rows.length : 1;
  const y0 = atBottom ? H - PAD - n * LH : PAD;
  textBoxes.push({ part, x: boxX, y: y0, w: boxW, h: n * LH, atBottom });
  if (!f || inline.part === part) return f;
  ctx.fillStyle = '#EEEEEE'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  f.rows.forEach((l, i) => ctx.fillText(l, boxX + boxW / 2, y0 + i * LH + BASE));
  return f;
}

function drawImage() {
  if (!state.img) return;
  const w = state.size, h = w * state.img.naturalHeight / state.img.naturalWidth;
  const cy = LAYOUTS[state.layout].cy + state.dy;
  const pic = (!color.showOriginal && color.out) || state.img;
  ctx.drawImage(pic, W / 2 - w / 2 + state.dx, cy - h / 2, w, h);
}

function drawArticle() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const [a, b] = textBlocks();
  let f1, f2;
  textBoxes = [];
  const top = () => { if (state.layout !== 'bottom') f1 = drawBlock(a, PAD, W - 2 * PAD, false, 'a'); };
  const bottom = () => {
    if (state.layout === 'bottom') f1 = drawBlock(a, 60, 960, true, 'a');
    if (state.layout === 'sandwich') f2 = drawBlock(b, PAD, W - 2 * PAD, true, 'b');
  };
  const order = {
    under:      [drawImage, top, bottom],
    overTop:    [top, drawImage, bottom],
    overBottom: [bottom, drawImage, top],
    over:       [top, bottom, drawImage],
  }[state.z];
  order.forEach(fn => fn());
  showTextWarnings(a, [f1, f2].filter(Boolean));
}

function showTextWarnings(a, blocks) {
  const warns = [];
  if (blocks.some(f => f.overflow)) warns.push('Слово не помещается в ширину, поэтому оно разбито посередине. В «Шрифте» выберите «Настроить» и сузьте буквы или замените слово на более короткое.');
  if (blocks.some(f => f.rows.length > 2)) warns.push(state.layout === 'sandwich'
    ? 'Текст не влезает: сверху и снизу должно быть не больше двух строк. Сократите текст.'
    : 'Заголовок не влезает в две строки. Сократите текст или выберите «Сэндвич».');
  if (!a.length) warns.push('Добавьте заголовок.');
  $('warnTextRow').hidden = !warns.length; $('warnText').textContent = warns.join(' ');
}

function loadArticleFile(file) {
  const url = URL.createObjectURL(file);
  loadImage(url, img => { state.img = img; color.cache = null; applyColor(); resetPos(); draw(); setCard('file', file.name, url); });
}

// ---- Controls ----
onRadio('layout', v => { stopInline(); state.layout = v; syncZ(); resetPos(); draw(); });

async function applyWidth() {
  $('narrowRow').hidden = state.wd !== 'narrow';
  $('narrowOut').textContent = state.narrow;
  if (state.wd === 'narrow') await ensureWidth(state.narrow);
  draw();
}
onRadio('wd', v => { state.wd = v; applyWidth(); });
onRange('narrow', v => { state.narrow = v; applyWidth(); });

['size', 'dx', 'dy'].forEach(k => onRange(k, v => { state[k] = v; draw(); }));
$('posReset').addEventListener('click', () => { resetPos(); draw(); });

// One line by default, grows with the text (field-sizing isn't everywhere yet)
function fitText() { const t = $('t1'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; t.style.overflowY = t.scrollHeight > 160 ? 'auto' : 'hidden'; paintNbsp(); }

// Non-breaking spaces get a tie ‿ in the field only (a layer under the transparent textarea)
function paintNbsp() {
  const t = $('t1'), bg = $('t1bg');
  const esc = t.value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // A trailing space keeps the last empty line after an Enter at the end
  bg.innerHTML = esc.replace(/\u00a0/g, '<span class="nb">\u00a0</span>') + ' ';
  bg.style.paddingRight = 8 + t.offsetWidth - t.clientWidth + 'px';
  bg.scrollTop = t.scrollTop;
}
$('t1').addEventListener('scroll', () => { $('t1bg').scrollTop = $('t1').scrollTop; });
$('t1').addEventListener('input', () => { fitText(); draw(); });

$('nbsp').addEventListener('mousedown', e => e.preventDefault());
$('nbsp').addEventListener('click', () => {
  const f = $('t1'), s = f.selectionStart, e = f.selectionEnd;
  // Replace a selected (or adjacent) regular space instead of adding a second gap
  let a = s, b = e;
  if (a === b && f.value[a - 1] === ' ') a--; else if (a === b && f.value[a] === ' ') b++;
  f.value = f.value.slice(0, a) + ' ' + f.value.slice(b);
  f.focus(); f.selectionStart = f.selectionEnd = a + 1;
  fitText(); draw();
});

// «Над нижним» and «Над верхним» only make sense with two text blocks
function syncZ() {
  const two = state.layout === 'sandwich';
  ['overTop', 'overBottom'].forEach(v => { $('zc-' + v).hidden = !two; });
  ['under', 'over'].forEach(v => { $('zi-' + v).setAttribute('href', '#i-' + v + (two ? '' : '2')); });
  if (!two && (state.z === 'overTop' || state.z === 'overBottom')) { state.z = 'under'; $('z-under').checked = true; }
}
onRadio('z', v => { state.z = v; draw(); });
