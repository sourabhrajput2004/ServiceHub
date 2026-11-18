import {workflowStage} from './repairWorkflow.js';
export const ORDER_STAGES=[['All','All orders','सभी ऑर्डर'],['Booked','Booked orders','बुक हुए ऑर्डर'],['Assigned','Assigned orders','सौंपे गए ऑर्डर'],['Repairing','Repairing orders','रिपेयर चल रही है'],['Ready','Ready orders','तैयार ऑर्डर'],['Completed','Paid / Completed','पेमेंट हुई / पूरे हुए']];
export function orderStageMatches(job,filter){
 const stage=workflowStage(job);
 return filter==='All'||({Booked:['booked'],Assigned:['assigned','on_way'],Repairing:['repairing'],Ready:['ready','payment_due'],Completed:['completed']}[filter]||[]).includes(stage);
}
