import {TechnicianLocationProvider} from './context/TechnicianLocationContext';
import GuestPayment from './pages/customer/GuestPayment';
import BillPage from './pages/shop/BillPage';
import {WorkforceProvider} from './context/WorkforceContext';
import SellerWorkspaceShell,{SellerNavigationProvider} from './components/seller/SellerWorkspaceShell';
import {SellerProfile,PayoutAccount,VerificationHistory} from './pages/seller/SellerAccountPages';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import LegalPage from './pages/LegalPage';
import './styles/marketing.css';
import Login from './pages/Login';
import Register from './pages/Register';
import FindShop from './pages/customer/FindShop';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ShopRegister from './pages/shop/ShopRegister';
import ShopDashboard from './pages/shop/ShopDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SupportPage from './pages/SupportPage';
import MyShop from './pages/MyShop';
import './styles/account-pages.css';
import { SupportProvider } from './context/SupportContext';
import { useLanguage } from './context/LanguageContext';

const MemberActivity=React.lazy(()=>import('./pages/workforce/MemberActivity'));
const Members=React.lazy(()=>import('./pages/workforce/Members'));
const MemberEdit=React.lazy(()=>import('./pages/workforce/Members').then(module=>({default:module.MemberEdit})));
const MemberInvite=React.lazy(()=>import('./pages/workforce/Members').then(module=>({default:module.MemberInvite})));
const MemberLogin=React.lazy(()=>import('./pages/workforce/MemberAccess'));
const Workspace=React.lazy(()=>import('./pages/workforce/WorkerEntry'));
function RouteEffects() {
  const { tr, language } = useLanguage();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return; }
    const frame = requestAnimationFrame(() => {
      let id; try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  useEffect(() => {
    const titles = { '/shop/billing':'Billing', '/register': 'Create Your ServiceHub Account', '/register/customer': 'Create your customer account', '/shop/profile':'Shop profile','/shop/payout-account':'Payout Account','/dashboard/verification':'Verification History','/shop/verification-history':'Verification History','/register-shop': 'Seller verification', '/login': 'Sign In to ServiceHub', '/login/customer': 'Customer sign in', '/login/shop': 'Shop owner sign in', '/': 'Local device repair in Ghaziabad', '/about': 'About us', '/contact': 'Contact us', '/find-shop': 'Find repair shops', '/privacy-policy': 'Privacy Policy', '/terms-and-conditions': 'Terms & Conditions', '/my-repairs': 'My Repairs', '/support': 'Support', '/settings': 'Settings', '/profile': 'Profile', '/my-shop': 'My Shop' };
    document.title = `ServiceHub | ${tr(titles[pathname] || 'Your repair hub')}`;
  }, [pathname, language, tr]);
  if (pathname === '/customer-dashboard' && hash === '#repair-orders') return <Navigate to="/my-repairs" replace />;
  if (pathname === '/shop/dashboard' && hash === '#shop-orders') return <Navigate to="/shop/orders" replace />;
  if (hash === '#support-inbox' && ['/customer-dashboard','/shop/dashboard'].includes(pathname)) return <Navigate to="/support" replace />;
  // Keep older section links useful after the pages were separated.
  if (pathname === '/' && (hash === '#about' || hash === '#contact')) return <Navigate to={hash.slice(1) === 'about' ? '/about' : '/contact'} replace />;
  return null;
}

function PublicChrome({children}){const {pathname}=useLocation();return /^\/(admin|super-admin-portal)(\/|$)/.test(pathname)?null:children;}

export default function App() {
  return (
    <Router><AuthProvider>
      <ShopProvider>
        <WorkforceProvider><TechnicianLocationProvider><SupportProvider>

          <SellerNavigationProvider>
          <RouteEffects />
          <div className="app-frame min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <PublicChrome><Navbar /></PublicChrome>
            <main className="app-content flex-1">
              <SellerWorkspaceShell><React.Suspense fallback={<div role="status" className="p-8 space-y-5"><p>Loading workspace…</p><div className="h-24 rounded-xl bg-slate-200 animate-pulse"/><div className="h-48 rounded-xl bg-slate-200 animate-pulse"/></div>}><Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
                <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/customer" element={<Login key="customer" accountRole="customer" />} />
                <Route path="/login/shop" element={<Login key="shop" accountRole="shop_owner" />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/customer" element={<Register key="customer-registration" customerPage />} />
                <Route path="/find-shop" element={<FindShop />} />
                <Route path="/register-shop" element={<ShopRegister />} />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route path="/shop/profile" element={<ProtectedRoute allowedRoles={['shop_owner']}><SellerProfile/></ProtectedRoute>}/>
                <Route path="/shop/payout-account" element={<ProtectedRoute allowedRoles={['shop_owner']}><PayoutAccount/></ProtectedRoute>}/>
                <Route path="/dashboard/verification" element={<ProtectedRoute allowedRoles={['shop_owner']}><VerificationHistory/></ProtectedRoute>}/>
                <Route path="/shop/verification-history" element={<ProtectedRoute allowedRoles={['shop_owner']}><Navigate to="/dashboard/verification" replace/></ProtectedRoute>}/>
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                <Route path="/my-repairs" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard view="repairs" /></ProtectedRoute>} />
                <Route path="/my-shop" element={<ProtectedRoute allowedRoles={['shop_owner']}><MyShop /></ProtectedRoute>} />
                <Route path="/shop/billing/new" element={<ProtectedRoute allowedRoles={['shop_owner']}><BillPage/></ProtectedRoute>}/><Route path="/staff/orders/bill/new" element={<ProtectedRoute allowedRoles={['staff']}><BillPage/></ProtectedRoute>}/>
                {['orders','inventory','billing','services'].map(view => <Route key={view} path={'/shop/'+view} element={<ProtectedRoute allowedRoles={['shop_owner']}><ShopDashboard view={view} /></ProtectedRoute>} />)}

                
                <Route path="/dashboard/technicians" element={<ProtectedRoute allowedRoles={['shop_owner']}><Members key="field-technicians" role="technician"/></ProtectedRoute>}/>
                <Route path="/shop/technicians" element={<ProtectedRoute allowedRoles={['shop_owner']}><Navigate to="/dashboard/technicians" replace/></ProtectedRoute>}/>
                <Route path="/shop/staff" element={<ProtectedRoute allowedRoles={['shop_owner']}><Members key="staff" role="staff"/></ProtectedRoute>}/>
                <Route path="/dashboard/members" element={<ProtectedRoute allowedRoles={['shop_owner']}><Members key="members"/></ProtectedRoute>}/>
                <Route path="/dashboard/members/:id/edit" element={<ProtectedRoute allowedRoles={['shop_owner']}><MemberEdit/></ProtectedRoute>}/>
                <Route path="/dashboard/members/:id/activity" element={<ProtectedRoute allowedRoles={['shop_owner']}><MemberActivity/></ProtectedRoute>}/>
                <Route path="/dashboard/members/add" element={<ProtectedRoute allowedRoles={['shop_owner']}><Members key="add-member" addPage/></ProtectedRoute>}/>
                <Route path="/member-invite/:token" element={<MemberInvite/>}/>
                <Route path="/pay/:token" element={<GuestPayment/>}/>
                <Route path="/member-login" element={<MemberLogin/>}/>
                {['dashboard','jobs','history','schedule','support','profile','settings'].map(screen=><Route key={'technician-'+screen} path={'/technician/'+screen} element={<ProtectedRoute allowedRoles={['technician','shop_owner']}><Workspace role="technician" screen={screen}/></ProtectedRoute>}/>) }
                {['orders','inventory','billing','services','profile'].map(screen=><Route key={'staff-'+screen} path={'/staff/'+screen} element={<ProtectedRoute allowedRoles={['staff','shop_owner']}><Workspace role="staff" screen={screen}/></ProtectedRoute>}/>) }

                {/* Protected Customer Routes */}
                <Route
                  path="/customer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Shop Owner Routes */}
                <Route
                  path="/shop/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner']}>
                      <ShopDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Dedicated Secret Super Admin Portal */}
                <Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin/shops" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard view="shops"/></ProtectedRoute>}/><Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard view="support"/></ProtectedRoute>}/><Route path="/super-admin-portal" element={<Navigate to="/admin/login" replace />} />
                <Route
                  path="/super-admin-portal/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes></React.Suspense></SellerWorkspaceShell>
            </main>
            <PublicChrome><Footer /></PublicChrome>
          </div>
          </SellerNavigationProvider>

      </SupportProvider></TechnicianLocationProvider></WorkforceProvider>
      </ShopProvider>
    </AuthProvider></Router>
  );
}
