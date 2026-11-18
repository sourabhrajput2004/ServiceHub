import {SellerMenuToggle} from '../seller/SellerWorkspaceShell';
import { useLanguage } from "../../context/LanguageContext";import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {Wrench, User, LogOut} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitch from './LanguageSwitch';
import ThemeSwitch from './ThemeSwitch';
import ScrollProgress from './ScrollProgress';
import { mainNavigation, dashboardPath, navigationActive } from '../../utils/navigation';

function AccountAvatar({ avatar }) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[avatar]);
 const uploaded=typeof avatar==='string' && avatar.startsWith('data:image/');
 return <span className="navbar-avatar">{uploaded&&!failed?<img src={avatar} alt="" onError={()=>setFailed(true)}/>:<User className="w-3.5 h-3.5"/>}</span>;
}

export default function Navbar() {const { tr } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef=useRef(null);
  useEffect(()=>{if(!['shop_owner','customer'].includes(user?.role))return;const sync=()=>document.documentElement.style.setProperty?.('--seller-header-height',Math.ceil(headerRef.current?.getBoundingClientRect?.()?.height||88)+'px');sync();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(sync):null;if(headerRef.current)observer?.observe(headerRef.current);window.addEventListener('resize',sync);return()=>{observer?.disconnect();window.removeEventListener('resize',sync);};},[user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const publicPage=['/','/about','/contact'].includes(location.pathname)||(location.pathname==='/find-shop'&&!user);
  const links = !publicPage&&user?.role==='customer'?[]:mainNavigation(publicPage?null:user);
  if(location.pathname.startsWith('/pay/')||location.pathname==='/member-login'||/^\/(technician|staff)\//.test(location.pathname))return null;

  return (
    <header ref={headerRef} className={'service-navbar sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 '+(!publicPage&&['shop_owner','customer'].includes(user?.role)?'seller-navbar':'')}>
      <div className="navbar-shell">
        {!publicPage&&['shop_owner','customer'].includes(user?.role)&&<SellerMenuToggle/>}
        <Link to={!publicPage&&user ? dashboardPath(user) : "/"} className="navbar-brand flex items-center gap-2.5 group">
          <div className="brand-symbol w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="brand-wordmark font-extrabold text-xl tracking-tight text-slate-900 leading-none">{tr("Service")}
              <span className="text-blue-600">{tr("Hub")}</span>
            </div>

          </div>
        </Link>

        {links.length>0&&<nav aria-label={tr("Main navigation")} className="desktop-main-nav hidden 2xl:flex items-center gap-8 text-xl font-bold text-slate-700">
          {links.map(([path,label]) => <Link key={path} to={path} aria-current={navigationActive(path,location.pathname,location.hash) ? 'page' : undefined} className="public-nav-link hover:text-blue-600 transition">{tr(label)}</Link>)}
        </nav>}

        <div className="navbar-actions">
          <ThemeSwitch />
          <LanguageSwitch />
          {tr(!publicPage&&user
          ? <div className="flex items-center gap-2.5">
              {['shop_owner','customer'].includes(user.role)&&<div className="seller-user-identity" title={user.name}><AccountAvatar avatar={user.avatar}/><span>{user.name}</span></div>}

              {tr(user.role === 'admin' &&
            <Link
              to="/super-admin-portal/dashboard"
              className="flex items-center gap-1.5 bg-slate-900 text-amber-300 font-semibold text-xs px-3 py-2 rounded-xl transition border border-slate-700">{tr("Admin Console")}


            </Link>)
            }

              <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition"
              title={tr("Logout from account")}>
              
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>{tr("Logout")}</span>
              </button>
            </div> :

          <div className="flex items-center gap-2.5">
              <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition">{tr("Sign In")}


            </Link>
              <Link
              to="/register"
              className="text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20 transition">{tr("Sign Up")}


            </Link>
            </div>)
          }
        </div>
      </div>
      {links.length>0&&<nav aria-label={tr("Mobile navigation")} className="public-mobile-nav">
        {links.map(([path,label]) => <Link key={path} to={path} aria-current={navigationActive(path,location.pathname,location.hash) ? 'page' : undefined}>{tr(label)}</Link>)}
      </nav>}
      <ScrollProgress />
    </header>);

}

