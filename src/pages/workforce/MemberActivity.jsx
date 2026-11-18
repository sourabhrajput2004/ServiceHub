import { businessDate } from '../../utils/workshopOverview';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {Activity} from 'lucide-react';
import { useWorkforce } from '../../context/WorkforceContext';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import { Field } from '../../components/workforce/WorkerShell';
export default function MemberActivity() {
  const {
      id
    } = useParams(),
    w = useWorkforce(),
    [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  const member = w.members.find(m => m.id === id && m.shopId === w.shopId);
  const invalid = from && to && from > to;
  const rows = (w.activities || []).filter(a => a.shopId === w.shopId && a.memberId === id && (!from || businessDate(a.date) >= from) && (!to || businessDate(a.date) <= to)).sort((a, b) => b.date.localeCompare(a.date));
  return <WorkforceCopy><div className="wf-page wf-activity-page"><Link className="wf-back-link" to="/dashboard/members">Back to Members</Link>{!member ? <section className="wf-panel"><h1>Member not found</h1></section> : <><header className="wf-members-heading"><div><p className="wf-eyebrow">MEMBER ACTIVITY</p><h1>{member.name}</h1><p>{member.role} · Read-only activity history</p></div><span className="wf-capacity"><Activity size={18} />Activity log</span></header><div className="wf-activity-filters"><Field label="From date"><input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></Field><Field label="To date" error={invalid ? 'End date must be on or after start date.' : null}><input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></Field><button onClick={() => {
            setFrom('');
            setTo('');
          }}>Clear filters</button></div><div className="wf-table"><table><thead><tr>{['Date', 'Action', 'Order #', 'Details'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{!invalid && rows.map(a => <tr key={a.id}><td data-label="Date">{new Date(a.date).toLocaleString('en-IN')}</td><td data-label="Action"><span className="wf-activity-action">{a.action.replaceAll('_', ' ')}</span></td><td data-label="Order #">{a.orderId || '—'}</td><td data-label="Details">{a.details}</td></tr>)}</tbody></table>{(!rows.length || invalid) && <div className="wf-empty">No activity in this date range.</div>}</div></>}</div></WorkforceCopy>;
}
