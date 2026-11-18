import {SHOP_TYPES,shopTypes} from '../utils/shopInventoryTypes';
import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Pencil} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {useShop} from '../context/ShopContext';
import {useLanguage} from '../context/LanguageContext';
import {SellerAccountLayout,useVerificationToasts} from '../components/seller/VerificationUI';
import {nameChangeAllowedAt} from '../utils/sellerVerification';
import {SHOP_CATEGORIES} from '../utils/shopSignupValidation';
import DocumentProof from '../components/common/DocumentProof';
const details=shop=>({shopName:shop?.shopName||'',locality:shop?.locality||'',address:shop?.address||''});
const categoryKey=values=>JSON.stringify([...new Set(values)].sort());
export default function MyShop(){
 const {user}=useAuth(),{shops,updateShopPublicDetails,updateShopCategories}=useShop(),{tr,language}=useLanguage(),{notify,toasts}=useVerificationToasts();
 const shop=shops.find(item=>item.id===(user.shopId||user.id));
 const [form,setForm]=useState(details(shop)),[categories,setCategories]=useState(shop?.categories||[]),[baseline,setBaseline]=useState({form:details(shop),categories:shop?.categories||[]}),[editing,setEditing]=useState(false),[errors,setErrors]=useState({}),[attempt,setAttempt]=useState(0);
 const reset=()=>{const next=details(shop),nextCategories=[...(shop?.categories||[])];setForm(next);setCategories(nextCategories);setBaseline({form:next,categories:nextCategories});setErrors({});setAttempt(0);};
 useEffect(()=>{if(!editing)reset();},[shop,editing]);
 const detailsChanged=Object.keys(baseline.form).some(key=>form[key]!==baseline.form[key]),categoriesChanged=categoryKey(categories)!==categoryKey(baseline.categories),dirty=detailsChanged||categoriesChanged;
 const allowedAt=nameChangeAllowedAt(shop);
 const beginEdit=()=>{reset();setEditing(true);};
 const cancel=()=>{reset();setEditing(false);};
 const save=event=>{event.preventDefault();if(!editing||!dirty||!shop)return;const invalid={};
 if(detailsChanged){if(form.shopName.trim().length<2||!/[\p{L}]/u.test(form.shopName)||/[<>]/.test(form.shopName))invalid.shopName='Enter a valid shop name between 2 and 120 characters.';if(form.locality.trim().length<2)invalid.locality='Enter a valid locality or address, such as Raj Nagar or Sanjay Nagar.';if(form.address.trim().length<8)invalid.address='Enter the complete shop address, including shop number and street or market.';}
 setErrors(invalid);setAttempt(value=>value+1);if(Object.keys(invalid).length)return;
 const result=detailsChanged?updateShopPublicDetails(shop.id,{...form,phone:shop.phone,email:shop.email}):{success:true};
 if(result.success){if(categoriesChanged)updateShopCategories(shop.id,categories);setEditing(false);setErrors({});notify('Shop details saved.');}else notify(result.error,'error',5000);
 };
 return <SellerAccountLayout title="My Shop">{toasts}{!shop?<><p>{tr('No shop is linked to this account.')}</p><Link className="sv-button" to="/register-shop">{tr('Register your shop')}</Link></>:<><form noValidate className="sv-account-card myshop-profile" onSubmit={save}><header className="myshop-profile-header"><h2>{tr('Public shop profile')}</h2>{!editing&&<button type="button" className="sv-button sv-button-secondary" onClick={beginEdit}><Pencil size={18}/>{tr('Edit')}</button>}</header><p>{tr('Manage the shop details customers see in the directory.')}</p><div className={'sv-form-grid '+(Object.keys(errors).length?(attempt%2?'sv-shake':'sv-shake-alt'):'')}>{[['shopName','Shop name'],['locality','Locality'],['address','Address']].map(([key,label])=><div className="sv-field" key={key}><label htmlFor={'myshop-'+key}>{tr(label)}</label><input id={'myshop-'+key} maxLength={key==='address'?300:120} disabled={!editing||(key==='shopName'&&Boolean(allowedAt))} value={form[key]||''} onChange={event=>{if(!editing)return;setForm(previous=>({...previous,[key]:event.target.value}));setErrors(previous=>({...previous,[key]:null}));}} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?'myshop-error-'+key:undefined}/>{errors[key]&&<p id={'myshop-error-'+key} className="sv-error" aria-live="polite">{tr(errors[key])}</p>}</div>)}</div>{allowedAt&&<p className="sv-banner sv-banner-warning">{tr('You can change your shop name again on')} {allowedAt.toLocaleDateString()}.</p>}<p className="sv-muted">{tr('Shop name changes have a 30-day cooldown and return the shop to review.')}</p><fieldset className="sv-category-fieldset" disabled={!editing}><legend>{tr('Repair categories')}</legend><div className="sv-category-choices">{SHOP_CATEGORIES.map(category=><label key={category}><input type="checkbox" disabled={!editing} checked={categories.includes(category)} onChange={event=>{if(!editing)return;setCategories(previous=>event.target.checked?[...previous,category]:previous.filter(item=>item!==category));}}/>{tr(category)}</label>)}</div></fieldset>{editing&&<div className="myshop-profile-actions"><button className="sv-button" type="submit" disabled={!dirty}>{tr('Save changes')}</button><button className="sv-button sv-button-secondary" type="button" onClick={cancel}>{tr('Cancel')}</button></div>}</form><section className="sv-account-card"><h2>{tr('Shop type')}</h2><p>{shopTypes(shop).map(id=>language==='hi'?(SHOP_TYPES.find(t=>t.id===id)?.hi||id):(SHOP_TYPES.find(t=>t.id===id)?.label||id)).join(' · ')||tr('Not recorded')}</p><p>{tr('Shop type is fixed after registration. Request changes through support.')}</p><Link className="sv-button sv-button-secondary" to="/support">{tr('Contact Support')}</Link></section><section className="sv-account-card"><h2>{tr('Contact details')}</h2><p>{shop.phone} · {shop.email}</p>{shop.gstin&&<p>GSTIN: {shop.gstin}</p>}<Link className="sv-button sv-button-secondary" to="/settings">{tr('Change contact details in Settings')}</Link></section><section className="sv-account-card"><DocumentProof shop={shop}/></section></>}</SellerAccountLayout>;
}
