import {cancelledInvoice} from './invoiceLifecycle.js';
const numeric=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
export function businessDate(value){
 if(value===undefined||value===null||value==='')return '';
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value?value:'';}
 const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function repairStage(status=''){
 const value=status.trim().toLowerCase();
 if(['cancelled','canceled','rejected','unpaid - closed'].includes(value))return 'cancelled';
 if(['completed','delivered','collected','closed','paid'].includes(value))return 'completed';
 if(['ready for pickup','ready for delivery'].includes(value))return 'ready';
 if(['request received','request booked','device received at shop','booked'].includes(value))return 'received';
 return 'progress';
}
export function workshopOverview({bookings=[],inventory=[],technicians=[],invoices=[]},now=new Date()){
 inventory=inventory.filter(p=>!p.archivedAt);invoices=invoices.filter(i=>!cancelledInvoice(i));bookings=bookings.filter(i=>!i.archivedAt);
 const today=businessDate(now),month=today.slice(0,7),pipeline={received:0,progress:0,ready:0,completed:0,cancelled:0};
 bookings.forEach(job=>pipeline[repairStage(job.status)]++);
 const active=bookings.filter(job=>['received','progress'].includes(repairStage(job.status)));
 const lowStock=inventory.filter(item=>numeric(item.stockQty)<=numeric(item.minThreshold)).sort((a,b)=>numeric(a.stockQty)-numeric(b.stockQty));
 const unpaid=invoices.filter(invoice=>numeric(invoice.dueAmount)>0).sort((a,b)=>numeric(b.dueAmount)-numeric(a.dueAmount));
 const recent=[...bookings].sort((a,b)=>(businessDate(b.updatedAt||b.bookingDate)||'').localeCompare(businessDate(a.updatedAt||a.bookingDate)||'')).slice(0,5);
 return {today,month,pipeline,activeRepairs:active.length,ready: pipeline.ready,completed:pipeline.completed,ordersThisMonth:bookings.filter(job=>businessDate(job.bookingDate).startsWith(month)).length,availableTechnicians:technicians.filter(tech=>tech.status?.toLowerCase()==='available').length,totalProducts:inventory.length,lowStock,unpaid,recent,pendingPayments:invoices.filter(invoice=>invoice.paymentStatus==='Pending Approval').length,totalCollected:invoices.filter(invoice=>invoice.paymentStatus!=='Pending Approval').reduce((sum,invoice)=>sum+numeric(invoice.paidAmount),0),totalDue:invoices.reduce((sum,invoice)=>sum+numeric(invoice.dueAmount),0),monthBilled:invoices.filter(invoice=>businessDate(invoice.date).startsWith(month)).reduce((sum,invoice)=>sum+numeric(invoice.grandTotal),0),todayBilled:invoices.filter(invoice=>businessDate(invoice.date)===today).reduce((sum,invoice)=>sum+numeric(invoice.grandTotal),0),team:technicians.map(tech=>({...tech,assignedJobs:active.filter(job=>job.assignedTechId===tech.id).length}))};
}
