// ---- Case: a ready-made picture cropped to 3:4, optional client logo ----
const LOGO0 = { lSize: 540, lDx: 0, lDy: 0 };
const caseState = { img: null, scale: 1, x: W / 2, y: H / 2, logo: null, tint: 'orig', ...LOGO0, name: 'case' };
const coverScale = img => Math.max(W / img.naturalWidth, H / img.naturalHeight);

// ---- Background picture: always covers the whole post, only zoom in and move ----
function resetFrame() {
  const c = caseState;
  c.scale = coverScale(c.img); c.x = W / 2; c.y = H / 2;
}
const frameChanged = () => {
  const c = caseState;
  return !!c.img && (c.x !== W / 2 || c.y !== H / 2 || Math.abs(c.scale - coverScale(c.img)) >= 1e-9);
};

function clampCase() {
  const c = caseState;
  if (!c.img) return;
  const cover = coverScale(c.img);
  c.scale = Math.min(Math.max(c.scale, cover), cover * 4);
  const hw = c.img.naturalWidth * c.scale / 2, hh = c.img.naturalHeight * c.scale / 2;
  c.x = Math.min(Math.max(c.x, W - hw), hw);
  c.y = Math.min(Math.max(c.y, H - hh), hh);
}

// Zoom around a point on the canvas so that point stays under the cursor
function zoomAt(factor, p) {
  const c = caseState, before = c.scale;
  c.scale *= factor; clampCase();
  const k = c.scale / before;
  c.x = p.x - (p.x - c.x) * k; c.y = p.y - (p.y - c.y) * k;
  clampCase();
}

function setCaseImage(img, name) {
  caseState.img = img; caseState.name = fileSlug(name);
  resetFrame(); clampCase();
  draw();
}

function loadCaseFile(file) {
  const url = URL.createObjectURL(file);
  loadImage(url, img => { setCaseImage(img, file.name); setCard('case', file.name, url); });
}

// ---- Drawing ----
function drawLogo() {
  const c = caseState, w = c.lSize, h = w * c.logo.height / c.logo.width;
  const x = W / 2 - w / 2 + c.lDx, y = H / 2 - h / 2 + c.lDy;
  if (c.tint === 'orig') { ctx.drawImage(c.logo.img, x, y, w, h); return; }
  // Recolour on an offscreen canvas at the final size so SVGs stay sharp
  const o = document.createElement('canvas'); o.width = Math.ceil(w); o.height = Math.ceil(h);
  const ox = o.getContext('2d'); ox.drawImage(c.logo.img, 0, 0, w, h);
  ox.globalCompositeOperation = 'source-in'; ox.fillStyle = c.tint; ox.fillRect(0, 0, o.width, o.height);
  ctx.drawImage(o, x, y);
}

function drawCase() {
  const c = caseState;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (c.img) {
    const iw = c.img.naturalWidth * c.scale, ih = c.img.naturalHeight * c.scale;
    ctx.drawImage(c.img, c.x - iw / 2, c.y - ih / 2, iw, ih);
  }
  if (c.logo) drawLogo();
  syncCaseUI();
}

// Sliders follow the picture; X/Y go as far as it sticks out past the edge
function syncCaseUI() {
  const c = caseState;
  if (c.img) {
    const iw = c.img.naturalWidth * c.scale, ih = c.img.naturalHeight * c.scale;
    $('caseZoom').value = Math.round(c.scale / coverScale(c.img) * 100);
    [['caseDx', iw - W, c.x - W / 2], ['caseDy', ih - H, c.y - H / 2]].forEach(([id, over, v]) => {
      const r = $(id), m = Math.floor(over / 2);
      r.min = -m; r.max = m; r.value = Math.round(v); r.disabled = m < 1;
    });
  }
  const warn = c.img && c.scale > 1.25
    ? `Картинка растянута в ${c.scale.toFixed(1).replace('.', ',')} раза и будет мыльной. Нужен исходник от 1080×1440 или меньший масштаб.`
    : '';
  $('warnPic').hidden = !warn; $('warnPicTip').textContent = warn; $('warnPic').setAttribute('aria-label', warn);
}

// ---- Logo ----
const logoChanged = () => Object.keys(LOGO0).some(k => caseState[k] !== LOGO0[k]);
function syncLogoInputs() { for (const k of Object.keys(LOGO0)) $(k).value = caseState[k]; }

// SVGs without width/height get them from the viewBox, otherwise they load at 0×0 or 300×150
async function sizedSvg(file) {
  const svg = new DOMParser().parseFromString(await file.text(), 'image/svg+xml').documentElement;
  const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  const aw = parseFloat(svg.getAttribute('width')), ah = parseFloat(svg.getAttribute('height'));
  const pct = /%/.test(svg.getAttribute('width') || '') || /%/.test(svg.getAttribute('height') || '');
  let w, h;
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0 && (pct || !aw || !ah)) { w = vb[2]; h = vb[3]; }
  else { w = aw; h = ah; }
  if (!w || !h) return null;
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  return { blob: new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }), w, h };
}

async function loadLogoFile(file) {
  if (!file) return;
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  if (!isSvg && !isImage(file)) return;
  let blob = file, w = 0, h = 0;
  if (isSvg) {
    const s = await sizedSvg(file);
    if (!s) { $('logoAct').textContent = 'В этом SVG не указан размер. Экспортируйте логотип заново или возьмите PNG.'; return; }
    ({ blob, w, h } = s);
  }
  const url = URL.createObjectURL(blob);
  loadImage(url,
    img => setLogo({ img, width: w || img.naturalWidth, height: h || img.naturalHeight }, file.name, url),
    () => { $('logoAct').textContent = 'Не получилось открыть логотип. Попробуйте PNG или другой SVG.'; });
}

function setLogo(logo, name, url) {
  const c = caseState;
  c.logo = logo; Object.assign(c, LOGO0); syncLogoInputs();
  show(['logoControls', 'logoRemove', 'logoReset'], true);
  setCard('logo', name, url); $('logoAct').textContent = 'Заменить';
  // The post is named after the client: the logo's file name wins over the sample picture
  if (!c.img || c.name === 'more-tv') c.name = fileSlug(name);
  draw();
}

function removeLogo() {
  caseState.logo = null; $('logoFile').value = '';
  show(['logoControls', 'logoRemove', 'logoReset', 'logoThumb'], false);
  $('logoDrop').classList.add('add');
  $('logoName').textContent = 'Добавить логотип'; $('logoAct').textContent = 'Прозрачный SVG или PNG';
  draw();
}

// ---- Controls ----
onRange('caseZoom', v => {
  if (!caseState.img) return;
  zoomAt(coverScale(caseState.img) * v / 100 / caseState.scale, { x: W / 2, y: H / 2 }); draw();
});
onRange('caseDx', v => { if (!caseState.img) return; caseState.x = W / 2 + v; clampCase(); draw(); });
onRange('caseDy', v => { if (!caseState.img) return; caseState.y = H / 2 + v; clampCase(); draw(); });
$('frameReset').addEventListener('click', () => { if (!caseState.img) return; resetFrame(); draw(); });

$('logoFile').addEventListener('change', e => loadLogoFile(e.target.files[0]));
$('logoRemove').addEventListener('click', removeLogo);
onRadio('tint', v => { caseState.tint = v; draw(); });
Object.keys(LOGO0).forEach(k => onRange(k, v => { caseState[k] = v; draw(); }));
$('logoReset').addEventListener('click', () => { Object.assign(caseState, LOGO0); syncLogoInputs(); draw(); });
