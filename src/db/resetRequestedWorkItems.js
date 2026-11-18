import {returnBatches} from '../utils/inventoryBatches';

// One-time reset explicitly requested for this local test job.
export function resetRequestedWorkItems(storage){
 const key='servicehub_reset_work_items_BK-AC486959_20261113_v1';
 if(storage.getItem(key))return;
 try{
  const originalOrders=storage.getItem('servicehub_bookings'),originalStock=storage.getItem('servicehub_inventory');
  const rows=JSON.parse(originalOrders||'[]'),job=rows.find(j=>j.id==='BK-AC486959');if(!job)return;
  const bills=JSON.parse(storage.getItem('servicehub_invoices')||'[]');
  if(job.isPaid||job.paymentIntentId||bills.some(i=>i.bookingId===job.id&&!i.cancelledAt&&i.status!=='Cancelled'))return;
  let inventory=JSON.parse(originalStock||'[]');const at=new Date().toISOString();
  for(const r of job.partRequests||[]){
   if(!['Approved','Issued'].includes(r.status))continue;
   if(Number(r.billedQty)>0)return;
   const part=inventory.find(p=>p.id===r.inventoryItemId&&(p.shopId||'shop_1')===(job.shopId||'shop_1'));if(!part)return;
   const qty=Number(r.quantity);if(!Number.isSafeInteger(qty)||qty<1)return;
   const returned=returnBatches(part,r.batchAllocations||[],qty);
   inventory=inventory.map(p=>p.id===part.id?{...returned,history:[...(p.history||[]),{id:crypto.randomUUID(),type:'REPAIR_RESET_RETURN',qty,at,by:'Requested local reset',orderId:job.id,requestId:r.id,balance:returned.stockQty,reason:'User requested resetting added repair services and parts.'}]}:p);
  }
  const next={...job,performedServices:[],partRequests:[],chargeSnapshot:null,paymentAmountDue:null,autoPaymentLinkError:null,updatedAt:at,orderAudit:[...(job.orderAudit||[]),{id:crypto.randomUUID(),action:'REQUESTED_WORK_ITEMS_RESET',at,actorName:'Requested local reset'}]};
  storage.setItem(key+'_backup',JSON.stringify({job,inventory:JSON.parse(originalStock||'[]')}));
  try{
   storage.setItem('servicehub_inventory',JSON.stringify(inventory));
   storage.setItem('servicehub_bookings',JSON.stringify(rows.map(j=>j.id===job.id?next:j)));
   storage.setItem(key,'done');
  }catch{
   if(originalStock!==null)storage.setItem('servicehub_inventory',originalStock);
   if(originalOrders!==null)storage.setItem('servicehub_bookings',originalOrders);
  }
 }catch{/* Keep existing records if storage is unavailable. */}
}
