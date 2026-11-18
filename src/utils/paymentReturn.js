export function paymentReturnPath(value){
 if(typeof value!=='string'||value.length>2048||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/customer-dashboard';
 try{const url=new URL(value,'https://servicehub.local');if(url.origin!=='https://servicehub.local'||!['/customer-dashboard','/my-repairs','/find-shop','/profile','/settings','/support'].includes(url.pathname))return '/customer-dashboard';return url.pathname+url.search+url.hash;}catch{return '/customer-dashboard';}
}
export function customerPaymentUrl(paymentUrl,from){
 try{const url=new URL(paymentUrl,globalThis.location?.origin||'http://localhost:3000');url.searchParams.set('returnTo',paymentReturnPath(from));return url.href;}catch{return paymentUrl;}
}
