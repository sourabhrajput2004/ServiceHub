import {jobRecordTime,recordDateTime,technicianJobStatus} from '../../utils/technicianJobFilters';
import React,{useState} from 'react';
import {Eye, Wrench, MapPin, UserRound, Receipt} from 'lucide-react';
import {useShop} from '../../context/ShopContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import {workflowStage} from '../../utils/repairWorkflow';
import {serviceMode,repairDirections} from '../../utils/repairService';
import {repairCharges} from '../../utils/repairCharges';
import {workStatus} from '../../utils/orderFulfilment';
import {BusinessDialog} from '../seller/ServiceWorkspace';
import TechnicianWork from '../seller/TechnicianWork';
import TechnicianVisit from './TechnicianVisit';
import RepairStatusTimeline from '../common/RepairStatusTimeline';
import './technician-job-card.css';

export default function TechnicianJobCard({job:booking,shop:providedShop,readOnly=false}){
 const s=useShop(),w=useWorkforce(),{language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[open,setOpen]=useState(false);
 const job=s.bookings.find(j=>j.id===booking.id)||booking,shop=s.shops.find(s=>s.id===(job.shopId||'shop_1'))||providedShop,stage=workflowStage(job),home=serviceMode(job)==='home';
 const charge=repairCharges(job,shop,s.inventory),amount=job.isPaid?job.paymentAmount:job.paymentAmountDue??(charge.items.length?charge.total:null);
 const money=value=>value==null?t('Not set','तय नहीं'):new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
 const canStart=stage==='assigned'&&!home||stage==='on_way',canTravel=home&&stage==='assigned';
 const action=()=>{if(readOnly)return;if(canTravel)w.patchOrder(job.id,{status:'EN_ROUTE',workPhase:'On The Way'});else if(canStart)w.patchOrder(job.id,{status:'IN_PROGRESS',workPhase:'In Progress'});else setOpen(true);};
 const actionLabel=canTravel?t('On The Way','रास्ते में'):canStart?t('Start Repair','रिपेयर शुरू करें'):stage==='repairing'?t('Continue repair','रिपेयर खोलें'):t('Collect payment','पेमेंट लें');
 return <article className={'tech-job-card tech-job-'+stage}>
  <header><strong>{job.id}</strong><span className="tech-job-status">{tr(workStatus(job))}</span></header>
  <div className="tech-job-heading"><span className="tech-job-device-icon"><Wrench size={21}/></span><div><h2>{job.deviceBrand||[job.brand,job.model].filter(Boolean).join(' ')||job.deviceType||t('Repair job','रिपेयर जॉब')}</h2><p>{job.issueType||job.serviceName}</p></div></div>
  <div className="tech-job-facts"><span><UserRound size={16}/>{job.customerName||t('Customer','कस्टमर')}</span><span><MapPin size={16}/>{home?t('Home service','होम सर्विस'):t('Shop service','शॉप सर्विस')}</span></div>
  <div className="tech-job-payment"><span><Receipt size={16}/>{t('Total','कुल')} <strong>{money(amount)}</strong></span><span className={job.isPaid?'tech-job-paid':'tech-job-unpaid'}>{job.isPaid?t('Paid','भुगतान हो गया'):t('Unpaid','भुगतान बाकी')}</span></div>
  <p className="tech-job-record-time"><span>{technicianJobStatus(job)==='Completed'?t('Completed','??????'):technicianJobStatus(job)==='Cancelled'?t('Cancelled','??????'):t('Assigned','???????')}</span><time>{recordDateTime(jobRecordTime(job),language)}</time></p>
  <footer><button type="button" onClick={()=>setOpen(true)}><Eye size={16}/>{t('View Details','पूरी जानकारी')}</button>{['assigned','on_way','repairing','payment_due'].includes(stage)&&<button type="button" className="wf-primary" disabled={readOnly} onClick={action}>{actionLabel}</button>}</footer>
  {open&&<BusinessDialog title={job.id+' · '+t('Job details','जॉब की जानकारी')} className="tech-job-dialog" onClose={()=>setOpen(false)}>
   <section className="tech-job-detail-summary"><div><h3>{job.deviceBrand||job.deviceType}</h3><p>{job.issueType}</p><p>{job.description||job.issueDescription}</p></div><span className="tech-job-status">{tr(workStatus(job))}</span></section>
   <dl className="tech-job-detail-fields">{[[t('Customer','कस्टमर'),job.customerName],[t('Phone','फोन'),job.customerPhone],[t('Service mode','सर्विस का तरीका'),home?t('Home service','होम सर्विस'):t('Shop service','शॉप सर्विस')],[t('Payment status','पेमेंट की स्थिति'),job.isPaid?t('Paid','भुगतान हो गया'):t('Unpaid','भुगतान बाकी')],[t('Total amount','कुल रकम'),money(amount)],[t('Address','पता'),home?job.customerAddress||job.address:shop?.address],...[['Created',job.createdAt||job.bookingDate],['Assigned',job.assignedAt],['Repair started',job.startedAt],['Work completed',job.completedAt],['Payment recorded',job.paymentRecordedAt||job.paymentCompletedAt],['Last updated',job.updatedAt]].map(([label,value])=>[tr(label),recordDateTime(value,language)]),...(job.serialNumber?[[t('IMEI / Serial','IMEI / सीरियल'),job.serialNumber]]:[])].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl>
   {home&&<a className="tech-job-directions" href={repairDirections(job,shop)} target="_blank" rel="noreferrer"><MapPin size={17}/>{t('Navigate to customer','कस्टमर की लोकेशन देखें')}</a>}
   <TechnicianVisit job={job} readOnly={readOnly}/>
   <details className="tech-job-timeline"><summary>{t('Repair timeline','रिपेयर टाइमलाइन')}</summary><RepairStatusTimeline job={job} hideAmounts/></details>
   <TechnicianWork job={job} readOnly={readOnly}/>
  </BusinessDialog>}
 </article>;
}
