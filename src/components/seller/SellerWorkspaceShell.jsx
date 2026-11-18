import {CUSTOMER_NAVIGATION,usesCustomerSidebar} from '../../utils/customerNavigation';
import '../../styles/customer-workspace.css';
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {NavLink,useLocation} from 'react-router-dom';
import {LayoutDashboard, ClipboardList, Store, Package, Users, Wrench, Wallet, LifeBuoy, User, Landmark, ShieldCheck, Settings, X, Menu, PanelLeftClose, Search, Receipt} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import {SELLER_NAVIGATION,usesSellerSidebar} from '../../utils/sellerNavigation';
import '../../styles/seller-navigation.css';
const SidebarContext=createContext(null);
export function SellerNavigationProvider({children}){
 const {user}=useAuth(),{pathname}=useLocation();const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem(user?.role==='customer'?'servicehub_customer_sidebar_collapsed':'servicehub_seller_sidebar_collapsed')==='true';}catch{return false;}}),[mobileOpen,setMobileOpen]=useState(false),[mobile,setMobile]=useState(false);const toggleRef=useRef(null);
 useEffect(()=>{const query=window.matchMedia?.('(max-width: 1023px)');if(!query)return;const sync=()=>{setMobile(query.matches);setMobileOpen(false);};sync();query.addEventListener?.('change',sync);return()=>query.removeEventListener?.('change',sync);},[]);
 useEffect(()=>{setMobileOpen(false);},[pathname]);
 useEffect(()=>{try{setCollapsed(localStorage.getItem(user?.role==='customer'?'servicehub_customer_sidebar_collapsed':'servicehub_seller_sidebar_collapsed')==='true');}catch{}setMobileOpen(false);},[user?.role]);
 useEffect(()=>{try{localStorage.setItem(user?.role==='customer'?'servicehub_customer_sidebar_collapsed':'servicehub_seller_sidebar_collapsed',String(collapsed));}catch{}},[collapsed,user?.role]);
 const customer=user?.role==='customer';const enabled=!/^\/(admin|super-admin-portal)(\/|$)/.test(pathname)&&(usesSellerSidebar(user,pathname)||usesCustomerSidebar(user,pathname));const navigationId=customer?'customer-workspace-navigation':'seller-workspace-navigation';const close=()=>setMobileOpen(false);const toggle=()=>{if(mobile)setMobileOpen(value=>!value);else setCollapsed(value=>!value);};
 return <SidebarContext.Provider value={{enabled,customer,navigationId,collapsed,mobile,mobileOpen,close,toggle,toggleRef}}>{children}</SidebarContext.Provider>;
}
export function SellerMenuToggle(){const state=useContext(SidebarContext),{tr}=useLanguage();if(!state?.enabled)return null;const expanded=state.mobile?state.mobileOpen:!state.collapsed;return <button ref={state.toggleRef} type="button" className="seller-menu-toggle" onClick={state.toggle} aria-label={tr(expanded?'Collapse navigation':'Open navigation')} aria-controls={state.navigationId} aria-expanded={expanded} title={tr(expanded?'Collapse navigation':'Open navigation')}>{expanded&&!state.mobile?<PanelLeftClose size={23}/>:<Menu size={23}/>}</button>;}
const icons={dashboard:LayoutDashboard,orders:ClipboardList,shop:Store,inventory:Package,team:Users,services:Wrench,earnings:Wallet,billing:Receipt,support:LifeBuoy,profile:User,payout:Landmark,history:ShieldCheck,settings:Settings,search:Search};
export default function SellerWorkspaceShell({children}){
 const state=useContext(SidebarContext),{tr}=useLanguage(),{shops}=useShop(),{user}=useAuth();const panel=useRef(null);const shop=shops.find(item=>item.id===(user?.shopId||user?.id));const customer=state?.customer,groups=customer?CUSTOMER_NAVIGATION:SELLER_NAVIGATION;
 const [failedAvatar,setFailedAvatar]=useState(null);
 const showAvatar=customer&&typeof user?.avatar==='string'&&user.avatar.startsWith('data:image/')&&failedAvatar!==user.avatar;
 useEffect(()=>{
  if(!state?.mobileOpen||!state.enabled)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const focusable=()=>Array.from(panel.current?.querySelectorAll('a[href],button:not([disabled])')||[]);focusable()[0]?.focus();
  const keydown=event=>{if(event.key==='Escape'){event.preventDefault();state.close();return;}if(event.key==='Tab'){const targets=focusable(),first=targets[0],last=targets[targets.length-1];if(!targets.length)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
  document.addEventListener('keydown',keydown);
  return()=>{document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;(state.toggleRef.current||previous)?.focus();};
 },[state?.mobileOpen,state?.enabled]);
 if(!state?.enabled||!user)return children;
 return <div className={'seller-workspace-shell sv-account-layout '+(customer?'customer-workspace-shell ':'')+(state.collapsed?'is-collapsed ':'')+(state.mobileOpen?'is-drawer-open':'')}>
  {state.mobileOpen&&<button type="button" className="seller-sidebar-backdrop" onClick={state.close} aria-label={tr('Close navigation')} tabIndex={-1}/>}
  <aside ref={panel} id={state.navigationId} className="seller-sidebar" role={state.mobile&&state.mobileOpen?'dialog':undefined} aria-modal={state.mobile&&state.mobileOpen?true:undefined} aria-label={tr(customer?'Customer navigation':'Seller navigation')}>
   <header className="seller-sidebar-heading"><span className="seller-sidebar-symbol">{showAvatar?<img className="sidebar-profile-photo" src={user.avatar} alt="" onError={()=>setFailedAvatar(user.avatar)}/>:customer?<User size={25}/>:<Store size={25}/>}</span><div><strong>{tr(customer?'Customer workspace':'Seller workspace')}</strong><span>{customer?user.name:(shop?.shopName||user.name)}</span></div><button type="button" className="seller-sidebar-close" onClick={state.close} aria-label={tr('Close navigation')}><X size={22}/></button></header>
   <nav aria-label={tr(customer?'Customer navigation':'Seller navigation')}>{groups.map(group=><section key={group.label}><h2>{tr(group.label)}</h2><ul>{group.items.map(([path,label,key])=>{const Icon=icons[key];return <li key={path}><NavLink end={path!=='/dashboard/members'} to={path} title={tr(label)} aria-label={tr(label)} onClick={state.close}><Icon size={23} aria-hidden="true"/><span>{tr(label)}</span></NavLink></li>;})}</ul></section>)}</nav>
   <footer><span className="seller-sidebar-dot"/><span>{tr(customer?'Your repairs, in one place':'ServiceHub for businesses')}</span></footer>
  </aside>
  <div className="seller-workspace-main">{children}</div>
 </div>;
}

