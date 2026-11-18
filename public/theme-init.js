// Set the saved theme before the app styles paint to avoid a bright startup flash.
(function () {
  var theme;
  try { theme = localStorage.getItem('servicehub_theme'); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
