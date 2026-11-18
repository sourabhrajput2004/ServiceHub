import React from 'react';
import { Link } from 'react-router-dom';
import {ShieldCheck, FileText} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { legalContent } from '../content/legalContent';
import '../styles/legal.css';

export default function LegalPage({ type = 'privacy' }) {
  const { tr, language } = useLanguage();
  const content = legalContent[type];
  const Icon = type === 'privacy'?  ShieldCheck : FileText;
  const other = type === 'privacy'?  'terms' : 'privacy';
  return <div className="legal-page workspace-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header className="legal-hero">
      <span className="legal-icon"><Icon size={32} aria-hidden="true" /></span>
      
      <h1>{tr(content.title)}</h1>
      <p>{tr(content.intro)}</p>
      <p className="legal-updated">{tr('Last updated:')} <time dateTime="2026-11-07">{new Date('2026-11-07T12:00:00+05:30').toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
      <nav className="legal-tabs" aria-label={tr('Policies')}>
        <Link to="/privacy-policy" aria-current={type === 'privacy' ? 'page' : undefined}>{tr('Privacy Policy')}</Link>
        <Link to="/terms-and-conditions" aria-current={type === 'terms' ? 'page' : undefined}>{tr('Terms & Conditions')}</Link>
      </nav>
    </header>
    <div className="legal-layout">
      <aside className="legal-contents"><h2>{tr('On this page')}</h2><nav aria-label={tr('Policy sections')}>{content.sections.map(([id, title]) => <a key={id} href={`#${id}`}>{tr(title)}</a>)}</nav></aside>
      <article className="legal-document bg-white rounded-2xl">
        {content.sections.map(([id, title, text]) => <section id={id} key={id}><h2>{tr(title)}</h2><p>{tr(text)}</p></section>)}
        <div className="legal-contact"><h2>{tr('Need to ask something?')}</h2><p>{tr('Use the Contact page for a policy question or to report a concern. Keep passwords, OTPs and identity documents out of your message.')}</p><Link to="/contact">{tr('Contact ServiceHub')}</Link></div>
        <div className="legal-related"><Link to={other === 'terms' ? '/terms-and-conditions' : '/privacy-policy'}>{tr(legalContent[other].title)}</Link></div>
      </article>
    </div>
  </div>;
}
