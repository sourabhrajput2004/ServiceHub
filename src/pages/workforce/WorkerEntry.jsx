import {workerScreens} from '../../utils/workforceAccess';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkforce } from '../../context/WorkforceContext';
import Workspace from './Workspace';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
export default function WorkerEntry({
  screen,
  role
}) {
  const {
      user
    } = useAuth(),
    w = useWorkforce(),
    [params, setParams] = useSearchParams();
  if (user?.role !== 'shop_owner') return <Workspace screen={screen} />;
  const members = w.members.filter(m => m.shopId === w.shopId && m.role === role && m.status === 'ACTIVE'&&workerScreens(m).length>0);
  const selected = members.find(m => m.id === params.get('member')) || members[0];
  return <><WorkforceCopy><div className="wf-preview-bar"><strong>Owner preview · Read only</strong><label>Member <select aria-label="Preview member" value={selected?.id || ''} onChange={e => setParams({
            member: e.target.value
          })}>{!members.length && <option value="">No active members</option>}{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div></WorkforceCopy><Workspace key={selected?.id || role} screen={screen} previewMember={selected || {
      id: 'no-member',
      name: 'No active members',
      role,
      shopId: w.shopId
    }} /></>;
}
