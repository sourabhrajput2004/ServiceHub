import {personNameInput} from '../utils/contactFields';
import '../styles/register.css';
import { useLanguage } from "../context/LanguageContext";import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {User, Store, Eye, EyeOff} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { passwordStatus, validateCustomerSignup } from '../utils/signupValidation';

export default function Register({ customerPage = false }) {const { tr } = useLanguage();
  const { setUser, checkRegistrationContact } = useAuth();
  const { shops } = useShop();
  const navigate = useNavigate();

  const selectedRole = customerPage?  'customer' : null; const setSelectedRole = role => navigate(role === 'customer' ? '/register/customer' : '/register-shop'); // 'customer' | 'shop_owner' | null

  // Customer form fields
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    locality: '',
    password: '',
    confirmPassword: ''
  });

  const [visiblePasswords,setVisiblePasswords]=useState({password:false,confirmPassword:false});
  const [contactErrors,setContactErrors]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const validationErrors=validateCustomerSignup(customerData);
  const errors={...contactErrors,...validationErrors};
  const password=passwordStatus(customerData.password);
  const updateField=(key,value)=>{if(key==='name')value=personNameInput(value);setCustomerData(previous=>({...previous,[key]:value}));setContactErrors(previous=>{const next={...previous};delete next[key];return next;});};
  const showError=key=>Boolean(submitted&&errors[key]);
  const fieldError=key=>showError(key)?<p id={key+'-error'} className="registration-field-error" aria-live="polite">{tr(errors[key])}</p>:null;

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setContactErrors({});
    if(Object.keys(validationErrors).length){document.getElementById('signup-'+Object.keys(validationErrors)[0])?.focus();return;}
    const duplicateErrors=checkRegistrationContact(customerData,shops,true);
    if(Object.keys(duplicateErrors).length){setContactErrors(duplicateErrors);document.getElementById('signup-'+Object.keys(duplicateErrors)[0])?.focus();return;}
    const newCustomer = {
      id: 'cust_' + Date.now(),
      name: customerData.name.trim(),
      email: customerData.email.trim().toLowerCase(),
      phone: customerData.phone,
      whatsappNumber: customerData.whatsappNumber,
      whatsappVerificationStatus: 'Unverified',
      locality: customerData.locality.trim(),
      city: 'Ghaziabad',
      address: `${customerData.locality.trim()}, Ghaziabad, Uttar Pradesh`,
      role: 'customer',
      memberSince: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    };
    setUser(newCustomer);
    navigate('/customer-dashboard');
  };

  return (
    <div className="workspace-page page-register bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`register-shell w-full ${customerPage ? 'register-detail-shell' : ''}`}>
        
        {/* Header */}
        <div className="register-heading">{customerPage&&<Link className="auth-switch-button" to="/register-shop">{tr("Switch to Shop Owner Registration")}</Link>}
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{tr(customerPage ? 'Create your customer account' : 'Create Your ServiceHub Account')}

          </h2>
          <p className="text-xs sm:text-sm text-slate-500">{tr(customerPage ? 'Book repairs and keep your service records in one place.' : 'Select how you would like to use the ServiceHub Ghaziabad platform')}

          </p>
        </div>

        {/* Role Choice Cards */}
        {!customerPage && <div className="register-role-grid">
          
          {/* Option 1: Customer */}
          <div
            onClick={() => setSelectedRole('customer')}
            className={`register-role-card p-6 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
            selectedRole === 'customer'
            ? 'border-blue-600 bg-blue-50/40 shadow-sm' :
            'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
            }>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{tr("I am a Customer")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tr("Find trusted local repair shops in Ghaziabad, book repairs, and track history digitally.")}

              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <span>{tr("Sign Up as Customer")}</span>
              
            </div>
          </div>

          {/* Option 2: Shop Owner */}
          <div
            onClick={() => {
              setSelectedRole('shop_owner');
              navigate('/register-shop');
            }}
            className={`register-role-card p-6 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
            selectedRole === 'shop_owner'
            ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' :
            'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
            }>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{tr("I am a Shop Owner")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tr("Register your repair shop, get verified, manage job cards digitally, and get local customers.")}

              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <span>{tr("Register Repair Shop")}</span>
              
            </div>
          </div>

        </div>}

        {/* Customer Registration Form (Shown if Customer option is picked) */}
        {tr(selectedRole === 'customer' &&
        <form noValidate onSubmit={handleCustomerSubmit} className="register-customer-form pt-4 border-t border-slate-100 space-y-4 text-xs">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />{tr("Customer Information")}

          </h4>

            <div className="register-fields grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['name','Your Full Name *','text','e.g. Sourabh Singh','name'],['phone','Mobile Number *','tel','10-digit number','tel'],['whatsappNumber','WhatsApp Number *','tel','10-digit WhatsApp number','tel'],['email','Email Address *','email','you@example.com','email'],['locality','Locality in Ghaziabad *','text','e.g. Raj Nagar, Sanjay Nagar, Modinagar','address-line1']].map(([key,label,type,placeholder,autocomplete])=><div key={key}>
                <label htmlFor={'signup-'+key} className="block font-semibold text-slate-700 mb-1">{tr(label)}</label>
                <input id={'signup-'+key} type={type} required maxLength={key==='name'?100:['phone','whatsappNumber'].includes(key)?10:key==='email'?254:250} inputMode={['phone','whatsappNumber'].includes(key)?'numeric':undefined} autoComplete={key==='email'?'off':autocomplete} data-protonpass-ignore={key==='email'?'true':undefined} data-1p-ignore={key==='email'?'true':undefined} data-lpignore={key==='email'?'true':undefined} data-bwignore={key==='email'?'true':undefined} placeholder={tr(placeholder)} value={customerData[key]} aria-invalid={showError(key)} aria-describedby={showError(key)?key+'-error':undefined} onChange={event=>updateField(key,event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"/>
                {fieldError(key)}{key==='whatsappNumber'&&<small>{tr("Used for repair updates and invoices. Number verification is unavailable.")}</small>}
              </div>)}
              {['password','confirmPassword'].map(key=><div key={key}>
                <label htmlFor={'signup-'+key} className="block font-semibold text-slate-700 mb-1">{tr(key==='password'?'Create Password *':'Confirm Password *')}</label>
                <div className="registration-password">
                  <input id={'signup-'+key} type={visiblePasswords[key]?'text':'password'} required minLength={8} maxLength={128} autoComplete="new-password" placeholder={tr(key==='password'?'At least 8 characters':'Enter your password again')} value={customerData[key]} aria-invalid={showError(key)} aria-describedby={[showError(key)?key+'-error':'',key==='password'?'password-rules':''].filter(Boolean).join(' ')||undefined} onChange={event=>updateField(key,event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"/>
                  <button type="button" className="registration-eye" aria-label={tr(visiblePasswords[key]?'Hide password':'Show password')} aria-controls={'signup-'+key} aria-pressed={visiblePasswords[key]} onClick={()=>setVisiblePasswords(previous=>({...previous,[key]:!previous[key]}))}>{visiblePasswords[key]?<EyeOff size={22}/>:<Eye size={22}/>}</button>
                </div>
                {fieldError(key)}
                {key==='password'&&<div className="signup-password-feedback">
                  {customerData.password&&<div className={'password-strength strength-'+password.strength.toLowerCase()} role="status"><span>{tr('Password strength')}: <strong>{tr(password.strength)}</strong></span><div className="password-strength-track"><span/></div></div>}
                  <ul id="password-rules" className="password-rules">{password.rules.map(rule=><li key={rule.key} className={rule.met?'rule-met':submitted?'rule-missing':'rule-pending'}><span aria-hidden="true">{rule.met?'✓':'○'}</span>{tr(rule.label)}</li>)}</ul>
                </div>}
              </div>)}
            </div>

            <button
            type="submit"
            className="registration-submit py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2">
            
              <span>{tr("Complete Customer Sign Up")}</span>
              
            </button>
          </form>)
        }

        {/* Footer sign in link */}
        <div className="register-signin text-center text-xs text-slate-500">{tr("Already have an account?")}
          {tr(' ')}
          <Link to={customerPage?"/login/customer":"/login"} className="text-blue-600 font-bold hover:underline">{tr("Sign In here")}

          </Link>
        </div>

      </div>
    </div>);

}


