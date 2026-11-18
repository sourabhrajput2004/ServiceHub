import {customerInvoiceMessage} from './customerInvoice.js';
import {repairFlow,workflowEvents,FLOW_LABELS,unpaidAge} from './repairWorkflow.js';
import {jobCardStatus,serviceMode} from './repairService.js';
export const validWhatsapp = value => /^[6-9]\d{9}$/.test(String(value||''))&&!/^(.)\1+$/.test(String(value));
export function workStatus(job){return repairFlow(job).label;}
export function repairTimeline(job){
 const stage=jobCardStatus(job),raw=String(job.status||''),index=stage==='Delivered'||stage==='Ready'?5:stage==='Received'?0:job.workPhase==='Assigned'?1:raw==='Waiting for Parts'?3:raw==='Repaired & QC Tested'?4:2;
 return (job.statusHistory||[]).map((step,i)=>({...step,done:i<=index,timestamp:step.timestamp||(i===index?(job.completedAt||job.startedAt||job.assignedAt||job.createdAt):'')}));
}
export function whatsappContact(job){
 if(job.whatsappNumber)return job.whatsappNumber;
 try{const accounts=Object.values(JSON.parse(localStorage.getItem('servicehub_accounts')||'{}'));return accounts.find(a=>a.role==='customer'&&(a.id===job.customerId||a.phone===job.customerPhone))?.whatsappNumber||'';}catch{return '';}
}
export function deliveryQueue(bookings,invoices){return bookings.filter(j=>!j.archivedAt).flatMap(job=>{const invoice=invoices.find(i=>i.bookingId===job.id&&i.status!=='Cancelled'),flow=repairFlow(job,invoice),recipient=whatsappContact(job),base={jobId:job.id,shopId:job.shopId||'shop_1',recipient},status=validWhatsapp(recipient)?'Awaiting WhatsApp provider':'WhatsApp number required',tracking=(globalThis.location?.origin||'')+'/my-repairs?booking='+encodeURIComponent(job.id),events=workflowEvents(job).filter(e=>e.status!=='override').map((e,i)=>({...base,id:job.id+':event:'+(e.id||i+':'+e.status),kind:FLOW_LABELS[e.status]||e.status,status,text:'Repair '+job.id+': '+(FLOW_LABELS[e.status]||e.status)+(e.technicianName?' ('+e.technicianName+')':'')+(e.at?' | '+new Date(e.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'')+(e.status==='payment_due'&&invoice?' | Total: INR '+invoice.grandTotal:'')+'. Track: '+tracking}));const extra=[];if(flow.stage==='completed'&&!invoice)extra.push({...base,id:job.id+':billing',kind:'Bill required',status:'Counter action required'});if(flow.stage==='completed'&&invoice)extra.push({...base,id:invoice.id+':receipt',kind:'Paid invoice',invoiceId:invoice.id,status,text:customerInvoiceMessage(invoice,{},tracking)});if(unpaidAge(job,invoice)>=7)extra.push({...base,id:job.id+':overdue-7',kind:'Payment reminder',status,text:'Repair '+job.id+': payment pending'+(invoice?' INR '+invoice.dueAmount:'')+'. Please contact the shop. Track: '+tracking});return [...events,...extra];});}
export function homeCollectionAllowed(job,member){return Boolean(job&&!job.archivedAt&&serviceMode(job)==='home'&&jobCardStatus(job)==='Ready'&&member?.status==='ACTIVE'&&member.role==='technician'&&member.id===job.assignedTechId&&member.shopId===(job.shopId||'shop_1'));}
export function upiLink(vpa,name,amount){if(!/^[\w.-]{2,}@[a-zA-Z][\w.-]+$/.test(vpa||'')||!(Number(amount)>0))return '';return 'upi://pay?'+new URLSearchParams({pa:vpa,pn:name||'Repair shop',am:Number(amount).toFixed(2),cu:'INR'}).toString();}
