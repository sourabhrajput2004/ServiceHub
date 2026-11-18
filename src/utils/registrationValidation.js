export function normalizeEmail(value='') { return value.trim().toLowerCase(); }
export function normalizePhone(value='') {
 const digits=value.replace(/\D/g,'');
 return digits.length===12&&digits.startsWith('91')?digits.slice(2):digits.length===11&&digits.startsWith('0')?digits.slice(1):digits;
}
export function registrationContactErrors(contact, accounts=[]) {
 const email=normalizeEmail(contact.email), phone=normalizePhone(contact.phone);
 const emailExists=Boolean(email)&&accounts.some(account=>account&&normalizeEmail(account.email||'')===email);
 const phoneExists=Boolean(phone)&&accounts.some(account=>account&&normalizePhone(account.phone||'')===phone);
 return {...(emailExists?{email:'This email already exists. Please sign in.'}:{}),...(phoneExists?{phone:'This phone number already exists. Please sign in.'}:{})};
}

export function registrationContactError(contact, accounts=[]) {
 const errors=registrationContactErrors(contact,accounts);
 if(errors.email&&errors.phone)return 'This email and phone number already exist. Please sign in.';
 return errors.email||errors.phone||'';
}
