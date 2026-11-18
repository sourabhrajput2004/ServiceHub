import React,{useState,useEffect} from 'react';
import {Search, UserRound, MapPin, Eye} from 'lucide-react';
import {useShop} from '../../context/ShopContext';
import {useWorkforce} from '../../context/WorkforceContext';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import MemberTechnicianStats from '../../components/workforce/MemberTechnicianStats';
import TechnicianLocation from '../../components/workforce/TechnicianLocation';
import useAttendanceRecords from '../../hooks/useAttendanceRecords';
import {businessDate} from '../../utils/workshopOverview';
import {technicianSummary,TECH_STATES,techColors} from './technicianManagementData';
import {Modal} from '../../components/workforce/WorkerShell';
import MemberInfo from './MemberInfo';
import MemberFormOverlay from './MemberFormOverlay';
import TechnicianAttendance from './TechnicianAttendance';
import '../../styles/technician-management.css';
import '../../styles/member-directory.css';
export default function TechnicianManagement(){
 const shop=useShop(),w=useWorkforce(),records=useAttendanceRecords(),[now,setNow]=useState(Date.now()),[search,setSearch]=useState(''),[filter,setFilter]=useState('All'),[selected,setSelected]=useState(null),[location,setLocation]=useState(null),[editing,setEditing]=useState(null),[removing,setRemoving]=useState(null),[attendance,setAttendance]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const summary=technicianSummary(w.members,shop.bookings,w.shopId,now),rows=summary.rows.filter(r=>(filter==='All'||r.state===filter)&&[r.member.name,r.member.phone,r.member.skills].join(' ').toLowerCase().includes(search.toLowerCase())),month=businessDate(new Date()).slice(0,7);
 if(attendance)return <WorkforceCopy><div className="wf-page tm-page"><button className="bc-add" onClick={()=>setAttendance(false)}>Back to technicians</button><TechnicianAttendance/></div></WorkforceCopy>;
 return <WorkforceCopy><div className="wf-page tm-page md-page tm-compact-directory"><header className="tm-heading"><div><p className="wf-eyebrow">FIELD OPERATIONS</p><h1>Technicians</h1><p>Your technicians, details and shared locations.</p></div><button className="wf-primary" onClick={()=>setAttendance(true)}>Attendance</button></header><div className="tm-stats">{TECH_STATES.map(state=><button key={state} className={filter===state?'selected':''} aria-pressed={filter===state} onClick={()=>setFilter(filter===state?'All':state)}><span><i style={{background:techColors[state]}}/>{state}</span><strong>{summary.counts[state]}</strong></button>)}</div><label className="md-search"><Search size={19}/><input aria-label="Search technicians" placeholder="Search technicians or skills" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="md-grid">{rows.map(({member:m,state})=><article className="md-card" key={m.id}><div className="md-photo">{m.photo?<img src={m.photo} alt={m.name}/>:<div className="md-photo-empty"><UserRound size={60}/></div>}</div><div className="md-card-body"><h2>{m.name}</h2><div className="tm-card-role"><span className="wf-role-tag technician">Technician</span><span className="tm-status" style={{'--status-color':techColors[state]}}><i/>{state}</span></div><div className="tm-card-info-actions"><button className="md-view-info" onClick={()=>setSelected(m)}><Eye size={16}/>View info</button><button className="md-view-info" onClick={()=>setLocation(m)}><MapPin size={16}/>Track live location</button></div><MemberTechnicianStats compact member={m} month={month} store={records} jobs={shop.bookings} onEdit={()=>setEditing(m)} onRemove={()=>setRemoving(m)}/></div></article>)}</div>{!rows.length&&<section className="md-empty"><UserRound size={40}/><h2>No matching technicians</h2><p>Add technicians from Members or change your search/filter.</p></section>}{selected&&<MemberInfo member={w.members.find(m=>m.id===selected.id)||selected} month={month} store={records} jobs={shop.bookings} onClose={()=>setSelected(null)}/>} {location&&<TechnicianLocation member={location} onClose={()=>setLocation(null)}/>} {editing&&<MemberFormOverlay member={editing} onClose={()=>setEditing(null)} onSaved={()=>setEditing(null)}/>} {removing&&<Modal showClose title="Remove technician?" onClose={()=>setRemoving(null)}><p>{removing.name} will lose workspace access. Past jobs remain saved.</p><button className="wf-danger" onClick={()=>{w.change(removing.id,'REMOVED');setRemoving(null);}}>Remove technician</button></Modal>}</div></WorkforceCopy>;
}
