// ---- Help popup and the illustration prompt (src/prompt.txt) ----
const PROMPT = __PROMPT__;
$('promptText').textContent = PROMPT;

function openHelp() { if (!$('help').open) $('help').showModal(); }
$('helpBtn').addEventListener('click', openHelp);
$('helpClose').addEventListener('click', () => $('help').close());
// A click on the dimmed backdrop lands on the <dialog> itself
$('help').addEventListener('click', e => { if (e.target === $('help')) $('help').close(); });

async function copyPrompt(btn) {
  try {
    await navigator.clipboard.writeText(PROMPT);
    const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    btn.textContent = 'Скопировано'; clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = label; }, 2000);
  } catch (e) {
    // Clipboard refused: open the help with the prompt selected
    openHelp();
    const r = document.createRange(); r.selectNodeContents($('promptText'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    $('promptText').scrollIntoView({ block: 'nearest' });
    $('copyStatus').textContent = 'Текст выделен. Нажмите Ctrl/⌘+C, чтобы скопировать.';
  }
}
$('copyPrompt').addEventListener('click', e => copyPrompt(e.currentTarget));
$('copyPromptSide').addEventListener('click', e => copyPrompt(e.currentTarget));
