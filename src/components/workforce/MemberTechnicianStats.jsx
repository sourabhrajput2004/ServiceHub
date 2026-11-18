import MemberAttendanceExplorer from './MemberAttendanceExplorer';
import React,{useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useLanguage} from '../../context/LanguageContext';
import {Modal} from './WorkerShell';
import {ownerTechnicianStats,previousMonths} from '../../utils/technicianStats';
import '../../styles/member-technician-stats.css';
export default function MemberTechnicianStats({member,month,store,jobs,onEdit,onRemove,compact=false,detailsOnly=false}){
 const {user}=useAuth(),{language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[view,setView]=useState(null),stats=ownerTechnicianStats(store,jobs,member,month,user);
 if(!stats)return null;
 const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n),label=m=>new Date(m+'-01T12:00:00Z').toLocaleDateString(language==='hi'?'hi-IN':'en-IN',{month:'short',year:'numeric',timeZone:'Asia/Kolkata'}),salary=stats.salary;
 return <section className={"mt-stats"+(compact?' mt-compact-actions':'')}>{!compact&&<MemberAttendanceExplorer member={member} month={month} store={store} jobs={jobs}/>}{!detailsOnly&&<div className="mt-actions"><button type="button" onClick={()=>setView('attendance')}>{t('View Attendance','अटेंडेंस देखें')}</button><button type="button" onClick={()=>setView('jobs')}>{t('View Jobs','जॉब देखें')}</button><button type="button" onClick={onEdit}>{t('Edit','बदलें')}</button><button type="button" className="mt-remove" onClick={onRemove}>{t('Remove','हटाएँ')}</button></div>}{view&&<Modal showClose={view!=='attendance'} hideCancel={view==='attendance'} wide title={member.name+' · '+(view==='attendance'?t('Attendance','अटेंडेंस'):t('Completed jobs','पूरे किए जॉब'))+' · '+label(month)} onClose={()=>setView(null)}>{view==='attendance'?<MemberAttendanceExplorer member={member} month={month} store={store} jobs={jobs} onClose={()=>setView(null)}/>:stats.completedJobs.length?<ul className="mt-job-list">{stats.completedJobs.map(j=><li key={j.id}><strong>{j.id} · {j.deviceBrand}</strong><p>{j.issueType}</p><small>{new Date(j.completedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'})}</small></li>)}</ul>:<p>{t('No completed jobs for this month.','इस महीने कोई जॉब पूरा नहीं हुआ है।')}</p>}</Modal>}</section>;
}
