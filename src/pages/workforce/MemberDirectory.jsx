import TechnicianLocation from '../../components/workforce/TechnicianLocation';
import MemberTechnicianStats from '../../components/workforce/MemberTechnicianStats';
import useAttendanceRecords from '../../hooks/useAttendanceRecords';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import {statsMonths} from '../../utils/technicianStats';
import {businessDate} from '../../utils/workshopOverview';
import {workerLabel} from '../../utils/workforceAccess';
import MemberFormOverlay from './MemberFormOverlay';
import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import {Users, Plus, Settings2, UserRound, X, Search, Eye, Pencil, Activity} from 'lucide-react';
import { useWorkforce } from '../../context/WorkforceContext';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import { Modal } from '../../components/workforce/WorkerShell';
import MemberInfo from './MemberInfo';
import '../../styles/member-directory.css';
export default function MemberDirectory({
  staffOnly = false,initialAddOpen=false,initialEditId=null
}) {
  const records=useAttendanceRecords(),shop=useShop(),{language,tr}=useLanguage(),[statsMonth,setStatsMonth]=useState(()=>businessDate(new Date()).slice(0,7));
  const navigate=useNavigate();const [editor,setEditor]=useState(initialEditId|| (initialAddOpen?'add':null));const closeEditor=()=>{setEditor(null);if(initialAddOpen||initialEditId)navigate('/dashboard/members',{replace:true});};
  const w = useWorkforce(),
    [manage, setManage] = useState(false),
    [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(null),[location,setLocation]=useState(null),
    [removing, setRemoving] = useState(null);
  const team = w.members.filter(m => m.shopId === w.shopId && m.status !== 'REMOVED' && !m.legacy && !m.isDemo && !m.demo),
    staff = team.filter(m => m.role === 'staff');
  const rows = (staffOnly ? staff : team).filter(m => (staffOnly || filter === 'all' || m.role === filter) && [m.name, m.email, m.phone, m.skills].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <WorkforceCopy>{location&&<TechnicianLocation member={location} onClose={()=>setLocation(null)}/>}<div className={'wf-page md-page ' + (staffOnly ? 'md-staff' : 'md-members')}><header className="md-heading"><div><p className="wf-eyebrow">{staffOnly ? 'YOUR STAFF' : 'YOUR TEAM'}</p><h1>{staffOnly ? 'Staff' : 'Members'}</h1><p>{staffOnly ? 'Your shop staff and their details.' : 'Everyone in your team, in one place.'}</p></div>{staffOnly && <span className="md-count">{staff.length} staff</span>}</header>{!staffOnly && <><section className="md-summary" aria-label="Team totals"><div><span className="md-summary-icon"><Users size={25} /></span><div><span>Total members</span><strong>{team.length}</strong></div></div><div><span>Staff</span><strong>{staff.length}</strong></div><div><span>Technicians</span><strong>{team.filter(m => m.role === 'technician').length}</strong></div></section><div className="md-toolbar"><div className="wf-tabs">{['all', 'staff', 'technician'].map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value === 'all' ? 'All members' : value === 'staff' ? 'Staff' : 'Technicians'}</button>)}</div><div className="md-toolbar-actions"><button aria-pressed={manage} className={manage ? 'md-managing' : ''} onClick={() => setManage(!manage)}><Settings2 size={18} />{manage ? 'Done managing' : 'Manage members'}</button><button className="wf-primary" onClick={()=>setEditor('add')}><Plus size={18}/>Add members</button></div></div>{manage && <p className="md-manage-note">Edit member details, view activity, or use the × button to remove a member.</p>}</>}{!staffOnly&&<label className="mt-month"><span>{tr('Stats month')}</span><select aria-label="Stats month" value={statsMonth} onChange={e=>setStatsMonth(e.target.value)}>{statsMonths(records,shop.bookings,w.shopId).map(month=><option key={month} value={month}>{new Date(month+'-01T12:00:00Z').toLocaleDateString(language==='hi'?'hi-IN':'en-IN',{month:'long',year:'numeric',timeZone:'Asia/Kolkata'})}</option>)}</select></label>}<label className="md-search"><Search size={18} /><input aria-label={staffOnly ? 'Search staff' : 'Search members'} placeholder="Search name, phone or skill" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="md-grid">{rows.map(m => <article className="md-card" key={m.id}><div className="md-photo">{m.photo ? <img src={m.photo} alt={m.name} /> : <div className="md-photo-empty"><UserRound size={60} /></div>}</div><div className="md-card-body"><h2>{m.name}</h2><span className={'wf-role-tag ' + m.role}>{m.role==='staff'?workerLabel(m):m.role}</span><button className="md-view-info" onClick={() => setSelected(m)}><Eye size={17} />View info</button>{m.role==='technician'&&<button className="md-view-info" onClick={()=>setLocation(m)}>Track live location</button>}{!staffOnly&&m.role==='technician'&&<MemberTechnicianStats compact member={m} month={statsMonth} store={records} jobs={shop.bookings} onEdit={()=>setEditor(m.id)} onRemove={()=>setRemoving(m)}/>}{m.role!=='technician'&&<div className="md-compact-staff-actions"><button className="md-edit-button" onClick={()=>setEditor(m.id)}><Pencil size={15}/>Edit</button><button className="mt-remove" onClick={()=>setRemoving(m)}>Remove</button></div>}{manage && !staffOnly && <div className="md-card-management"><Link to={'/dashboard/members/' + m.id + '/activity'}><Activity size={15} />Activity</Link>{m.status !== 'ACTIVE' && <button onClick={() => w.change(m.id, 'ACTIVE')}>Approve</button>}</div>}</div></article>)}</div>{!rows.length && <div className="md-empty"><UserRound size={40} /><h2>{staffOnly ? 'No staff yet' : 'No members found'}</h2><p>{staffOnly ? 'Staff added from Members will appear here.' : 'Add a member or try another search.'}</p></div>}{editor&&<MemberFormOverlay key={editor} member={editor==='add'?undefined:team.find(m=>m.id===editor)} onClose={closeEditor} onSaved={()=>{setFilter('all');setQuery('');closeEditor();}}/>}{selected && <MemberInfo month={statsMonth} store={records} jobs={shop.bookings} member={team.find(m => m.id === selected.id) || selected} onClose={() => setSelected(null)} />} {removing && <Modal showClose title="Remove this member?" onClose={() => setRemoving(null)}><p><strong>{removing.name}</strong></p><p>This member will disappear from Staff and Members, and lose workspace access. Past jobs will remain.</p><button className="wf-danger" onClick={() => {
          w.change(removing.id, 'REMOVED');
          if (selected?.id === removing.id) setSelected(null);
          setRemoving(null);
        }}>Remove member</button></Modal>}</div></WorkforceCopy>;
}
