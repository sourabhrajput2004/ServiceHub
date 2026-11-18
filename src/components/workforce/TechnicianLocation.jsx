import '../../styles/technician-management.css';
import React,{useEffect,useState} from 'react';
import {MapPin, Navigation} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import {useTechnicianLocation} from '../../context/TechnicianLocationContext';
import {BusinessDialog} from '../seller/ServiceWorkspace';
import {recordDateTime} from '../../utils/technicianJobFilters';
import {liveLocationAllowed,readTechnicianLocation} from '../../utils/liveTechnicianLocation';

export function TechnicianLocationSharing(){
 const location=useTechnicianLocation(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en;
 return <section className="wf-panel technician-location-sharing"><strong><MapPin size={19}/>{t('Live location sharing','लाइव लोकेशन शेयरिंग')}</strong><p>{t('While checked in, share GPS with your owner and assigned home-service customers. Keep ServiceHub open while travelling.','चेक-इन के दौरान मालिक और होम सर्विस कस्टमर से GPS साझा करें। यात्रा के दौरान ServiceHub खुला रखें।')}</p><button type="button" className="wf-primary" disabled={!location||!location.checkedIn&&!location.sharing} onClick={()=>location.sharing?location.stop():location.start()}>{t(location?.sharing?'Stop sharing':'Start sharing',location?.sharing?'शेयर करना बंद करें':'लोकेशन शेयर करें')}</button>{location&&!location.checkedIn&&<p>{t('Check in before sharing. Checkout and logout stop sharing automatically.','पहले चेक-इन करें। चेकआउट और लॉगआउट पर शेयरिंग बंद होगी।')}</p>}{location?.lastSaved&&<p><small>{t('Last GPS update','आखिरी GPS अपडेट')}: {recordDateTime(location.lastSaved,language)}</small></p>}{location?.error&&<p className="wf-error" role="alert">{location.error}</p>}</section>;
}
export default function TechnicianLocation({member,job,onClose}){
 const {user}=useAuth(),w=useWorkforce(),s=useShop(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[point,setPoint]=useState(()=>readTechnicianLocation(member.id)),[now,setNow]=useState(Date.now());
 const currentMember=w.members.find(m=>m.id===member.id&&m.shopId===member.shopId),currentJob=job?s.bookings.find(j=>j.id===job.id):null;
 useEffect(()=>{const sync=()=>{setPoint(readTechnicianLocation(member.id));setNow(Date.now());};window.addEventListener('storage',sync);window.addEventListener('technician-location-updated',sync);window.addEventListener('technician-attendance-updated',sync);const timer=setInterval(sync,3000);return()=>{clearInterval(timer);window.removeEventListener('storage',sync);window.removeEventListener('technician-location-updated',sync);window.removeEventListener('technician-attendance-updated',sync);};},[member.id]);
 const live=liveLocationAllowed({viewer:user,member:currentMember,job:currentJob,point,now:new Date(now)}),coords=live?point.lat+','+point.lng:'';
 return <BusinessDialog title={member.name+' · '+t('Live location','लाइव लोकेशन')} onClose={onClose} className="technician-location-modal">{live?<><p className="location-fresh" role="status">{t('Live GPS updates','लाइव GPS अपडेट')}</p><p>{t('Updated','अपडेट')}: {recordDateTime(point.at,language)} · ±{Math.round(point.accuracy||0)} m</p><iframe title={member.name+' live location'} src={'https://maps.google.com/maps?q='+encodeURIComponent(coords)+'&z=16&output=embed'} referrerPolicy="no-referrer"/><a className="wf-primary" target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coords)}><Navigation size={18}/>{t('Open in Google Maps','Google Maps पर देखें')}</a></>:<div className="wf-empty"><MapPin size={35}/><h3>{t('Live location unavailable','लाइव लोकेशन उपलब्ध नहीं है')}</h3><p>{t('The technician must be checked in and sharing GPS. Location is hidden after checkout, logout, or stale updates.','टेक्नीशियन का चेक-इन और GPS शेयरिंग चालू होना चाहिए। चेकआउट, लॉगआउट या पुराने अपडेट पर लोकेशन छिप जाती है।')}</p></div>}<p className="wf-subtle">{t("Location sharing works between tabs on this device only.","लोकेशन सिर्फ़ इस डिवाइस के टैब के बीच साझा होती है।")}</p></BusinessDialog>;
}
