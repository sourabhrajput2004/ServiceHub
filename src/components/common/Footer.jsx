import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Wrench} from 'lucide-react';
import {useLanguage} from '../../context/LanguageContext';
import {useAuth} from '../../context/AuthContext';
import {accountNavigation, supportPath} from '../../utils/navigation';

const exploreLinks = [['/', 'Home'], ['/about', 'About us'], ['/find-shop', 'Find a shop'], ['/contact', 'Contact']];

export default function Footer() {
  const {tr} = useLanguage();
  const {user} = useAuth();
  const {pathname} = useLocation();
  if (pathname.startsWith('/pay/') || pathname === '/member-login' || /^\/(technician|staff)\//.test(pathname)) return null;
  if (['shop_owner', 'customer'].includes(user?.role)) {
    return <footer className="seller-utility-footer">
      <span>&copy; {new Date().getFullYear()} ServiceHub</span>
      <nav aria-label={tr('Policies')}>
        <Link to="/about">{tr('About us')}</Link>
        <Link to="/contact">{tr('Contact')}</Link>
        <Link to="/privacy-policy">{tr('Privacy Policy')}</Link>
        <Link to="/terms-and-conditions">{tr('Terms & Conditions')}</Link>
      </nav>
    </footer>;
  }
  return <footer className="service-footer">
    <div className="footer-container">
      <div className="footer-main">
        <div className="footer-identity">
          <Link to="/" className="footer-brand">
            <span className="footer-brand-icon"><Wrench size={22}/></span>
            {tr('Service')}<span>{tr('Hub')}</span>
          </Link>
          <p>{tr('Repairs, bookings and service records.')}</p>
        </div>
        <div className="footer-link-group">
          <h2>{tr('Explore')}</h2>
          <ul className="footer-link-list">{exploreLinks.map(([path, label]) => <li key={path}><Link to={path}>{tr(label)}</Link></li>)}</ul>
        </div>
        <div className="footer-link-group">
          <h2>{tr('Your ServiceHub')}</h2>
          <ul className="footer-link-list">{accountNavigation(user).map(([path, label]) => <li key={path}><Link to={path}>{tr(label)}</Link></li>)}</ul>
        </div>
        <div className="footer-contact">
          <h2>{tr('Get in touch')}</h2>
          <p>{tr('Find an answer or get in touch with us.')}</p>
          <Link to={user ? supportPath(user) : '/contact'}>{tr(user ? 'Support' : 'Visit our contact page')}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()}{tr(' ServiceHub. All rights reserved.')}</p>
        <nav className="footer-policy-links" aria-label={tr('Policies')}>
          <Link to="/privacy-policy">{tr('Privacy Policy')}</Link>
          <span aria-hidden="true">&middot;</span>
          <Link to="/terms-and-conditions">{tr('Terms & Conditions')}</Link>
        </nav>
      </div>
    </div>
  </footer>;
}
