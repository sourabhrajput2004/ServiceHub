import {validShopCategories} from './shopCategories.js';
import {validShopTypes} from './shopInventoryTypes.js';
export const SELLER_STEPS=['Basic information','Business documents','Registry checks','Face verification','Payout account','Device verification','Completion'];
export const INDIAN_STATES=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
export const BANK_NAMES=['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Punjab National Bank','Bank of Baroda','Canara Bank','Union Bank of India','Kotak Mahindra Bank','Indian Bank','Bank of India','IDFC FIRST Bank','Federal Bank'];
export const DEMO_OTP='123456';export const DEMO_DEPOSIT='0.37';export const NAME_CHANGE_DAYS=30;
export const normalizeId=value=>(value||'').replace(/[^a-z0-9]/gi,'').toUpperCase();
export function formatGSTIN(value){const raw=normalizeId(value).slice(0,15);return [raw.slice(0,2),raw.slice(2,12),raw.slice(12,13),raw.slice(13,14),raw.slice(14)].filter(Boolean).join('-');}
export function maskReference(value=''){return value.length>6?value.slice(0,2)+'•'.repeat(Math.min(8,value.length-6))+value.slice(-4):'••••';}
export function validateSellerBasic(data){
 const errors={};if(!validShopCategories(data.categories))errors.categories='Choose at least one valid shop category.';if(!validShopTypes(data.shopTypes))errors.shopTypes='Choose one or both shop types.';
 if(data.name.trim().length<2||!/^[\p{L}][\p{L}\p{M}\s.'’-]*$/u.test(data.name.trim()))errors.name='Please enter a valid full name.';
 if(!/^[6-9][0-9]{9}$/.test(data.phone)||/^(.)\1+$/.test(data.phone))errors.phone='Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.';
 if(!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email.trim()))errors.email='Please enter a valid email address.';
 if(data.shopName.trim().length<2||!/[\p{L}]/u.test(data.shopName)||/[<>]/.test(data.shopName))errors.shopName='Enter a valid shop name between 2 and 120 characters.';
 if(data.address.trim().length<8||!/[\p{L}]/u.test(data.address)||/[<>]/.test(data.address))errors.address='Enter the complete shop address, including shop number and street or market.';
 if(data.city.trim().length<2||!/[\p{L}]/u.test(data.city))errors.city='Enter a valid city.';
 if(!INDIAN_STATES.includes(data.state))errors.state='Choose your state or union territory.';
 if(!/^[1-9][0-9]{5}$/.test(data.pincode))errors.pincode='Enter a valid 6-digit PIN code.';
 return errors;
}
export function validateSellerDocuments(data){
 const errors={},gst=normalizeId(data.gstin),pan=normalizeId(data.pan),udyam=data.udyam.trim().toUpperCase();
 if(!/^(0[1-9]|[12][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst))errors.gstin='Enter a valid 15-character GSTIN starting with a state code.';
 if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))errors.pan='Enter PAN as five letters, four digits and one letter.';
 if(!/^(?:[A-Z0-9]{13}|UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})$/.test(udyam))errors.udyam='Enter a 13-character demo reference or your UDYAM-XX-00-0000000 number.';
 if(data.validUntil&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.validUntil)||data.validUntil<new Date().toISOString().slice(0,10)))errors.validUntil='Enter a current or future license expiry date.';
 if(!data.license)errors.license='Upload the Shop & Establishment license.';
 return errors;
}
export function validateUpload(file,{video=false,imageOnly=false}={}){
 const types=video?['video/mp4','video/webm']:imageOnly?['image/jpeg','image/png']:['application/pdf','image/jpeg','image/png'];
 if(!types.includes(file.type))return video?'Choose an MP4 or WebM video.':imageOnly?'Choose a JPG or PNG image.':'Choose a PDF, JPG or PNG file.';
 if(file.size>(video?25:5)*1024*1024)return video?'Video must be smaller than 25 MB.':'File must be smaller than 5 MB.';
 if(!file.size)return 'The selected file is empty.';
 return null;
}
export function validatePayout(data){
 const errors={};
 if(data.holder.trim().length<2||!/^[\p{L}][\p{L}\p{M}\s.'’-]*$/u.test(data.holder.trim()))errors.holder='Enter the account holder name.';
 if(data.bank.trim().length<2||!/[\p{L}]/u.test(data.bank))errors.bank='Enter a valid bank name.';
 if(!/^[0-9]{11,18}$/.test(data.number)||/^(.)\1+$/.test(data.number))errors.number='Enter an account number with 11–18 digits.';
 if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc.toUpperCase()))errors.ifsc='Enter an 11-character IFSC: four letters, zero and six letters or numbers.';
 return errors;
}
export function payoutSummary(data){return {holder:data.holder.trim(),bank:data.bank.trim(),last4:data.number.slice(-4),ifsc:data.ifsc.toUpperCase(),verificationStatus:'pending',previewVerified:true,updatedAt:new Date().toISOString()};}
export function previewRegistry(scenario,name){
 return [{key:'gst',name:'GSTIN Status',status:scenario==='rejected'?'failed':'passed',label:scenario==='rejected'?'Inactive':'Active',detail:scenario==='rejected'?'Demo: GSTIN is inactive.':'Demo: GSTIN status is active.'},{key:'pan',name:'PAN Match',status:'passed',label:'Matched',detail:'Demo legal name: '+name.toUpperCase()},{key:'udyam',name:'Udyam Cross-check',status:scenario==='pending'?'flagged':'passed',label:scenario==='pending'?'Minor mismatch':'Matched',detail:scenario==='pending'?'Demo: address needs a manual review.':'Demo: registration details match.'},{key:'aadhaar',name:'Aadhaar Name Match',status:scenario==='pending'?'flagged':'passed',label:scenario==='pending'?'Flagged':'Matched',detail:'Demo only; no Aadhaar data was queried.'}];
}
export function sellerStatus(shop){if(shop?.businessProofValidUntil&&shop.businessProofValidUntil<new Date().toISOString().slice(0,10))return 'EXPIRED';return shop?.verificationStatus==='approved'?'VERIFIED':shop?.verificationStatus==='rejected'?'REJECTED':'PENDING_REVIEW';}
export function nameChangeAllowedAt(shop){if(!shop?.shopNameChangedAt)return null;const time=Date.parse(shop.shopNameChangedAt);if(!Number.isFinite(time))return null;const next=new Date(time+NAME_CHANGE_DAYS*86400000);return next>new Date()?next:null;}
export function verificationEvent(check,status,detail='',demo=true){return {id:crypto.randomUUID(),check,status,detail,demo,at:new Date().toISOString()};}
