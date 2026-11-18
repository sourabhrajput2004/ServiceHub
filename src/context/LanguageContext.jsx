import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n/translate';
const LanguageContext = createContext();
const STORAGE_KEY = 'servicehub_language';
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem(STORAGE_KEY) === 'hi'?  'hi' : 'en'; } catch { return 'en'; } });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Language still works when storage is unavailable. */ }
  }, [language]);
  useEffect(() => { const sync = event => { if (event.key === STORAGE_KEY) setLanguage(event.newValue === 'hi' ? 'hi' : 'en'); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  const tr = useCallback(value => translate(value, language), [language]);
  const value = useMemo(() => ({ language, setLanguage, tr }), [language, tr]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
