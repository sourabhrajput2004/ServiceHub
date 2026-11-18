import {workflowStage,workflowEvents} from './repairWorkflow';

export function bookingGroup(job,invoice){
 const stage=workflowStage(job,invoice);
 return stage==='cancelled'?'cancelled':stage==='completed'?'completed':stage==='unpaid_closed'?'closed':'active';
}
export function canCustomerCancel(job,user,invoice){
 return Boolean(job&&user?.role==='customer'&&job.customerId===user.id&&!job.archivedAt&&workflowStage(job,invoice)==='booked'&&!job.assignedTechId&&!job.assignedTechName&&!job.assignedAt&&!job.isPaid&&!invoice&&!workflowEvents(job).some(e=>e.status==='assigned'||e.stage==='assigned'));
}
export const bookingIssues=[
 ['cancellation','Cancellation appeal','बुकिंग कैंसल करने की अपील'],
 ['delay','Repair delay','रिपेयर में देरी'],
 ['quality','Repair / service issue','रिपेयर या सर्विस में परेशानी'],
 ['payment','Payment / billing','पेमेंट या बिल'],
 ['delivery','Visit / pickup / delivery','विज़िट, पिकअप या डिलीवरी'],
 ['other','Other','कुछ और']
];
