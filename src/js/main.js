// ---- Redraw, mode switch, window layout and start ----
// The pill runs from the origin (the default dot, or data-origin) to the knob, in either direction
function paintRanges() {
  const at = t => `calc(8px + (100% - 16px) * ${t})`;
  document.querySelectorAll('input[type=range]').forEach(r => {
    const mn = +r.min, span = (+r.max - mn) || 1, f = v => Math.min(1, Math.max(0, (v - mn) / span));
    const zero = r.dataset.zero ?? r.min, p = f(+r.value), o = f(+(r.dataset.origin ?? zero)), moved = p !== o;
    r.style.setProperty('--z', f(+zero));
    r.style.setProperty('--fs', at(Math.min(p, o)));
    r.style.setProperty('--fe', at(Math.max(p, o)));
    r.style.setProperty('--fc', moved ? 'var(--accent)' : 'transparent');
    r.style.setProperty('--kd', moved ? 'var(--accent)' : '#fff');
  });
}

// «Сбросить» fades out when there is nothing to reset
function syncResets() {
  $('posReset').disabled = !posChanged();
  $('colorReset').disabled = !colorResettable();
  $('frameReset').disabled = !frameChanged();
  $('logoReset').disabled = !logoChanged();
}

function draw() { mode === 'case' ? drawCase() : drawArticle(); syncName(); paintRanges(); syncResets(); placeInline(); }

function setMode(m) {
  stopInline();
  mode = m;
  $('fname').value = customName[m] ?? autoName();
  show(['textSec', 'fontSec', 'articleProps'], m === 'article');
  if (m === 'article') fitText();
  // Case: logo on the left, background on the right, like text / picture in an article
  show(['caseProps', 'caseBg'], m === 'case');
  draw();
}
onRadio('mode', setMode);

// Narrow window: the picture sections move under the text sections
const narrowMQ = matchMedia('(max-width:960px)');
function placeProps() { (narrowMQ.matches ? $('leftScroll') : $('rightSide')).appendChild($('props')); }
narrowMQ.addEventListener('change', placeProps);

// Fit the 3:4 preview into the space above the toolbelt
function fitFrame() {
  const st = $('stage');
  const w = Math.max(120, Math.floor(Math.min(st.clientWidth, st.clientHeight * 3 / 4)));
  $('frame').style.width = w + 'px'; $('frame').style.height = Math.round(w * 4 / 3) + 'px';
  placeInline();
}
new ResizeObserver(fitFrame).observe($('stage'));

// ---- Start ----
syncColorUI();
placeProps();
fitFrame();

// Placeholders: a picture is always there, it can only be replaced
loadImage('data:image/jpeg;base64,__CASE__', img => {
  if (!caseState.img) { setCaseImage(img, 'Пример.jpg', true); setCard('case', 'Пример.jpg', img.src); }
});
loadImage('data:image/webp;base64,__LIPS__', img => {
  if (!state.img) { state.img = img; setCard('file', 'Пример.webp', img.src); draw(); }
});

syncZ();
resetPos();
fitText();
document.fonts.load('180px "RF60"').then(draw, draw);
draw();
