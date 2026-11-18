import {PERSONAL_FIELDS,PROFILE_GROUPS} from './TechnicianAccount';
import React,{useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useShop} from '../../context/ShopContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import useAttendanceRecords from '../../hooks/useAttendanceRecords';
import {businessDate} from '../../utils/workshopOverview';
import {publicTechnicianStats,previousMonths,statsMonths} from '../../utils/technicianStats';
import '../../styles/member-technician-stats.css';
export default function TechnicianProfile({actor}){
 const {user}=useAuth(),w=useWorkforce(),{bookings,shops}=useShop(),{language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,store=useAttendanceRecords(),[month,setMonth]=useState(()=>businessDate(new Date()).slice(0,7)),member=w.members.find(m=>m.id===(actor?.id||user?.id)),stats=member&&publicTechnicianStats(store,bookings,member,month,actor||user);
 if(!stats)return <section className="wf-panel">{t('Profile unavailable.','प्रोफाइल नहीं मिली।')}</section>;
 const label=m=>new Date(m+'-01T12:00:00Z').toLocaleDateString(language==='hi'?'hi-IN':'en-IN',{month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
 return <section className="wf-panel mt-profile tech-account"><header className="mt-profile-heading">{member.photo&&<img src={member.photo} alt=""/>}<div><h1>{t('My Profile','मेरी प्रोफाइल')} · {member.name}</h1><p>{shops.find(s=>s.id===member.shopId)?.shopName}</p><p>{member.phone} · {member.skills}</p></div></header>{PROFILE_GROUPS.map(([heading,keys],index)=><section className="tech-account-section" key={heading}><h2><span>{String(index+1).padStart(2,'0')}</span>{tr(heading)}</h2><dl className="tech-account-grid tech-account-read">{keys.map(key=><div key={key}><dt>{tr(PERSONAL_FIELDS.find(f=>f[0]===key)[1])}</dt><dd>{(Array.isArray(member[key])?member[key].join(', '):member[key])||tr('Not provided')}</dd></div>)}</dl></section>)}<label className="wf-field"><span>{t('Month','महीना')}</span><select value={month} onChange={e=>setMonth(e.target.value)}>{statsMonths(store,bookings,member.shopId).map(m=><option key={m} value={m}>{label(m)}</option>)}</select></label><div className="mt-stats"><h2>{label(month)}</h2><dl>{[[t('Working hours','काम के घंटे'),stats.hours],[t('Present days','हाज़िर दिन'),stats.present],[t('Late days','लेट दिन'),stats.late],[t('Absent days','गैरहाज़िर दिन'),stats.absent],[t('Jobs done','पूरे किए जॉब'),stats.jobsDone]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h3>{t('Last 3 months','पिछले 3 महीने')}</h3><ul className="mt-trend">{previousMonths(month).reverse().map(m=>{const s=publicTechnicianStats(store,bookings,member,m,actor||user);return <li key={m}><strong>{label(m)}</strong><span>{s.hours} {t('hours','घंटे')} · {s.jobsDone} {t('jobs','जॉब')}</span></li>;})}</ul></div></section>;
}
