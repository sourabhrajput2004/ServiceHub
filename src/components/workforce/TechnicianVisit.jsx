import TechnicianDestination from './TechnicianDestination';
import WorkforceCopy from './WorkforceCopy';
import React,{useState} from 'react';
import {useWorkforce} from '../../context/WorkforceContext';
import {workflowStage} from '../../utils/repairWorkflow';
import {serviceMode} from '../../utils/repairService';
export default function TechnicianVisit({job,readOnly=false}){
 const w=useWorkforce(),[minutes,setMinutes]=useState(job.etaMinutes||30),[message,setMessage]=useState(''),stage=workflowStage(job);
 return <WorkforceCopy>{serviceMode(job)==='home'&&<section><h3>Service visit</h3><TechnicianDestination job={job} readOnly={readOnly}/><p>{job.customerName} · {job.customerAddress||job.address||'Address awaiting confirmation'}</p>{job.customerPhone&&<a href={'tel:'+job.customerPhone}>Call customer</a>}<p>Service: {job.issueType||job.serviceName} · {job.description||job.issueDescription}</p>{job.estimatedArrivalAt&&<p>Expected arrival: {new Date(job.estimatedArrivalAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</p>}{['assigned','on_way'].includes(stage)&&<form className="tech-eta" onSubmit={e=>{e.preventDefault();if(readOnly)return;setMessage(w.updateVisitEta(job.id,minutes)?'Arrival estimate shared with customer.':'Enter 1–480 minutes for your active visit.');}}><label className="wf-field"><span>Arriving in (minutes)</span><input type="number" min="1" max="480" value={minutes} disabled={readOnly} onChange={e=>setMinutes(e.target.value)}/></label><button disabled={readOnly}>Update arrival</button></form>}{message&&<p role="status">{message}</p>}</section>}</WorkforceCopy>;
}
