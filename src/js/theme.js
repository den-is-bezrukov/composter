// ---- Theme button above «?»: as in the system → light → dark ----
// The choice is remembered in this browser; storage may be unavailable (private window, preview)
const THEMES = ['auto', 'light', 'dark'];
const THEME_NAMES = { auto: 'как в системе', light: 'светлая', dark: 'тёмная' };
const THEME_KEY = 'composter-theme';
// If the host (claude.ai) sets its own data-theme, «как в системе» brings it back
const hostTheme = document.documentElement.getAttribute('data-theme');
let theme = 'auto';

function applyTheme(t) {
  theme = t;
  const root = document.documentElement, value = t === 'auto' ? hostTheme : t;
  if (value) root.setAttribute('data-theme', value); else root.removeAttribute('data-theme');
  $('themeIcon').setAttribute('href', '#i-theme-' + t);
  const next = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
  $('themeBtn').setAttribute('aria-label', 'Тема: ' + THEME_NAMES[t]);
  $('themeBtn').title = `Тема: ${THEME_NAMES[t]}. Нажмите — ${THEME_NAMES[next]}`;
}

$('themeBtn').addEventListener('click', () => {
  applyTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* not remembered, still switched */ }
});

try { const saved = localStorage.getItem(THEME_KEY); if (THEMES.includes(saved)) theme = saved; } catch (e) { /* default */ }
applyTheme(theme);
