import { validateCustomerSignup } from './signupValidation.js';
export const SHOP_CATEGORIES=['Mobile Phones','Laptops & Computers','Tablets','Home Appliances','TV & Audio','Smartwatches'];
export const BUSINESS_DOCUMENTS=[
 {id:'Udyam Registration (MSME)',label:'Udyam MSME Certificate',sub:'Standard MSME Certificate for shops'},
 {id:'Shop & Establishment Act License',label:'Shop & Est. License (Trade)',sub:'Local Municipal / Trade license'},
 {id:'GSTIN Certificate',label:'GSTIN Registration',sub:'For GST registered entities'},
 {id:'Commercial Utility Bill / Rent Deed',label:'Commercial Bill / Rent Deed',sub:'Commercial meter bill in shop name'}
];
function isDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function validateShopSignup(data,today=new Date().toISOString().slice(0,10)) {
 const base=validateCustomerSignup({...data,name:data.ownerName});
 const {name,...errors}=base;if(name)errors.ownerName=name;
 if(data.shopName.trim().length<2||data.shopName.trim().length>120||!/[\p{L}]/u.test(data.shopName)||/[<>]/.test(data.shopName))errors.shopName='Enter a valid shop name between 2 and 120 characters.';
 if(data.address.trim().length<8||data.address.trim().length>500||!/[\p{L}]/u.test(data.address)||/[<>]/.test(data.address))errors.address='Enter the complete shop address, including shop number and street or market.';
 if(!data.coordinates||!Number.isFinite(data.coordinates.lat)||!Number.isFinite(data.coordinates.lng)||Math.abs(data.coordinates.lat)>90||Math.abs(data.coordinates.lng)>180)errors.coordinates='Detect your shop location before submitting.';
 if(!BUSINESS_DOCUMENTS.some(item=>item.id===data.businessProofType))errors.businessProofType='Select a business document.';
 if(!/^[\p{L}\p{N}][\p{L}\p{N} /().&-]{4,79}$/u.test(data.businessProofNumber.trim()))errors.businessProofNumber='Enter a document number with 5–80 letters, numbers or standard separators.';
 if(data.businessProofType==='GSTIN Certificate'&&!/^[0-9A-Z]{15}$/.test(data.businessProofNumber.trim().toUpperCase()))errors.businessProofNumber='Enter a 15-character GSTIN using letters and numbers.';
 if(data.gstin.trim()&&!/^[0-9A-Z]{15}$/.test(data.gstin.trim().toUpperCase()))errors.gstin='Enter a 15-character GSTIN using letters and numbers.';
 for(const [key,max] of [['businessProofAuthority',150],['businessProofState',80]])if(data[key]&&(data[key].trim().length<2||data[key].length>max||!/[\p{L}]/u.test(data[key])||/[<>]/.test(data[key])))errors[key]='Enter valid document details or leave this optional field blank.';
 if(data.businessProofIssuedOn&&(!isDate(data.businessProofIssuedOn)||data.businessProofIssuedOn>today))errors.businessProofIssuedOn='Issue date must be a valid date on or before today.';
 if(data.businessProofValidUntil&&(!isDate(data.businessProofValidUntil)||data.businessProofValidUntil<today||(data.businessProofIssuedOn&&data.businessProofValidUntil<data.businessProofIssuedOn)))errors.businessProofValidUntil='Validity date must not be earlier than today or the issue date.';
 if(!/^data:image\/(jpeg|png|webp);base64,/i.test(data.liveKycImage||''))errors.liveKycImage='Take a verification photo before submitting.';
 if(!Array.isArray(data.categories)||!data.categories.length||data.categories.some(item=>!SHOP_CATEGORIES.includes(item)))errors.categories='Choose at least one repair category.';
 return errors;
}
