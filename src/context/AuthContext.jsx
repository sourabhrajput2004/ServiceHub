import {stopTechnicianLocation} from '../utils/liveTechnicianLocation';
import {useInRouterContext,useLocation} from 'react-router-dom';
import { registrationContactError, registrationContactErrors,normalizePhone } from '../utils/registrationValidation';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const INITIAL_USERS = [
  {
    id: 'admin_1',
    name: 'Super Admin',
    email: 'admin@servicehub.com',
    role: 'admin',
    phone: '9876543210'
  },

];

export const AuthProvider = ({ children }) => {
  const routed=useInRouterContext();
  const location=routed?useLocation():null;
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const isMember=value=>['technician','staff'].includes(value?.role);
  const [publicUser,setPublicUser]=useState(()=>{const saved=read('servicehub_user');return isMember(saved)?null:saved;});
  const [memberUser,setMemberUser]=useState(()=>read('servicehub_member_user')||(isMember(read('servicehub_user'))?read('servicehub_user'):null));
  const [standaloneUser,setStandaloneUser]=useState(()=>read('servicehub_user'));
  const memberRoute=/^\/(member-login|technician|staff)(\/|$)/.test(location?.pathname||'');
  const user=routed?(memberRoute?(memberUser):publicUser):standaloneUser;
  const setUser=value=>{const next=typeof value==='function'?value(user):value;if(!routed)setStandaloneUser(next);if(next){if(isMember(next))setMemberUser(next);else setPublicUser(next);}else if(memberRoute||(!routed&&isMember(user)))setMemberUser(null);else setPublicUser(null);};

  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('123456');

  useEffect(()=>{
    if(publicUser){localStorage.setItem('servicehub_user',JSON.stringify(publicUser));const accounts=read('servicehub_accounts')||{};accounts[publicUser.role+':'+String(publicUser.email||'').trim().toLowerCase()]=publicUser;localStorage.setItem('servicehub_accounts',JSON.stringify(accounts));}
    else localStorage.removeItem('servicehub_user');
  },[publicUser]);
  useEffect(()=>{if(memberUser)localStorage.setItem('servicehub_member_user',JSON.stringify(memberUser));else localStorage.removeItem('servicehub_member_user');},[memberUser]);

  const checkRegistrationContact = (contact, shops = [], fieldErrors = false) => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('servicehub_accounts') || '{}') || {}; } catch { /* Use available in-memory accounts. */ }
    return (fieldErrors ? registrationContactErrors : registrationContactError)(contact, [...INITIAL_USERS,...Object.values(saved),...(user?[user]:[]),...shops]);
  };

  const login = (email, password, role) => {
    // If Admin, trigger 2FA OTP flow
    if (role === 'admin' || email === 'admin@servicehub.com') {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(generated);
      setOtpSent(true);
      return { status: '2fa_required', otp: generated };
    }

    // Customer or Shop Owner login
    email = email.trim().toLowerCase();
    const accounts = JSON.parse(localStorage.getItem('servicehub_accounts') || '{}');
    const customerLogin=(role||'customer')==='customer',phoneLogin=customerLogin&&!email.includes('@');
    if(customerLogin&&(phoneLogin?!/^[6-9]\d{9}$/.test(normalizePhone(email)):!/^\S+@\S+\.\S+$/.test(email)))return {status:'error',error:'Enter a valid email address or registered 10-digit phone number.'};
    const matches=phoneLogin?Object.values(accounts).filter(account=>account?.role==='customer'&&normalizePhone(String(account.phone||''))===normalizePhone(email)):[];
    const unique=[...new Map(matches.map(account=>[account.id||account.email,account])).values()];
    if(phoneLogin&&unique.length!==1)return {status:'error',error:unique.length?'Multiple accounts use this phone number. Sign in with your email.':'No customer account found with this phone number. Please sign up first.'};
    const savedUser = phoneLogin?unique[0]:accounts[(role || 'customer') + ':' + email];
    const foundUser = savedUser || {
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0],
      role: role || 'customer',
      phone: '',
      city: 'Ghaziabad',
      locality: 'RDC, Raj Nagar',
      address: '',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
      memberSince: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    };
    setUser(foundUser);
    return { status: 'success', user: foundUser };
  };

  const verifyAdmin2FA = (enteredOtp, email) => {
    if (enteredOtp === mockOtp || enteredOtp === '123456') {
      const adminUser = {
        id: 'admin_root',
        name: 'ServiceHub Super Admin',
        email: email || 'admin@servicehub.com',
        role: 'admin',
        twoFactorVerified: true
      };
      setUser(adminUser);
      setOtpSent(false);
      return { success: true };
    }
    return { success: false, error: 'Invalid 2FA OTP code. Please try again.' };
  };

  const logout = () => {
    if(user?.role==='technician')stopTechnicianLocation(user.id,'Logged out');
    setUser(null);
    setOtpSent(false);
  };

  const updateProfile = (updates) => {
    if (!user) return { success: false, error: 'Please sign in to edit your profile.' };

    const nextUser = {
      ...user,
      ...updates,
      id: user.id,
      role: user.role,
      updatedAt: new Date().toISOString()
    };

    if(nextUser.email!==user.email){
      const accounts=read('servicehub_accounts')||{};
      delete accounts[user.role+':'+String(user.email||'').trim().toLowerCase()];
      localStorage.setItem('servicehub_accounts',JSON.stringify(accounts));
    }
    setUser(nextUser);
    return { success: true, user: nextUser };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        updateProfile,
        checkRegistrationContact,
        verifyAdmin2FA,
        logout,
        otpSent,
        setOtpSent,
        mockOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

