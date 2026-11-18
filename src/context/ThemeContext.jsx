import React, { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext();
const KEY = 'servicehub_theme';
export function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* A blocked storage setting should not disable the switch. */ }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches?  'dark' : 'light';
}
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e192b' : '#f3f5f9');
    try { localStorage.setItem(KEY, theme); } catch { /* Keep working in memory. */ }
  }, [theme]);
  useEffect(() => {
    const sync = event => { if (event.key === KEY) setTheme(event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : initialTheme()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(value => value === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
