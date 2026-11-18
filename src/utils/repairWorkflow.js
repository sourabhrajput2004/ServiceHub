import {serviceMode,jobCardStatus} from './repairService.js';
export const FLOW_LABELS={booked:'Booked',assigned:'Technician Assigned',on_way:'On The Way',repairing:'Repairing',ready:'Ready',payment_due:'Payment Due',completed:'Completed',cancelled:'Cancelled',unpaid_closed:'Unpaid - Closed'};
export function workflowStage(job,invoice){
 if(job.status==='Unpaid - Closed')return 'unpaid_closed';
 if(['Cancelled','CANCELLED','Rejected','REJECTED'].includes(job.status))return 'cancelled';
 const ready=['Ready','Delivered'].includes(jobCardStatus(job))||job.workPhase==='Done';
 if(ready)return job.isPaid||invoice&&Number(invoice.dueAmount)===0?'completed':'payment_due';
 if(job.status==='EN_ROUTE'||job.workPhase==='On The Way')return 'on_way';
 if(job.startedAt||['Started','In Progress'].includes(job.workPhase))return 'repairing';
 if(job.assignedTechId)return 'assigned';return 'booked';
}
const recorded=value=>value&&/T|\d:\d/.test(value)&&Number.isFinite(Date.parse(value))?value:null;
export function workflowEvents(job){
 if(job.workflowEvents?.length)return job.workflowEvents;
 const initial=[{status:'booked',at:recorded(job.createdAt||job.bookingDate),by:job.createdBy||null,byName:job.createdByName||'Not recorded'}];
 if(job.assignedTechId)initial.push({status:'assigned',at:recorded(job.assignedAt),byName:'Not recorded',technicianName:job.assignedTechName});
 if(job.onWayAt)initial.push({status:'on_way',at:recorded(job.onWayAt),byName:job.assignedTechName||'Not recorded'});
 if(job.startedAt)initial.push({status:'repairing',at:recorded(job.startedAt),byName:job.assignedTechName||'Not recorded'});
 if(job.completedAt)initial.push({status:'ready',at:recorded(job.completedAt),byName:job.assignedTechName||'Not recorded'},{status:'payment_due',at:recorded(job.completedAt),byName:'System',by:'system'});
 if(job.paymentCompletedAt)initial.push({status:'completed',at:recorded(job.paymentCompletedAt),by:'system',byName:'System'});
 return initial;
}
export function withWorkflow(job,patch,user,{overrideReason}={}){
 const now=new Date().toISOString(),before=workflowStage(job),afterJob={...job,...patch},after=workflowStage(afterJob),events=[...workflowEvents(job)],entry=status=>({id:crypto.randomUUID(),status,at:now,by:user?.id||'system',byName:user?.name||'System',technicianName:afterJob.assignedTechName||null});
 if(overrideReason)events.push({...entry('override'),reason:overrideReason,target:after});
 if(after!==before||overrideReason||patch.workPhase==='Assigned'&&patch.assignedTechId!==job.assignedTechId){
  if(after==='payment_due'||after==='completed'){
   if(!['payment_due','completed'].includes(before)||overrideReason)events.push({...entry('ready')},{...entry('payment_due'),by:'system',byName:'System'});
   if(after==='payment_due'&&before==='completed')events.push({...entry('payment_due'),by:'system',byName:'System'});
   if(after==='completed')events.push({...entry('completed'),by:'system',byName:'System',recordedBy:user?.name||'System'});
  }else events.push(entry(after));
 }
 return {...afterJob,workflowEvents:events,updatedAt:now,...(after==='cancelled'?{cancelledAt:afterJob.cancelledAt||now}:{}),...(after==='unpaid_closed'?{unpaidClosedAt:afterJob.unpaidClosedAt||now}:{}),...(after==='completed'?{status:'Delivered',workPhase:'Done',completedAt:afterJob.completedAt||now,jobDoneAt:job.jobDoneAt||now,paymentCompletedAt:job.paymentCompletedAt||now}:{})};
}
export function repairFlow(job,invoice){
 const keys=['booked','assigned',...(serviceMode(job)==='home'?['on_way']:[]),'repairing','ready','payment_due','completed'],stage=workflowStage(job,invoice),events=workflowEvents(job),override=[...events].reverse().find(e=>e.status==='override'),afterOverride=override?events.slice(events.lastIndexOf(override)+1):events,rank=keys.indexOf(stage),terminal=['cancelled','unpaid_closed'].includes(stage);
 const steps=keys.map((key,index)=>{const event=[...events].reverse().find(e=>e.status===key);return {key,label:FLOW_LABELS[key],at:event?.at||null,byName:event?.byName||null,technicianName:event?.technicianName||null,done:!terminal&&(stage==='completed'||index<rank),current:!terminal&&index===rank&&stage!=='completed'};});
 return {stage,label:FLOW_LABELS[stage],steps,events,progress:stage==='completed'?100:terminal?0:Math.round(Math.max(0,rank)/keys.length*100),ready:['payment_due','completed'].includes(stage),terminal};
}
export function unpaidAge(job,invoice,now=new Date()){if(serviceMode(job)!=='shop'||workflowStage(job,invoice)!=='payment_due')return 0;const due=[...workflowEvents(job)].reverse().find(e=>e.status==='payment_due')?.at||job.completedAt;return due&&recorded(due)?Math.max(0,Math.floor((now-new Date(due))/86400000)):0;}
