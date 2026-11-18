import '../styles/auth.css';
import { useLanguage } from "../context/LanguageContext";import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {Lock, Mail, User, Store, AlertCircle, Info, Eye, EyeOff} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';

export default function Login({ accountRole }) {const { tr } = useLanguage();
  const { login, setUser } = useAuth();
  const { shops } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectMessage = location.state?.message;
  const redirectPath = location.state?.from?.pathname;

  const role = accountRole || location.state?.preferredRole || 'customer'; const setRole = next => navigate(next === 'customer' ? '/login/customer' : '/login/shop', {state:location.state}); // 'customer' | 'shop_owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,setError]=useState('');

  const handleSuccessfulAuth = (targetRole, customPath) => {
    if (redirectPath) {
      navigate(redirectPath);
    } else if (customPath) {
      navigate(customPath);
    } else if (targetRole === 'shop_owner') {
      navigate('/shop/dashboard');
    } else {
      navigate('/customer-dashboard');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(email, password, role);
    if(res.status==='error'){setError(res.error);return;}
    if (res.status === 'success') {
      if (role === 'shop_owner') {
        const shop = shops.find((s) => s.email?.toLowerCase() === email.trim().toLowerCase());
        if (shop) setUser({ ...res.user, id: shop.id, shopId: shop.id, name: shop.ownerName });
      }
      handleSuccessfulAuth(role);
    }
  };

  // Quick One-Click Demo Logins for smooth evaluation
  const loginQuickAs = (type) => {
    if (type === 'customer') {
      setUser({
        id: 'cust_1',
        name: 'Sourabh Singh',
        email: 'sourabh@example.com',
        role: 'customer',
        phone: '9891234567',
        city: 'Ghaziabad',
        locality: 'RDC, Raj Nagar',
        address: 'RDC, Raj Nagar, Ghaziabad, Uttar Pradesh',
        memberSince: 'September 2026'
      });
      handleSuccessfulAuth('customer', '/customer-dashboard');
    } else if (type === 'shop') {
      const shop = shops[0];
      setUser({
        id: shop.id,
        name: shop.ownerName,
        email: shop.email,
        role: 'shop_owner',
        shopId: shop.id
      });
      handleSuccessfulAuth('shop_owner', '/shop/dashboard');
    }
  };

  return (
    <div className={`auth-page auth-${role} workspace-page page-login bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="auth-shell w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Redirect Notice if routed from protected area */}
        {tr(redirectMessage &&
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{tr(redirectMessage)}</span>
          </div>)
        }

        {/* Title */}
        <div className="auth-heading text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{tr(accountRole ? role === 'customer' ? 'Customer sign in' : 'Shop owner sign in' : 'Sign In to ServiceHub')}

          </h2>
          <p className="text-xs text-slate-500">{tr("Choose your account type: Customer or Shop Owner")}

          </p>
        </div>

        {/* Role Selector Tabs (Only Customer and Shop Owner) */}
        <div className="auth-role-tabs grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            aria-pressed={role==='customer'} onClick={() => setRole('customer')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            role === 'customer' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'}`
            }>
            
            <User className="w-4 h-4" />{tr("Customer")}

          </button>

          <button
            type="button"
            aria-pressed={role==='shop_owner'} onClick={() => setRole('shop_owner')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            role === 'shop_owner' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'}`
            }>
            
            <Store className="w-4 h-4" />{tr("Shop Owner")}

          </button>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {tr(role === 'customer' ? 'Email or phone number' : 'Registered Shop Email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={role==='customer'?'text':'email'}
                autoComplete={role==='customer'?'username':'email'}
                required
                placeholder={tr(role === 'customer' ? 'Email or registered mobile number' : 'owner@shop.com')}
                value={email}
                onChange={(e) => {setEmail(e.target.value);setError('');}}
                aria-label={role==='customer'?'Email or phone number':'Registered Shop Email'}
                aria-invalid={Boolean(error)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs" />
              
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block font-semibold text-slate-700 mb-1">{tr("Password")}</label>
            <div className="relative auth-password-field">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs" />
              
              <button type="button" className="auth-password-eye" aria-label={tr(showPassword ? 'Hide password' : 'Show password')} aria-controls="login-password" aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword ? <EyeOff size={21}/> : <Eye size={21}/>}</button>
            </div>
          </div>

          {error&&<p role="alert" className="text-red-600 text-sm">{tr(error)}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2">
            
            <span>{tr("Continue as ")}{tr(role === 'customer' ? 'Customer' : 'Shop Owner')}</span>
            
          </button>
        </form>

        {/* One-Click Quick Test Accounts */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">{tr("One-Click Test Login:")}

          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => loginQuickAs('customer')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 transition flex items-center gap-1.5 justify-center">
              
              <User className="w-3.5 h-3.5 text-blue-600" />{tr("Test Customer")}

            </button>
            <button
              onClick={() => loginQuickAs('shop')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 transition flex items-center gap-1.5 justify-center">
              
              <Store className="w-3.5 h-3.5 text-blue-600" />{tr("Test Shop Owner")}

            </button>
          </div>
        </div>


        {/* Sign up link */}
        <div className="text-center text-xs text-slate-500 pt-1">{tr("Don't have an account yet?")}
          {tr(' ')}
          <Link to={role === "customer" ? "/register/customer" : "/register-shop"} className="text-blue-600 font-bold hover:underline">{tr("Sign Up here")}

          </Link>
        </div>

      </div>
    </div>);

}
