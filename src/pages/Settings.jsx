import {personNameInput} from '../utils/contactFields';
import '../styles/seller-account-workspace.css';
import {SellerAccountLayout,ContactVerification,useVerificationToasts} from '../components/seller/VerificationUI';
import React, { useEffect, useRef, useState } from 'react';
import {Settings as SettingsIcon, User, Mail, MapPin, Bell, Trash2, Pencil, Plus, Check} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { addressDraft, addressSummary } from '../utils/savedAddresses';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { validatePersonalDetails } from '../utils/accountPreferences';
import { settingsChanges, changedAddressError } from '../utils/settingsChanges';

function snapshot(user) {
 const addresses = Array.isArray(user.savedAddresses)?  user.savedAddresses : user.address ? [{id:'default-address',label:'Home',line:user.address,locality:user.locality||'',city:user.city||'Ghaziabad',isDefault:true}] : [];
 return {name:user.name||'',avatar:user.avatar||'',phone:user.phone||'',email:user.email||'',addresses:addresses.map(addressDraft),notifications:{...user.notificationPreferences},pending:user.pendingContactChanges};
}
export default function Settings() {
 const {tr}=useLanguage();
 const {user,updateProfile}=useAuth(); const {syncCustomerContact,updateShopOwnerDetails}=useShop();
 const customer=user.role==='customer';const owner=user.role==='shop_owner';const {notify,toasts}=useVerificationToasts();const [contactVerified,setContactVerified]=useState({phone:false,email:false}); const photoInput=useRef(null);
 const [editing,setEditing]=useState(false); const [draft,setDraft]=useState(()=>snapshot(user));
 const [notice,setNotice]=useState(null);
 const [baseline,setBaseline]=useState(()=>snapshot(user));
 const changes=settingsChanges(baseline,draft);
 useEffect(()=>{if(!editing)setDraft(snapshot(user));},[user,editing]);
 const change=(key,value)=>{if(key==='name')value=personNameInput(value);setDraft(previous=>({...previous,[key]:value}));if(key==='phone'||key==='email')setContactVerified(previous=>({...previous,[key]:false}));};
 const editAddress=(id,key,value)=>setDraft(previous=>({...previous,addresses:previous.addresses.map(item=>item.id===id?{...item,[key]:value}:item)}));
 const upload=event=>{
  const file=event.target.files?.[0]; if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>500*1024){setNotice({error:true,text:'Choose a JPG, PNG or WebP photo smaller than 500 KB.'});return;}
  const reader=new FileReader();reader.onload=()=>change('avatar',reader.result);reader.onerror=()=>setNotice({error:true,text:'The photo could not be opened.'});reader.readAsDataURL(file);
 };
 const save=event=>{
  event.preventDefault();if(!editing||!changes.any)return;
  const fail=text=>setNotice({error:true,text});
  if(changes.name){const error=validatePersonalDetails(draft);if(error)return fail(error);}
  const contact={changes:{}};
  if(changes.phone){const phone=draft.phone.replace(/\s/g,'');if(!/^[6-9][0-9]{9}$/.test(phone))return fail('Please enter a valid 10-digit mobile number.');contact.changes.phone=phone;}
  if(changes.email){const email=draft.email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail('Please enter a valid email address.');contact.changes.email=email;}
  const contactChanged=Object.keys(contact.changes).length>0;
  if(owner&&((changes.phone&&!contactVerified.phone)||(changes.email&&!contactVerified.email)))return fail('Complete demo contact re-verification before saving.');
  const updates={};
  if(changes.name)updates.name=draft.name.trim();
  if(changes.avatar)updates.avatar=draft.avatar;
  if(customer){Object.assign(updates,contact.changes);updates.pendingContactChanges=null;}
  else if(contactChanged)updates.pendingContactChanges={...contact.changes,requestedAt:new Date().toISOString(),status:'pending',...(owner?{previewVerified:true}:{})};
  else if(changes.pending)updates.pendingContactChanges=draft.pending;
  if(changes.notifications)updates.notificationPreferences=draft.notifications;
  if(customer&&changes.addresses){
   const error=changedAddressError(baseline.addresses,draft.addresses);if(error)return fail(error);
   const addresses=draft.addresses.map(item=>{
    const before=baseline.addresses.find(value=>value.id===item.id);
    const modified=!before||['houseNumber','street','city','state','pincode'].some(key=>(item[key]||'')!==(before[key]||''));
    if(!modified){const original=user.savedAddresses?.find(value=>value.id===item.id);return {...(original||item),isDefault:item.isDefault};}
    const next={...item,...Object.fromEntries(['houseNumber','street','city','state','pincode'].map(key=>[key,(item[key]||'').trim()]))};
    delete next.label;next.locality='';next.line=[next.houseNumber,next.street].filter(Boolean).join(', ');return next;
   });
   if(addresses.length&&!addresses.some(item=>item.isDefault))addresses[0]={...addresses[0],isDefault:true};
   const chosen=addresses.find(item=>item.isDefault);
   Object.assign(updates,{savedAddresses:addresses,address:chosen?addressSummary(chosen):'',locality:chosen?.locality||'',city:chosen?.city||user.city||'Ghaziabad',state:chosen?.state||'',pincode:chosen?.pincode||''});
  }
  const result=updateProfile(updates);if(!result.success)return fail(result.error);
  if(customer&&(changes.name||contactChanged))syncCustomerContact(user.id,{name:user.name,phone:user.phone},{...updates,name:updates.name||user.name,phone:updates.phone||user.phone,email:updates.email||user.email});
  if(owner&&changes.name)updateShopOwnerDetails(user.shopId||user.id,{name:updates.name});
  setEditing(false);setNotice({text:contactChanged&&!customer?'Settings saved. Contact verification is still pending.':'Settings saved.'});
 };
 const content=<div className={'account-page settings-page '+((owner||customer)?'sa-settings ':'')+'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10'}>
  <header className="account-page-heading settings-heading"><div><SettingsIcon size={32}/><h1>{tr('Settings')}</h1></div>{!editing&&<button type="button" className="settings-edit" onClick={()=>{setDraft(customer?{...snapshot(user),phone:user.pendingContactChanges?.phone||user.phone||'',email:user.pendingContactChanges?.email||user.email||''}:snapshot(user));setBaseline(snapshot(user));setContactVerified({phone:false,email:false});setNotice(null);setEditing(true);}}><Pencil size={21}/>{tr('Edit')}</button>}</header>
  {toasts}<form noValidate onSubmit={save}>
   <fieldset disabled={!editing} className="settings-fields">
    <section className="account-panel"><h2><User size={25}/>{tr('Personal information')}</h2><label htmlFor="settings-name">{tr('Full name')}</label><input id="settings-name" required maxLength={100} value={draft.name} onChange={event=>change('name',event.target.value)} autoComplete="name"/>
     <div className="settings-photo"><div className="profile-avatar">{draft.avatar?<img src={draft.avatar} alt={tr('Profile photo')}/>:<User size={32}/>}</div><div><label htmlFor="settings-photo">{tr('Profile photo')}</label>{editing&&<><input ref={photoInput} id="settings-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/><button type="button" onClick={()=>{change('avatar','');if(photoInput.current)photoInput.current.value='';}}>{tr('Remove photo')}</button></>}</div></div>
    </section>
    <section className="account-panel"><h2><Mail size={25}/>{tr('Phone and email')}</h2>{owner&&<p>{tr('Contact changes need verification. Verification delivery is unavailable.')}</p>}<div className="account-form-grid"><label>{tr('Mobile number')}<input type="tel" required={user.role!=='admin'} value={draft.phone} onChange={event=>change('phone',event.target.value)} autoComplete="tel"/></label><label>{tr('Email address')}<input type="email" required value={draft.email} onChange={event=>change('email',event.target.value)} autoComplete="email"/></label></div>{owner&&editing&&<div className="sv-form-grid">{changes.phone&&<ContactVerification kind="phone" value={draft.phone} onVerified={value=>setContactVerified(previous=>({...previous,phone:value}))} notify={notify}/>} {changes.email&&<ContactVerification kind="email" value={draft.email} onVerified={value=>setContactVerified(previous=>({...previous,email:value}))} notify={notify}/>}</div>}{!customer&&draft.pending&&<div className="pending-contact"><strong>{tr('Verification pending')}</strong><p>{draft.pending.phone||''} {draft.pending.email||''}</p>{editing&&<button type="button" onClick={()=>change('pending',null)}>{tr('Cancel request')}</button>}</div>}</section>
    {customer&&<>
     <section className="account-panel settings-addresses"><h2><MapPin size={25}/>{tr('Saved addresses')}</h2><p>{tr('Keep personal pickup and delivery addresses here. Choose one as your default.')}</p>
      <div className="saved-item-list settings-address-grid">{draft.addresses.map((item,index)=><article key={item.id} className={`settings-address-card ${item.isDefault?'is-default':''}`}><div className="settings-address-title"><span className="settings-address-icon"><MapPin size={24}/></span><strong>{tr('Address')} {index+1}</strong>{item.isDefault&&<span className="settings-default"><Check size={17}/>{tr('Default')}</span>}</div>
       {editing?<><div className="account-form-grid">{[['houseNumber','House no.'],['street','Street / Road'],['city','City'],['state','State'],['pincode','PIN code']].map(([key,label])=><label key={key}>{tr(label)}<input required maxLength={key==='pincode'?6:key==='street'?250:80} inputMode={key==='pincode'?'numeric':undefined} pattern={key==='pincode'?'[1-9][0-9]{5}':undefined} value={item[key]||''} onChange={event=>editAddress(item.id,key,event.target.value)} autoComplete={key==='street'?'address-line1':key==='city'?'address-level2':key==='state'?'address-level1':key==='pincode'?'postal-code':'off'}/></label>)}</div><div className="saved-item-actions">{!item.isDefault&&<button type="button" onClick={()=>change('addresses',draft.addresses.map(value=>({...value,isDefault:value.id===item.id})))}>{tr('Set as default')}</button>}<button type="button" aria-label={`${tr('Remove')} ${index+1}`} onClick={()=>change('addresses',draft.addresses.filter(value=>value.id!==item.id))}><Trash2 size={20}/>{tr('Remove')}</button></div></>:<p>{addressSummary(item)}</p>}</article>)}</div>
      {!draft.addresses.length&&<p className="settings-empty">{tr('No saved addresses yet.')}</p>}
      {editing&&<button type="button" onClick={()=>change('addresses',[...draft.addresses,{id:crypto.randomUUID(),houseNumber:'',street:'',city:'Ghaziabad',state:'Uttar Pradesh',pincode:'',isDefault:!draft.addresses.length}])}><Plus size={21}/>{tr('Add address')}</button>}
     </section>
    </>}
     <section className="account-panel"><h2><Bell size={25}/>{tr('Notification preferences')}</h2><p>{tr("Preferences saved on this device. Notification delivery is unavailable.")}</p><div className="notification-options">{[['push','Push notifications'],['email','Email notifications'],['sms','SMS notifications']].map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(draft.notifications[key])} onChange={event=>change('notifications',{...draft.notifications,[key]:event.target.checked})}/>{tr(label)}</label>)}</div></section>
   </fieldset>
   {notice&&<p className="settings-notice" role={notice.error?'alert':'status'}>{tr(notice.text)}</p>}
   {editing&&<div className="account-panel settings-save-bar"><div><button type="button" onClick={()=>{setEditing(false);setNotice(null);}}>{tr('Cancel')}</button><button type="submit" disabled={!changes.any} className="account-primary">{tr('Save changes')}</button></div></div>}
  </form>
 </div>;
 return owner?<SellerAccountLayout>{content}</SellerAccountLayout>:content;
}
