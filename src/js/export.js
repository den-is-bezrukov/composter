// ---- Export: the toolbelt under the preview, file name and «Скачать» ----
// File names: Latin only (transliterated), the .png extension can't be edited
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const safeName = s => s.toLowerCase().trim()
  .replace(/[а-яё]/g, ch => TR[ch])
  .replace(/\.(png|jpe?g|webp|gif|svg)$/, '')
  .replace(/[^a-z0-9_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^[-_]+|[-_]+$/g, '');
// An uploaded file's name without any extension
const fileSlug = name => safeName(name.replace(/\.[^.]+$/, ''));

// Each mode keeps its own name; null means «follow the headline / the picture»
const customName = { article: null, case: null };
const autoName = () => mode === 'case'
  ? caseState.name || 'case'
  : safeName(lines($('t1').value).join(' ')) || 'post';
const fileName = () => (safeName(customName[mode] || '') || autoName()) + '.png';
function syncName() { const f = $('fname'); if (customName[mode] === null && document.activeElement !== f) f.value = autoName(); fitName(); }

// The field hugs its text up to 192 px (then «…»), so the toolbelt stays compact
function fitName() {
  const f = $('fname'), m = $('fnameMeasure');
  m.textContent = f.value || ' ';
  f.style.width = Math.min(192, Math.ceil(m.getBoundingClientRect().width)) + 'px';
}
// Inter comes from Google Fonts and may arrive after the first measure
document.fonts.addEventListener('loadingdone', fitName);

$('fname').addEventListener('input', e => { customName[mode] = e.target.value.trim() ? e.target.value : null; fitName(); });
$('fname').addEventListener('focus', hideSaveError);
$('fname').addEventListener('blur', syncName);

// Errors pop up above the toolbelt and go away by themselves
let saveErrorTimer = 0;
function saveError(msg) {
  $('warnSave').textContent = msg; $('warnSave').hidden = false;
  clearTimeout(saveErrorTimer); saveErrorTimer = setTimeout(hideSaveError, 6000);
}
function hideSaveError() { clearTimeout(saveErrorTimer); $('warnSave').hidden = true; }
const SAVE_BY_HAND = 'Нажмите правой кнопкой на превью и выберите «Сохранить изображение как…».';

// On claude.ai the platform's downloads capability; elsewhere (GitHub Pages) a plain download link
let downloads = null;
(async () => { try { downloads = await window.claude?.use?.('downloads'); } catch (e) { downloads = null; } })();

function downloadLink(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function save(blob, name) {
  if (!downloads) {
    if (!window.claude) return downloadLink(blob, name);
    return saveError('Скачивание здесь недоступно. ' + SAVE_BY_HAND);
  }
  try { await downloads.save({ filename: name, data: blob }); }
  catch (err) {
    if (err && err.code === 'declined') return;
    if (err && err.code === 'rate_limited') return saveError('Окно сохранения уже открыто. Попробуйте ещё раз через пару секунд.');
    saveError('Не получилось сохранить. ' + SAVE_BY_HAND);
  }
}

$('saveForm').addEventListener('submit', e => {
  e.preventDefault(); hideSaveError();
  const name = fileName();
  cv.toBlob(blob => save(blob, name), 'image/png');
});
