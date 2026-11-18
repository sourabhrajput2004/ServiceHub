import {validWhatsapp} from './orderFulfilment.js';
export function passwordStatus(password='') {
 const rules=[
  {key:'length',label:'At least 8 characters',met:password.length>=8},
  {key:'lowercase',label:'One lowercase letter (a-z)',met:/[a-z]/.test(password)},
  {key:'uppercase',label:'One uppercase letter (A-Z)',met:/[A-Z]/.test(password)},
  {key:'number',label:'One number (0-9)',met:/[0-9]/.test(password)},
  {key:'special',label:'One special character (e.g. @, #, !)',met:/[^\p{L}\p{N}\s]/u.test(password)}
 ];
 const valid=rules.every(rule=>rule.met)&&password.length<=128&&!/\s/.test(password);
 const strength=valid&&password.length>=12&&new Set(password).size>=8?'Strong':rules.filter(rule=>rule.met).length>=4?'Medium':'Weak';
 return {rules,valid,strength};
}
export function validateCustomerSignup(data) {
 const errors={};
 if(!validWhatsapp(data.whatsappNumber))errors.whatsappNumber='Enter a valid 10-digit WhatsApp number.';const name=data.name.trim(),locality=data.locality.trim();
 if(name.length<2||name.length>100||!/^\p{L}[\p{L}\p{M}\s.'’-]*$/u.test(name)||[...name].filter(char=>/\p{L}/u.test(char)).length<2)errors.name='Please enter a valid full name.';
 if(!/^[6-9][0-9]{9}$/.test(data.phone)||/^(.)\1+$/.test(data.phone))errors.phone='Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.';
 if(data.email.trim().length>254||!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email.trim()))errors.email='Please enter a valid email address.';
 if(locality.length<2||locality.length>250||!/[\p{L}]/u.test(locality)||/[<>]/.test(locality))errors.locality='Enter a valid locality or address, such as Raj Nagar or Sanjay Nagar.';
 if(!passwordStatus(data.password).valid)errors.password='Use 8–128 characters with lowercase, uppercase, a number and a special character. Do not use spaces.';
 if(!data.confirmPassword)errors.confirmPassword='Please confirm your password.';
 else if(data.password!==data.confirmPassword)errors.confirmPassword='Passwords do not match.';
 return errors;
}
