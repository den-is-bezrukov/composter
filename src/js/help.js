// ---- Help popup and the illustration prompt (src/prompt.txt) ----
const PROMPT = __PROMPT__;
$('promptText').textContent = PROMPT;

// Non-modal popover over the preview: «?» toggles it and stays lit while it is open;
// the cross, Esc and a click anywhere outside close it
function openHelp() { if (!$('help').open) { $('help').show(); $('helpBtn').setAttribute('aria-expanded', 'true'); } }
$('helpBtn').setAttribute('aria-expanded', 'false');
$('helpBtn').addEventListener('click', () => $('help').open ? $('help').close() : openHelp());
$('helpClose').addEventListener('click', () => $('help').close());
// «close» fires asynchronously: read the real state, the popover may be open again by then
$('help').addEventListener('close', () => $('helpBtn').setAttribute('aria-expanded', String($('help').open)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('help').open) $('help').close(); });
document.addEventListener('pointerdown', e => {
  if ($('help').open && !$('help').contains(e.target) && !$('helpBtn').contains(e.target)) $('help').close();
});

// The prompt is clamped to 9 lines until «Показать полностью»
function setPromptOpen(open) {
  $('promptText').parentElement.classList.toggle('open', open);
  $('promptMore').setAttribute('aria-expanded', String(open));
  $('promptMore').textContent = open ? 'Свернуть' : 'Показать полностью';
}
$('promptMore').addEventListener('click', () => setPromptOpen($('promptMore').getAttribute('aria-expanded') !== 'true'));

async function copyPrompt(btn) {
  try {
    await navigator.clipboard.writeText(PROMPT);
    const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    btn.textContent = 'Скопировано'; clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = label; }, 2000);
  } catch (e) {
    // Clipboard refused: open the help with the prompt selected
    openHelp(); setPromptOpen(true);
    const r = document.createRange(); r.selectNodeContents($('promptText'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    $('promptText').scrollIntoView({ block: 'nearest' });
    $('copyStatus').textContent = 'Текст выделен. Нажмите Ctrl/⌘+C, чтобы скопировать.';
  }
}
$('copyPrompt').addEventListener('click', e => copyPrompt(e.currentTarget));
$('copyPromptSide').addEventListener('click', e => copyPrompt(e.currentTarget));
