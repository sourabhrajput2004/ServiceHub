import { useLanguage } from "../context/LanguageContext";import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {Mail, MapPin, MessageCircle, CheckCircle2, Plus, Minus} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/marketing.css';
const faqs = [
['Where can I see my repair updates?', 'Sign in as a customer and open My Repairs & Records. Your repair card shows the workshop’s latest status and service details.'],
['How do I ask my repair shop a question?', 'Open your repair order and choose Need help to raise a query, or Live chat to start a conversation. Find both under My Queries & Live Chats in your dashboard.'],
['How can I register my workshop?', 'Choose List your repair shop and complete the shop registration form. Your listing becomes visible in the directory after approval.']];

export default function Contact() {const { tr } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', topic: 'General question', message: '' });
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const emailLink = `mailto:support@servicehub.com?${new URLSearchParams({ subject: `[${tr(form.topic)}] ${tr("ServiceHub enquiry")} ${reference}`, body: `${tr("Name:")} ${form.name}\n${tr("Email:")} ${form.email}\n\n${form.message}` }).toString().replace(/\+/g, '%20')}`;
  const submit = (e) => {
    e.preventDefault();
    try {
      const id = `SH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const saved = JSON.parse(localStorage.getItem('servicehub_contact_drafts') || '[]');
      localStorage.setItem('servicehub_contact_drafts', JSON.stringify([...saved, { ...form, id, createdAt: new Date().toISOString() }]));
      setReference(id);setError('');
    } catch {setError('Your message could not be saved. Please try again or email support directly.');}
  };
  return <div className="marketing inner-page"><section className="marketing-wrap contact-layout"><div className="contact-copy"><span className="eyebrow">{tr("Contact")}</span><h1>{tr("How can we")}<br /><span>{tr("help?")}</span></h1><p>{tr("Contact us about your account, a booking or shop registration.")}</p><div className="contact-method"><span><Mail size={21} /></span><div><small>{tr("Email")}</small><a href="mailto:support@servicehub.com">{tr("support@servicehub.com")}</a></div></div><div className="contact-method"><span><MapPin size={21} /></span><div><small>{tr("Location")}</small><p>{tr("Ghaziabad, Uttar Pradesh")}</p></div></div><div className="repair-help-note"><MessageCircle size={23} /><div><h3>{tr("Already have a repair booking?")}</h3><p>{tr("Your assigned shop knows your device best. Open your repair order to start a chat or raise a query.")}</p><Link className="text-link" to={user?.role === 'shop_owner' ? '/shop/dashboard' : '/customer-dashboard'}>{tr("Go to your dashboard")}</Link></div></div></div>
    <div className="contact-form-card">{tr(reference ? <div className="contact-success" role="status"><CheckCircle2 size={45} /><h2>{tr("Message draft ready")}</h2><p>{tr("Draft saved on this browser as ")}<strong>{tr(reference)}</strong>{tr(". Open your email app to send it to the ServiceHub team.")}</p><a className="marketing-button" href={emailLink}>{tr("Open email to send")}</a><button className="text-link" onClick={() => setReference('')}>{tr("Edit message")}</button></div> : <form onSubmit={submit}><h2>{tr("Contact ServiceHub")}</h2><div className="form-fields"><label htmlFor="contact-name">{tr("Your name")}<input id="contact-name" required maxLength={100} autoComplete="name" placeholder={tr("Your full name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label htmlFor="contact-email">{tr("Email address")}<input id="contact-email" required type="email" autoComplete="email" placeholder={tr("you@email.com")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label htmlFor="contact-topic">{tr("What is this about?")}<select id="contact-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>{tr(['General question', 'My account', 'Shop registration', 'Partnership', 'Feedback'].map((t) => <option key={t} value={t}>{tr(t)}</option>))}</select></label><label htmlFor="contact-message">{tr("Your message")}<textarea id="contact-message" required minLength={10} maxLength={3000} rows={4} placeholder={tr("Describe your question")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label></div>{tr(error && <p role="alert" className="text-red-600 text-sm">{tr(error)}</p>)}<button type="submit" className="marketing-button">{tr("Prepare message")}</button><p className="contact-form-note">{tr("Opens your email app to send the message.")}</p></form>)}</div>
    </section><section className="marketing-wrap faq-section"><div><span className="eyebrow">{tr("Help")}</span><h2>{tr("Common questions")}</h2></div><div className="faq-list">{tr(faqs.map(([question, answer], i) => <div className="faq-item" key={question}><h3><button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} aria-controls={`faq-${i}`}>{tr(question)}{tr(openFaq === i ? <Minus size={19} /> : <Plus size={19} />)}</button></h3><div id={`faq-${i}`} hidden={openFaq !== i}><p>{tr(answer)}</p></div></div>))}</div></section></div>;
}
