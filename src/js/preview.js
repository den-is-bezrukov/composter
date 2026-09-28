// ---- Direct manipulation on the preview, both templates ----
// Drag to move, wheel or pinch to resize; the sliders follow.
// In «Статья» pressing shows the original colours until a real drag starts; the grid is only for a case
const pointers = new Map();
function toCanvas(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
const clampTo = (el, v) => Math.round(Math.min(+el.max, Math.max(+el.min, v)));

function panBy(dx, dy) {
  if (mode === 'case') { caseState.x += dx; caseState.y += dy; clampCase(); return; }
  state.dx = clampTo($('dx'), state.dx + dx); state.dy = clampTo($('dy'), state.dy + dy);
  $('dx').value = state.dx; $('dy').value = state.dy;
}

// Resize around a point so it stays under the cursor
function zoomBy(factor, p) {
  if (mode === 'case') { zoomAt(factor, p); return; }
  const L = LAYOUTS[state.layout], cx = W / 2 + state.dx, cy = L.cy + state.dy;
  const size = clampTo($('size'), state.size * factor), k = size / state.size;
  state.size = size;
  state.dx = clampTo($('dx'), p.x - (p.x - cx) * k - W / 2);
  state.dy = clampTo($('dy'), p.y - (p.y - cy) * k - L.cy);
  $('size').value = state.size; $('dx').value = state.dx; $('dy').value = state.dy;
}

const canMove = () => !!(mode === 'case' ? caseState.img : state.img);
let start = null;
cv.addEventListener('pointerdown', e => {
  if (!canMove()) return;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
  pointers.set(e.pointerId, toCanvas(e));
  cv.classList.add('dragging'); $('grid').hidden = mode !== 'case';
  start = pointers.size === 1 ? toCanvas(e) : null;
  if (mode === 'article' && color.out && start) { color.showOriginal = true; draw(); }
});
cv.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const p = toCanvas(e), prev = pointers.get(e.pointerId);
  // A real drag cancels the colour comparison
  if (start && Math.hypot(p.x - start.x, p.y - start.y) > 12) { start = null; color.showOriginal = false; }
  if (pointers.size === 1) panBy(p.x - prev.x, p.y - prev.y);
  else {
    const other = [...pointers].find(([id]) => id !== e.pointerId)[1];
    const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(p.x - other.x, p.y - other.y);
    const m0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 }, m1 = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 };
    panBy(m1.x - m0.x, m1.y - m0.y);
    if (d0 > 0) zoomBy(d1 / d0, m1);
  }
  pointers.set(e.pointerId, p); draw();
});
['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, e => {
  pointers.delete(e.pointerId);
  if (!pointers.size) {
    start = null;
    cv.classList.remove('dragging'); $('grid').hidden = true;
    if (color.showOriginal) { color.showOriginal = false; draw(); }
  }
}));
cv.addEventListener('wheel', e => {
  if (!canMove()) return;
  e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015), toCanvas(e)); draw();
}, { passive: false });
