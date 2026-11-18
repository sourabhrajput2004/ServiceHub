import {recordDateTime} from '../../utils/technicianJobFilters';
import React,{useEffect,useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import {ATTENDANCE_KEY} from '../../utils/technicianAttendance';
import {technicianWorkedHours} from '../../utils/technicianSalary';
import {businessDate} from '../../utils/workshopOverview';
export default function TechnicianHours(){
 const {user}=useAuth(),w=useWorkforce(),{language}=useLanguage(),[tick,setTick]=useState(0);
 useEffect(()=>{const sync=e=>{if(e.key===ATTENDANCE_KEY)setTick(n=>n+1);},timer=setInterval(()=>setTick(n=>n+1),30000);window.addEventListener('storage',sync);return()=>{window.removeEventListener('storage',sync);clearInterval(timer);};},[]);
 let store={};try{store=JSON.parse(localStorage.getItem(ATTENDANCE_KEY)||'{}');}catch{}
 const member=w.members.find(m=>m.id===user?.id),hours=technicianWorkedHours(store,user,member,businessDate(new Date()).slice(0,7));
 const latest=Object.values(store.entries||{}).filter(e=>e.memberId===user?.id&&e.shopId===user?.shopId).map(e=>e.updatedAt).filter(Boolean).sort().at(-1);
 if(hours===null)return null;
 return <section className="wf-panel" aria-label={language==='hi'?'इस महीने काम के घंटे':'Hours worked this month'}><strong>{language==='hi'?'इस महीने काम के घंटे':'Hours worked this month'}: {hours}</strong><p>{language==='hi'?'आपकी सेव हुई अटेंडेंस के हिसाब से।':'Based on your saved attendance.'}</p>{latest&&<small>{language==='hi'?'Last saved':'Last saved'}: {recordDateTime(latest,language)}</small>}</section>;
}
