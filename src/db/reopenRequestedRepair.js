import {withWorkflow} from '../utils/repairWorkflow';
export function resetRequestedScreenRepair(storage){
 const marker='servicehub_reset_screen_repair_BK-AC486959_20261113_v1';
 if(storage.getItem(marker))return;
 try{
  const rows=JSON.parse(storage.getItem('servicehub_bookings')||'[]'),job=rows.find(j=>j.id==='BK-AC486959');if(!job)return;
  const bills=JSON.parse(storage.getItem('servicehub_invoices')||'[]');
  if(job.isPaid||job.paymentIntentId||bills.some(i=>i.bookingId===job.id&&!i.cancelledAt&&i.status!=='Cancelled'))return;
  const services=job.performedServices||[],remaining=services.filter(s=>String(s.name||'').trim().toLowerCase()!=='screen repair');
  storage.setItem(marker+'_backup',JSON.stringify(job));
  const next={...job,performedServices:remaining,chargeSnapshot:null,paymentAmountDue:null,autoPaymentLinkError:null,updatedAt:new Date().toISOString(),orderAudit:[...(job.orderAudit||[]),{id:crypto.randomUUID(),action:'REQUESTED_SCREEN_REPAIR_RESET',at:new Date().toISOString(),actorName:'Requested local reset',removedCount:services.length-remaining.length}]};
  storage.setItem('servicehub_bookings',JSON.stringify(rows.map(j=>j.id===job.id?next:j)));
  storage.setItem(marker,'done');
 }catch{/* Leave the saved job unchanged if storage cannot be updated. */}
}
// Explicitly requested local repair reset. Keep a backup and run once per browser.
export function reopenRequestedRepair(storage){
 const marker='servicehub_reopen_BK-AC486959_20261113';
 if(storage.getItem(marker))return;
 try{
  const rows=JSON.parse(storage.getItem('servicehub_bookings')||'[]'),bills=JSON.parse(storage.getItem('servicehub_invoices')||'[]');
  const job=rows.find(j=>j.id==='BK-AC486959');if(!job)return;
  if(job.isPaid||job.paymentIntentId||!job.assignedTechId||bills.some(i=>i.bookingId===job.id&&!i.cancelledAt&&i.status!=='Cancelled')){storage.setItem(marker,'blocked: linked bill/payment or technician missing');return;}
  storage.setItem(marker+'_backup',JSON.stringify(job));
  const next=withWorkflow(job,{status:'Diagnosing Issue',workPhase:'Assigned',startedAt:null,onWayAt:null,completedAt:null,chargeSnapshot:null,autoPaymentLinkError:null},{id:'system',name:'Requested repair reset'},{overrideReason:'Shop owner requested reopening this job at Technician Assigned to record services and parts.'});
  storage.setItem('servicehub_bookings',JSON.stringify(rows.map(j=>j.id===job.id?next:j)));
  storage.setItem(marker,'done');
 }catch{/* Preserve existing records if browser storage is unavailable. */}
}
