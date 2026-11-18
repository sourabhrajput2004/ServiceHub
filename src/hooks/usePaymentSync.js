import {useEffect,useRef} from 'react';
import {paymentApi,applyVerifiedPayment} from '../utils/paymentApi';
import {withWorkflow,workflowStage} from '../utils/repairWorkflow';
export default function usePaymentSync({user,bookings,invoices,setBookings,setInvoices}){
 const current=useRef({bookings,invoices});current.current={bookings,invoices};
 useEffect(()=>{if(!user)return;let active=true,running=false;
  const sync=async()=>{if(running||!active)return;running=true;try{
   const records=[];
   if(user.role==='shop_owner'){try{const result=await paymentApi('/intents');records.push(...result.intents);}catch{}}
   const known=current.current.bookings.filter(j=>j.paymentToken&&!j.archivedAt&&!j.isPaid&&(user.role==='customer'?j.customerId===user.id:(j.shopId||'shop_1')===(user.shopId||user.id)));
   const fetched=await Promise.allSettled(known.slice(0,40).filter(j=>!records.some(r=>r.id===j.paymentIntentId)).map(j=>paymentApi('/guest/'+j.paymentToken).then(record=>({...record,token:j.paymentToken,url:j.paymentUrl}))));
   for(const result of fetched)if(result.status==='fulfilled')records.push(result.value);
   if(!active||!records.length)return;
   const byBooking=new Map(records.map(record=>[record.shopId+':'+record.bookingId,record]));
   setBookings(previous=>{let changed=false;const next=previous.map(job=>{
    const record=byBooking.get((job.shopId||'shop_1')+':'+job.id);if(!record||job.archivedAt)return job;
    let result=job;
    if(!job.paymentToken&&record.token){result={...result,paymentToken:record.token,paymentIntentId:record.id,paymentUrl:record.url,paymentAmountDue:record.amount/100};changed=true;}
    const patch=applyVerifiedPayment(result,record);if(!patch)return result;
    if(!['payment_due','completed'].includes(workflowStage(result))){if(!result.gatewayPaymentReview){changed=true;return {...result,gatewayPaymentReview:true,gatewayPaymentId:record.paymentId};}return result;}
    const bill=current.current.invoices.find(i=>i.bookingId===job.id&&!i.cancelledAt);
    if(bill&&Number(bill.dueAmount)!==record.amount/100){if(!result.gatewayPaymentReview){changed=true;return {...result,gatewayPaymentReview:true};}return result;}
    changed=true;return withWorkflow(result,{...patch,paymentAmount:record.amount/100+Number(bill?.paidAmount||0)},{id:'razorpay',name:'Razorpay verified payment',role:'system'});
   });return changed?next:previous;});
   setInvoices(previous=>{let changed=false;const next=previous.map(bill=>{const record=byBooking.get((bill.shopId||'shop_1')+':'+bill.bookingId);if(!record||record.status!=='paid'||bill.cancelledAt||bill.gatewayPaymentId===record.paymentId||Number(bill.dueAmount)!==record.amount/100)return bill;changed=true;return {...bill,paidAmount:Number(bill.paidAmount||0)+record.amount/100,dueAmount:0,paymentStatus:'Fully Paid',paymentMode:record.method==='cash'?'Cash':'Razorpay',gatewayPaymentId:record.paymentId,lockedAt:bill.lockedAt||new Date(record.paidAt).toISOString(),audit:[...(bill.audit||[]),{at:new Date(record.paidAt).toISOString(),action:'GATEWAY_PAYMENT_VERIFIED',by:'razorpay',amount:record.amount/100,paymentId:record.paymentId}]};});return changed?next:previous;});
  }finally{running=false;}};
  sync();const timer=setInterval(sync,6000),focus=()=>sync();window.addEventListener('focus',focus);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);};
 },[user?.id,user?.role,user?.shopId]);
}
