export function validatePersonalDetails(form) {
 if(!form.name.trim())return 'Please enter your full name.';
 return null;
}
export function validateContactChanges(current,phone,email) {
 const normalPhone=phone.replace(/\s/g,'');const normalEmail=email.trim().toLowerCase();
 if(normalPhone&&!/^\d{10}$/.test(normalPhone))return {error:'Please enter a valid 10-digit mobile number.'};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail))return {error:'Please enter a valid email address.'};
 const changes={};
 if(normalPhone!==(current.phone||''))changes.phone=normalPhone;
 if(normalEmail!==(current.email||'').toLowerCase())changes.email=normalEmail;
 return Object.keys(changes).length?{changes}:{error:'No contact changes to request.'};
}
export function paymentReference(form) {
 const label=form.label.trim();if(!label)return {error:'Enter a name for this payment reference.'};
 if(form.type==='upi') {
  const upiId=form.upiId.trim();
  if(!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9.-]{1,}$/.test(upiId))return {error:'Enter a valid UPI ID.'};
  return {value:{type:'upi',label,upiId}};
 }
 if(!/^\d{4}$/.test(form.last4))return {error:'Enter only the last four card digits.'};
 return {value:{type:'card',label,last4:form.last4}};
}
