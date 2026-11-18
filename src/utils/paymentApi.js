export async function paymentApi(path,body){
 let response;try{response=await fetch('/api/payments'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});}catch{throw Error('Payment backend is unavailable. Start npm run payments:server.');}
 let data;try{data=await response.json();}catch{throw Error('Payment backend is unavailable. Start npm run payments:server.');}
 if(!response.ok){const error=Error(data.error||'Payment request failed.');error.status=response.status;throw error;}return data;
}
let checkoutScript;
export async function openRazorpayCheckout(token,{onSuccess,onPending,onError,onClose}={}){
 if(!window.Razorpay){if(!checkoutScript)checkoutScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=resolve;script.onerror=()=>{checkoutScript=null;script.remove();reject(Error('Razorpay checkout could not load. Please retry.'));};document.head.appendChild(script);});await checkoutScript;}
 const order=await paymentApi('/guest/'+token+'/checkout',{});
 const checkout=new window.Razorpay({key:order.keyId,order_id:order.orderId,amount:order.amount,currency:order.currency,name:order.shopName,description:order.title,
  handler:async payload=>{try{const result=await paymentApi('/guest/'+token+'/verify',payload);if(result.status==='paid')onSuccess?.(result);else onPending?.(result);}catch(error){onError?.(error);}},
  modal:{ondismiss:()=>onClose?.()}
 });checkout.on('payment.failed',()=>onError?.(Error('Payment was unsuccessful. No completion has been recorded. You can retry.')));checkout.open();return order;
}
export function applyVerifiedPayment(job,record){
 if(record.status!=='paid'||record.bookingId!==job.id||record.shopId!==(job.shopId||'shop_1')||!record.paymentId||!Number.isSafeInteger(record.amount)||record.amount<=0)return null;
 if(job.isPaid)return null;
 return {isPaid:true,status:'Delivered',paymentAmount:record.amount/100,paymentMethod:record.method==='cash'?'Cash':'Razorpay',paymentRecordedBy:record.method==='cash'?record.collectorId:'razorpay',paymentRecordedByName:record.method==='cash'?record.collectorName:'Razorpay verified payment',...(record.method==='cash'?{cashCollectedBy:record.collectorName,cashCollectedByRole:record.collectorRole,paymentRecordedByRole:record.collectorRole}:{}),paymentRecordedAt:new Date(record.paidAt).toISOString(),gatewayPaymentId:record.paymentId,paymentIntentId:record.id,paymentVerification:record.method==='cash'?'cash_recorded':'captured',paymentMode:'test'};
}
