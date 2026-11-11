(() => {
  const storageKey = 'lunas-world-theme';
  let savedTheme;

  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch {}

  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme;

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#1f1d1a' : '#f2f1e8';
    window.dispatchEvent(new CustomEvent('luna:themechange', { detail: { theme } }));
  }

  applyTheme(initialTheme);

  function setupThemeToggle() {
    const toggle = document.querySelector('#theme-toggle');
    if (!toggle) return;

    function updateToggle() {
      const isDark = document.documentElement.dataset.theme === 'dark';
      toggle.textContent = isDark ? '☼' : '☾';
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      toggle.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    }

    updateToggle();
    toggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {}
      updateToggle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle, { once: true });
  } else {
    setupThemeToggle();
  }
})();

