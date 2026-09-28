// ---- Shared helpers and the post canvas ----
const $ = id => document.getElementById(id);
const show = (ids, on) => ids.forEach(id => { $(id).hidden = !on; });
const onRadio = (name, fn) => document.querySelectorAll(`input[name=${name}]`).forEach(r => r.addEventListener('change', () => fn(r.value)));
const onRange = (id, fn) => $(id).addEventListener('input', e => fn(+e.target.value));
const isImage = file => !!file && file.type.startsWith('image/');

function loadImage(src, onload, onerror) {
  const img = new Image();
  img.onload = () => onload(img);
  if (onerror) img.onerror = onerror;
  img.src = src;
}

// The post is 1080×1440; mode is 'article' or 'case'
const W = 1080, H = 1440;
const cv = $('cv'), ctx = cv.getContext('2d');
let mode = 'article';
