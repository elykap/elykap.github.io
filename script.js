const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
  document.body.classList.add('light');
}

const toggle = document.getElementById('themeToggle');
if (toggle) {
  toggle.setAttribute('aria-pressed', String(document.body.classList.contains('light')));

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const on = document.body.classList.contains('light');
    try { localStorage.setItem('theme', on ? 'light' : 'dark'); } catch {}
    toggle.setAttribute('aria-pressed', String(on));
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();
    if (reduceMotion) {
      el.scrollIntoView();
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    history.replaceState(null, '', id);
  });
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
