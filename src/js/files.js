// ---- Picture cards, drag-and-drop and paste ----
function setCard(prefix, name, src) {
  $(prefix + 'Name').textContent = name;
  const t = $(prefix + 'Thumb'); t.src = src; t.hidden = false;
  t.closest('.file').classList.remove('add');
}

// The current mode's picture
function loadFile(file) {
  if (!isImage(file)) return;
  if (mode === 'case') loadCaseFile(file); else loadArticleFile(file);
}
$('file').addEventListener('change', e => loadFile(e.target.files[0]));
$('caseFile').addEventListener('change', e => loadFile(e.target.files[0]));

// Drop anywhere: on the logo card it's a logo, otherwise the current mode's picture
const onLogoCard = e => !!e.target.closest?.('#logoDrop');
const clearOver = () => document.querySelectorAll('.file.over').forEach(d => d.classList.remove('over'));
['dragover', 'dragenter'].forEach(ev => document.addEventListener(ev, e => {
  e.preventDefault(); clearOver();
  $(onLogoCard(e) ? 'logoDrop' : mode === 'case' ? 'caseDrop' : 'drop').classList.add('over');
}));
['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); clearOver(); }));
document.addEventListener('drop', e => {
  const f = e.dataTransfer.files[0];
  if (onLogoCard(e)) loadLogoFile(f); else loadFile(f);
});
document.addEventListener('paste', e => {
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
  if (item) loadFile(item.getAsFile());
});
