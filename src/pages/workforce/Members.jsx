import {workerHome,workerScreens,workerLabel} from '../../utils/workforceAccess';
import MemberDirectory from './MemberDirectory';
import TechnicianManagement from './TechnicianManagement';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Users, Plus, Search, Activity, CheckCircle2, ShieldCheck} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useWorkforce } from '../../context/WorkforceContext';
import { Field, Modal } from '../../components/workforce/WorkerShell';
import AddMemberPage from './AddMemberPage';
import '../../styles/workforce.css';
export default function Members({
  role,
  addPage = false
}) {
  if (addPage) return <MemberDirectory initialAddOpen/>;
  if (role === 'technician') return <TechnicianManagement />;
  return <MemberDirectory staffOnly={role === 'staff'} />;
}
export function MemberEdit() {
  const {
      id
    } = useParams(),
    w = useWorkforce();
  const member = w.members.find(m => m.id === id && m.shopId === w.shopId && m.status !== 'REMOVED');
  return member ? <MemberDirectory key={member.id} initialEditId={member.id}/> : <div className="wf-page"><h1>Member not found</h1></div>;
}
export function MemberInvite() {
  return <WorkforceCopy><div className="wf-page wf-narrow"><section className="wf-panel"><h1>No verification required</h1><p>Your shop owner can add you directly from Members.</p></section></div></WorkforceCopy>;
}
export {default as MemberLogin} from './MemberAccess';
