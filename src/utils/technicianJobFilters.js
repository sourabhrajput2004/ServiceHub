import {workflowStage} from './repairWorkflow.js';
import {businessDate} from './workshopOverview.js';
export const technicianJobStatus=job=>workflowStage(job)==='completed'?'Completed':['cancelled','unpaid_closed'].includes(workflowStage(job))?'Cancelled':'Assigned';
export function jobRecordTime(job){
 const status=technicianJobStatus(job),events=job.workflowEvents||[];
 return (status==='Completed'?job.paymentCompletedAt||job.paymentRecordedAt||job.jobDoneAt||job.completedAt:status==='Cancelled'?job.cancelledAt||job.unpaidClosedAt||[...events].reverse().find(e=>['cancelled','unpaid_closed'].includes(e.status))?.at:job.assignedAt)||job.createdAt||job.bookingDate||job.updatedAt||'';
}
export function recordDateTime(value,language='en'){
 if(!value||!Number.isFinite(Date.parse(value)))return language==='hi'?'समय दर्ज नहीं है':'Time not recorded';
 const date=new Date(value),dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(value);
 return date.toLocaleString(language==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',...(!dateOnly?{hour:'2-digit',minute:'2-digit',second:'2-digit'}:{})})+(dateOnly?' · Time not recorded':'');
}
const utcDay=s=>new Date(s+'T00:00:00Z'),dateKey=d=>d.toISOString().slice(0,10);
export function isoWeek(day){
 const d=utcDay(day);if(!Number.isFinite(d.getTime()))return '';
 d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const year=d.getUTCFullYear(),start=new Date(Date.UTC(year,0,1));
 return year+'-W'+String(Math.ceil(((d-start)/86400000+1)/7)).padStart(2,'0');
}
export function technicianPeriod({period='Today',date=businessDate(new Date()),week=isoWeek(date),month=date.slice(0,7),year=date.slice(0,4)},today=businessDate(new Date())){
 if(period==='All time')return {from:'',to:'',label:'All time'};
 if(period==='Weekly'){
  if(!/^\d{4}-W\d{2}$/.test(week))return {invalid:true};const [y,w]=week.split('-W').map(Number),jan4=new Date(Date.UTC(y,0,4)),start=new Date(jan4);start.setUTCDate(jan4.getUTCDate()-(jan4.getUTCDay()||7)+1+(w-1)*7);
  const from=dateKey(start);if(isoWeek(from)!==week)return {invalid:true};const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);return {from,to:dateKey(end),label:'Week '+w+' · '+y};
 }
 if(period==='Monthly'){
  if(!/^\d{4}-\d{2}$/.test(month)||!businessDate(month+'-01'))return {invalid:true};const end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0));return {from:month+'-01',to:dateKey(end),label:utcDay(month+'-01').toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'UTC'})};
 }
 if(period==='Yearly'){if(!/^\d{4}$/.test(String(year)))return {invalid:true};return {from:year+'-01-01',to:year+'-12-31',label:String(year)};}
 const day=period==='Today'?today:date;return businessDate(day)?{from:day,to:day,label:utcDay(day).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'})}:{invalid:true};
}
export function filterTechnicianJobs(jobs,{status='All time',query='',...period}){
 const range=technicianPeriod(period);if(range.invalid)return [];
 return jobs.filter(job=>{const day=businessDate(jobRecordTime(job));return (status==='All time'||technicianJobStatus(job)===status)&&(!range.from||day>=range.from&&day<=range.to)&&[job.id,job.customerName,job.customerPhone,job.deviceBrand,job.issueType].join(' ').toLowerCase().includes(query.toLowerCase().trim());}).sort((a,b)=>String(jobRecordTime(b)).localeCompare(String(jobRecordTime(a))));
}
