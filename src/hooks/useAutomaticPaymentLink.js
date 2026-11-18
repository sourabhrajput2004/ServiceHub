import {useEffect,useRef} from 'react';
import {paymentApi} from '../utils/paymentApi';
import {repairCharges} from '../utils/repairCharges';
import {workflowStage} from '../utils/repairWorkflow';
export default function useAutomaticPaymentLink({user,bookings,shops,inventory,setBookings}){
 const running=useRef(new Set()),attempted=useRef(new Set());
 useEffect(()=>{
  if(!['shop_owner','technician'].includes(user?.role))return;
  for(const job of bookings){
   if(job.archivedAt||job.isPaid||job.paymentIntentId||workflowStage(job)!=='payment_due'||(job.shopId||'shop_1')!==(user.shopId||user.id))continue;
   if(user.role==='technician'&&job.assignedTechId!==user.id)continue;
   const charge=repairCharges(job,shops.find(s=>s.id===(job.shopId||'shop_1')),inventory);if(charge.error)continue;
   const key=job.id+':'+JSON.stringify(charge);if(running.current.has(job.id)||attempted.current.has(key))continue;
   attempted.current.add(key);running.current.add(job.id);
   (async()=>{try{
    const config=await paymentApi('/config');
    if(config.localOperatorLogin){
     const auth=await paymentApi('/operator/login',{password:''});
     if(auth.shopId!==(job.shopId||'shop_1'))throw Error('The payment server is configured for another shop.');
    }
    const record=await paymentApi('/intents',{bookingId:job.id,amount:String(charge.total),title:[job.deviceBrand,job.issueType].filter(Boolean).join(' - '),shopName:job.shopName||shops.find(s=>s.id===job.shopId)?.shopName});
    setBookings(rows=>rows.map(j=>j.id===job.id&&!j.paymentIntentId?{...j,chargeSnapshot:charge,paymentToken:record.token,paymentIntentId:record.id,paymentUrl:record.url,paymentAmountDue:record.amount/100,autoPaymentLinkError:null}:j));
   }catch(err){setBookings(rows=>rows.map(j=>j.id===job.id&&!j.paymentIntentId?{...j,autoPaymentLinkError:err.message}:j));}finally{running.current.delete(job.id);}})();
  }
 },[user?.id,user?.role,user?.shopId,bookings,shops,inventory,setBookings]);
}
