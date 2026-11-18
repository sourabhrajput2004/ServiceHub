export function paymentPhone(value){
 const digits=String(value||'').replace(/\D/g,'');
 const local=digits.length===12&&digits.startsWith('91')?digits.slice(2):digits;
 return /^[6-9]\d{9}$/.test(local)?'91'+local:'';
}
export function paymentShareLinks(job,url,shopName,amount){
 const phone=paymentPhone(job.customerPhone),whatsapp=paymentPhone(job.whatsappNumber)||phone;
 const message=['Hello '+(job.customerName||'Customer')+',',shopName||'ServiceHub','Your repair '+job.id+' is ready.',Number(amount)>0?'Amount due: INR '+Number(amount).toFixed(2):'', 'Pay securely: '+url,'No registration required.'].filter(Boolean).join('\n');
 return {message,phone,whatsapp,whatsappUrl:whatsapp?'https://wa.me/'+whatsapp+'?text='+encodeURIComponent(message):'',smsUrl:phone?'sms:+'+phone+'?body='+encodeURIComponent(message):''};
}
