import {recordDateTime} from '../../utils/technicianJobFilters';
import React,{useEffect,useRef,useState} from 'react';
import {useShop} from '../../context/ShopContext';
import {useAuth} from '../../context/AuthContext';
import {useLanguage} from '../../context/LanguageContext';
import {repairCharges} from '../../utils/repairCharges';
import './repair-work-items.css';
export default function RepairWorkDetails({job}){
 const shop=useShop(),{user}=useAuth(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,attempts=useRef(new Set()),[error,setError]=useState('');
 useEffect(()=>{
  if(!['technician','shop_owner'].includes(user?.role))return;
  for(const r of job.partRequests||[]){if(!['Pending','Acknowledged'].includes(r.status))continue;
   const stock=shop.inventory.find(p=>p.id===r.inventoryItemId)?.stockQty,key=r.id+':'+stock;
   if(attempts.current.has(key))continue;attempts.current.add(key);
   const result=shop.issueRepairPart(job.id,{requestId:r.id,inventoryItemId:r.inventoryItemId,quantity:r.quantity,text:r.text});
   setError(result.success?'':result.error);
  }
 },[job,shop.inventory,user?.id]);
 const charge=repairCharges(job,shop.shops.find(s=>s.id===(job.shopId||'shop_1')),shop.inventory),money=n=>Number.isFinite(Number(n))?'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
 const services=(job.performedServices||[]).map(s=>({...s,qty:1,rate:s.labourCharge}));
 const parts=(job.partRequests||[]).filter(r=>r.status!=='Rejected').map(r=>{const part=shop.inventory.find(p=>p.id===r.inventoryItemId);return {...r,name:r.partName||part?.name||r.text,variant:r.variant??part?.variant,qty:r.quantity,rate:r.sellingPrice??part?.sellingPrice};});
 const list=(rows,kind)=> <section className="repair-detail-group"><header><h4>{kind==='service'?t('Services provided','दी गई सेवाएँ'):t('Parts used','लगाए गए पार्ट्स')}</h4><span>{rows.length}</span></header>{rows.length?<div className="repair-detail-scroll"><table><thead><tr>{[t('S.No.','क्रम'),t('Type','प्रकार'),kind==='service'?t('Service name','सेवा का नाम'):t('Part name','पार्ट का नाम'),t('Quantity','संख्या'),t('Unit price','प्रति इकाई'),t('Amount','रकम'),t('Technician','टेक्नीशियन'),t('Date / time','तारीख / समय')].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><span className={'repair-kind repair-kind-'+kind}>{kind==='service'?t('Service','सेवा'):t('Part','पार्ट')}</span></td><td><strong>{r.name}</strong>{r.variant&&<small>{r.variant}</small>}</td><td>{r.qty}</td><td>{money(r.rate)}</td><td><strong>{money(Number(r.rate)*Number(r.qty))}</strong></td><td>{r.byName||job.assignedTechName||'—'}</td><td>{r.at&&Number.isFinite(Date.parse(r.at))?<><span>{new Date(r.at).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})}</span><small>{new Date(r.at).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})}</small></>:'—'}</td></tr>)}</tbody></table></div>:<p>{t('No items added.','अभी कुछ नहीं जोड़ा गया है।')}</p>}</section>;
 if(!services.length&&!parts.length&&!job.workNotes?.length)return null;
 return <section className="bc-panel repair-work-details"><h3>{t('Services and added parts details','सेवाओं और जोड़े गए पार्ट्स का विवरण')}</h3>{list(services,'service')}{list(parts,'part')}{charge.items.filter(p=>p.kind==='charge').map(p=><div className="repair-detail-total" key={p.chargeKey}><span>{p.name}</span><strong>{money(p.rate)}</strong></div>)}<div className="repair-detail-total"><strong>{t('Total','कुल')}</strong><strong>{money(charge.total)}</strong></div>{error&&<p className="biz-error" role="alert">{error}</p>}{!!job.workNotes?.length&&<section className="repair-detail-group"><header><h4>{t('Technical notes','तकनीकी नोट्स')}</h4></header>{job.workNotes.map(n=><div key={n.id}><p>{n.text}</p><small>{n.byName} {recordDateTime(n.at,language)}</small></div>)}</section>}</section>;
}
