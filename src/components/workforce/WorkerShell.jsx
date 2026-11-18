import MemberNavigation from './MemberNavigation';
import {handleDialogCancel} from '../../utils/dialogEvents';
import {workerScreens,workerLabel} from '../../utils/workforceAccess';
import WorkforceCopy from './WorkforceCopy';
import LanguageSwitch from '../common/LanguageSwitch';
import ThemeSwitch from '../common/ThemeSwitch';
import {useLanguage} from '../../context/LanguageContext';
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkforce } from '../../context/WorkforceContext';
import '../../styles/workforce.css';
export function Field({
  label,
  error,
  children
}) {
  const id = React.useId();
  const {tr}=useLanguage();
  const connect = node => {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'string' && ['input', 'select', 'textarea'].includes(node.type)) return React.cloneElement(node, {
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? [node.props['aria-describedby'], id].filter(Boolean).join(' ') : node.props['aria-describedby']
    });
    return node.props.children === undefined?  node : React.cloneElement(node, {}, React.Children.map(node.props.children, connect));
  };
  return <label className="wf-field"><span>{tr(label)}</span>{React.Children.map(children, connect)}{error && <small id={id} className="wf-error" role="alert">{tr(error)}</small>}</label>;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  showClose = false,
  hideCancel = false
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    ref.current?.showModal();
  }, []);
  return <WorkforceCopy><dialog ref={ref} aria-label={title} className={'wf-modal' + (wide ? ' wf-modal-wide' : '')} onCancel={event=>handleDialogCancel(event,onClose)}>{showClose && <button className="md-dialog-close" type="button" aria-label="Close information" onClick={onClose}>×</button>}<h2>{title}</h2>{children}{!hideCancel&&<button type="button" onClick={onClose}>Cancel</button>}</dialog></WorkforceCopy>;
}
export default function WorkerShell({
  children,
  actor
}) {
  const {
      user: authUser,
      logout
    } = useAuth(),
    {
      allowed,member
    } = useWorkforce();
  if (!allowed) return <WorkforceCopy><div className="wf-page"><h1>Access unavailable</h1><p>Your membership is pending or removed. Contact your shop owner.</p><button onClick={logout}>Sign out</button></div></WorkforceCopy>;
  const user = actor || authUser;
  const tech=user.role==='technician',links=workerScreens(actor||member||user).map(key=>key[0].toUpperCase()+key.slice(1));
  return <WorkforceCopy><div className={'wf-shell member-shell '+(tech?'wf-technician':'wf-staff')}><MemberNavigation person={actor||member||user} preview={Boolean(actor)} logout={logout}/><main className="wf-content">{children}</main></div></WorkforceCopy>;
}
