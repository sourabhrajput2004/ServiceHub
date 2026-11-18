import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import RepairWorkItems from './RepairWorkItems';
import WorkUpdates from './RepairWorkDetails';
import RepairPayment from './RepairPayment';
import {workflowStage} from '../../utils/repairWorkflow';
import {serviceMode} from '../../utils/repairService';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import {activeRepair} from '../../utils/jobAssignment';
import {BusinessDialog,BusinessField} from './ServiceWorkspace';
export {default as WorkUpdates} from './RepairWorkDetails';

export default function TechnicianWork({job,readOnly=false}){
 const w=useWorkforce(),{language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en;
 const [modal,setModal]=useState(null),[text,setText]=useState(''),[error,setError]=useState('');
 const active=activeRepair(job),phase=job.workPhase||(!job.startedAt?'Assigned':'In Progress'),stage=workflowStage(job),home=serviceMode(job)==='home';
 const open=type=>{setError('');setText('');setModal(type);};
 const adding=modal==='service'||modal==='part';
 return <><p><strong>{t('Work status','काम की स्थिति')}: {active?phase:'Done'}</strong></p>
 <div className="rw-actions">{active&&!readOnly&&<Link className="rw-primary" to={'/technician/support?job='+encodeURIComponent(job.id)}>{t('Job Support / Chat','जॉब सहायता / चैट')}</Link>}
 {active&&<>{home&&<button disabled={readOnly||stage!=='assigned'} onClick={()=>w.patchOrder(job.id,{status:'EN_ROUTE',workPhase:'On The Way'})}>{tr('On The Way')}</button>}
 <button className="rw-primary" disabled={readOnly||(home?stage!=='on_way':stage!=='assigned')} onClick={()=>w.patchOrder(job.id,{status:'IN_PROGRESS',workPhase:'In Progress'})}>{tr('Start Repair')}</button>
 <button className="rw-primary" disabled={readOnly||stage!=='repairing'} onClick={()=>open('done')}>{tr('Mark Done')}</button>
 <button disabled={readOnly||stage!=='repairing'} onClick={()=>open('service')}>{t('Add Service','सेवा जोड़ें')}</button>
 <button disabled={readOnly||stage!=='repairing'} onClick={()=>open('part')}>{t('Add Part','पार्ट जोड़ें')}</button>
 <button disabled={readOnly} onClick={()=>open('note')}>{tr('Add technical note')}</button></>}</div>
 <WorkUpdates job={job}/><RepairPayment job={job} technician readOnly={readOnly}/>
 {modal&&<BusinessDialog className={adding?'repair-item-dialog':''} title={modal==='service'?t('Add Service','सेवा जोड़ें'):modal==='part'?t('Add Part','पार्ट जोड़ें'):modal==='done'?t('Complete repair','रिपेयर पूरी करें'):t('Technical note','तकनीकी नोट')} onClose={()=>setModal(null)}>
 {adding?<><RepairWorkItems key={modal} mode={modal} job={job} readOnly={readOnly||stage!=='repairing'}/><div className="bc-actions"><button type="button" onClick={()=>setModal(null)}>{t('Close','बंद करें')}</button></div></>:modal==='done'?<><div className="bc-actions"><button onClick={()=>setModal(null)}>{t('Cancel','कैंसल')}</button><button className="biz-primary" onClick={()=>{w.complete(job);setModal(null);}}>{t('Confirm completion','काम पूरा होने की पुष्टि करें')}</button></div></>:<form noValidate onSubmit={e=>{e.preventDefault();const result=w.addWorkUpdate(job.id,'note',{text});if(result.success)setModal(null);else setError(result.error);}}><BusinessField label={t('Technical note *','तकनीकी नोट *')} error={error}><textarea value={text} rows={3} maxLength={1000} onChange={e=>setText(e.target.value)}/></BusinessField><div className="bc-actions"><button type="button" onClick={()=>setModal(null)}>{t('Cancel','कैंसल')}</button><button className="biz-primary">{t('Save','सेव करें')}</button></div></form>}</BusinessDialog>}</>;
}
