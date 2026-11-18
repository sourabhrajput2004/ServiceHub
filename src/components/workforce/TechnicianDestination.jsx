import React,{useState} from 'react';
import {MapPin, Navigation} from 'lucide-react';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import {BusinessDialog} from '../seller/ServiceWorkspace';
import {repairDirections,parseMapCoordinates} from '../../utils/repairService';
import {TechnicianLocationSharing} from './TechnicianLocation';
export default function TechnicianDestination({job,readOnly=false}){
 const s=useShop(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[open,setOpen]=useState(false),shop=s.shops.find(v=>v.id===(job.shopId||'shop_1')),point=job.serviceCoordinates||parseMapCoordinates(job.googleMapsUrl),destination=point?point.lat+','+point.lng:job.customerAddress||job.address;
 return <><div className="rw-actions"><button type="button" onClick={()=>setOpen(true)}><MapPin size={17}/>{t('See customer location','कस्टमर की लोकेशन देखें')}</button></div>{open&&<BusinessDialog title={t('Home service location','होम सर्विस की लोकेशन')} onClose={()=>setOpen(false)} className="technician-location-modal"><p>{job.customerName} · {job.customerAddress||job.address}</p>{destination&&<iframe title="Customer service location" src={'https://maps.google.com/maps?q='+encodeURIComponent(destination)+'&z=16&output=embed'} referrerPolicy="no-referrer"/>}<a className="wf-primary" href={repairDirections(job,shop)} target="_blank" rel="noreferrer"><Navigation size={18}/>{t('Start navigation','नेविगेशन शुरू करें')}</a>{!readOnly&&<TechnicianLocationSharing/>}</BusinessDialog>}</>;
}
