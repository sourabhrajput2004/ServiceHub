import { addressSummary } from '../utils/savedAddresses';
import React from 'react';
import { Link } from 'react-router-dom';
import {User, Settings, MapPin, Mail, Phone} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
export default function Profile() {
 const {tr}=useLanguage();const {user}=useAuth();
 const initials=(user?.name||'U').split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();
 const fields=[['Full name',user?.name,User],['Mobile number',user?.phone,Phone],['Email address',user?.email,Mail],['City',user?.city,MapPin]];
 return <div className={'account-page '+(user?.role==='customer'?'customer-profile ':'')+'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10'}><header className="account-page-heading"><User size={32}/><h1>{tr('Your Profile')}</h1></header><section className="account-panel profile-readonly"><div className="profile-summary"><div className="profile-avatar">{user?.avatar?<img src={user.avatar} alt={user.name}/>:initials}</div><div><h2>{user?.name||tr('Your name')}</h2><p>{tr(user?.role==='customer'?'Customer':user?.role==='shop_owner'?'Shop Owner':'Admin')}</p></div><Link to="/settings"><Settings size={22}/>{tr('Open Settings')}</Link></div><dl className="profile-data">{fields.map(([label,value,Icon])=><div key={label}><dt><Icon size={21}/>{tr(label)}</dt><dd>{value||tr('Not provided')}</dd></div>)}<div className="profile-address"><dt><MapPin size={21}/>{tr('Address')}</dt><dd>{user?.address||tr('Not provided')}</dd></div></dl></section>{user?.savedAddresses?.length>0&&<section className="account-panel"><h2>{tr('Saved addresses')}</h2><div className="saved-item-list">{user.savedAddresses.map((address,index)=><article key={address.id}><strong>{tr('Address')} {index+1}</strong>{address.isDefault&&<span>{tr('Default')}</span>}<p>{addressSummary(address)}</p></article>)}</div><Link to="/settings">{tr('Manage in Settings')}</Link></section>}</div>;
}
