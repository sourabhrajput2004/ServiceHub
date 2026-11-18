import React from 'react';
import {Languages} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
export default function LanguageSwitch({ compact = false }) {
  const { language, setLanguage } = useLanguage();
  return <label className={`language-switch ${compact ? 'language-switch-mobile' : ''}`}>
    <Languages size={15} aria-hidden="true" />
    <span className="sr-only">Language / भाषा</span>
    <select aria-label="Language / भाषा" value={language} onChange={event => setLanguage(event.target.value)}>
      <option value="en" lang="en">English</option>
      <option value="hi" lang="hi">हिन्दी</option>
    </select>
  </label>;
}
