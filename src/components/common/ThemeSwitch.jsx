import React from 'react';
import {Sun, Moon} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const { tr } = useLanguage();
  const dark = theme === 'dark';
  const label = tr(dark ? 'Switch to light mode' : 'Switch to dark mode');
  return <button type="button" className="theme-switch" onClick={toggleTheme} aria-label={label} title={label} aria-pressed={dark}>
    {dark ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
    <span className="sr-only">{tr(dark ? 'Dark mode' : 'Light mode')}</span>
  </button>;
}
