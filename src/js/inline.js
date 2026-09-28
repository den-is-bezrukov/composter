// ---- Editing the headline right on the preview: double-click the text ----
// #t1 stays the source of truth; a textarea over the block shows the same font while typing
// and the canvas skips that block. Warnings stay under the field on the left
const inline = { part: null };
const ed = $('inlineText');

const textBoxAt = p => mode === 'article'
  ? textBoxes.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h)
  : undefined;

// Sandwich: the text before / after the first Enter; otherwise the whole text is one block
function sandwichParts() {
  const v = $('t1').value, i = v.indexOf('\n');
  return i < 0 ? [v, ''] : [v.slice(0, i), v.slice(i + 1)];
}

// An automatic split turns into a real Enter, so it doesn't jump while typing
function fixSandwichSplit() {
  const raw = $('t1').value, i = raw.indexOf('\n');
  if (i >= 0 && lines(raw.slice(0, i)).length && lines(raw.slice(i + 1)).length) return;
  const words = raw.replace(/\n/g, ' ').replace(/[ \t]+/g, ' ').replace(/ ?\u00a0+ ?/g, '\u00a0').trim().split(' ').filter(Boolean);
  if (words.length < 2) return;
  const k = splitWords(lines(words.join(' '))[0].split(' '));
  $('t1').value = words.slice(0, k).join(' ') + '\n' + words.slice(k).join(' ');
  fitText();
}

function startInline(part) {
  if (state.layout === 'sandwich') fixSandwichSplit();
  inline.part = part;
  ed.value = state.layout === 'sandwich' ? sandwichParts()[part === 'a' ? 0 : 1] : $('t1').value;
  ed.hidden = false;
  draw();
  ed.focus();
  ed.setSelectionRange(ed.value.length, ed.value.length);
}

function stopInline() {
  if (!inline.part) return;
  inline.part = null;
  ed.hidden = true;
  draw();
}

// Same font, size and place as on the canvas, scaled to the preview; a bottom block grows upwards
function placeInline() {
  if (!inline.part) return;
  const box = textBoxes.find(b => b.part === inline.part);
  if (!box) { stopInline(); return; }
  const k = $('frame').clientWidth / W, s = ed.style;
  s.fontFamily = `"${state.wd === 'auto' ? 'RF60' : 'RF' + state.narrow}"`;
  s.fontSize = FS * k + 'px'; s.lineHeight = LH * k + 'px';
  s.left = box.x * k + 'px'; s.width = box.w * k + 'px';
  s.top = box.atBottom ? 'auto' : PAD * k + 'px';
  s.bottom = box.atBottom ? PAD * k + 'px' : 'auto';
  // Height from the canvas rows: the textarea's own scrollHeight is a few px taller,
  // which pushed a bottom block up. Grow only if it really wraps into one more line
  s.height = box.h * k + 'px';
  if (ed.scrollHeight > ed.clientHeight + LH * k / 2) s.height = ed.scrollHeight + 'px';
  ed.scrollTop = 0;
}

ed.addEventListener('input', () => {
  if (state.layout === 'sandwich') {
    const [a, b] = sandwichParts(), v = ed.value.replace(/\n/g, ' ');
    if (v !== ed.value) ed.value = v;
    $('t1').value = inline.part === 'a' ? v + '\n' + b : a + '\n' + v;
  } else $('t1').value = ed.value;
  fitText(); draw();
});
// Enter in a sandwich block would become a new split point, so it finishes instead
ed.addEventListener('keydown', e => {
  if (e.key === 'Escape' || (e.key === 'Enter' && state.layout === 'sandwich')) { e.preventDefault(); ed.blur(); }
});
ed.addEventListener('blur', stopInline);

cv.addEventListener('dblclick', e => {
  const box = textBoxAt(toCanvas(e));
  if (!box) return;
  clearTimeout(origTimer);
  startInline(box.part);
});
