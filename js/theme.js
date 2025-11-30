// Simple theme toggler: stores preference in localStorage and toggles data-theme on <html>
const key = 'estt_theme';
const root = document.documentElement;

function applyTheme(t) {
  if (!t) t = 'light';
  root.setAttribute('data-theme', t);
  localStorage.setItem(key, t);
}

function init() {
  const saved = localStorage.getItem(key) || 'light';
  applyTheme(saved);

  const light = document.getElementById('theme-light');
  const dark = document.getElementById('theme-dark');
  if (light) light.checked = saved === 'light';
  if (dark) dark.checked = saved === 'dark';

  if (light) light.addEventListener('change', () => applyTheme('light'));
  if (dark) dark.addEventListener('change', () => applyTheme('dark'));
}

document.addEventListener('DOMContentLoaded', init);

// Also allow quick toggling from console: window.esttToggleTheme()
window.esttToggleTheme = () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
