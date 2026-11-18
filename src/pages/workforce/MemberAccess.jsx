import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {workerHome} from '../../utils/workforceAccess';
import ThemeSwitch from '../../components/common/ThemeSwitch';
import LanguageSwitch from '../../components/common/LanguageSwitch';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import {Field} from '../../components/workforce/WorkerShell';
import '../../styles/technician-workspace.css';

export default function MemberAccess(){
 const {user,setUser,logout}=useAuth(),w=useWorkforce(),navigate=useNavigate();
 const [identity,setIdentity]=useState(''),[challenge,setChallenge]=useState(null),[otp,setOtp]=useState(''),[error,setError]=useState('');
 const send=()=>{const result=w.findLoginMember(identity);if(result.error){setError(result.error);return;}const code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);setChallenge({memberId:result.member.id,identity:result.identity,code,expires:Date.now()+300000,attempts:0});setOtp('');setError('');};
 const verify=e=>{e.preventDefault();if(!challenge){send();return;}if(Date.now()>challenge.expires||challenge.attempts>=5){setError('Code expired or attempt limit reached. Request a new code.');return;}if(otp!==challenge.code){setChallenge(c=>({...c,attempts:c.attempts+1}));setError('Incorrect code. Please try again.');return;}const result=w.findLoginMember(challenge.identity),m=result.member?.id===challenge.memberId?result.member:null;if(!m){setChallenge(null);setError('Membership changed. Contact your shop owner.');return;}setChallenge(null);setUser({id:m.id,shopId:m.shopId,name:m.name,phone:m.phone,email:m.email||m.id+'@local.invalid',role:m.role,staffDuty:m.staffDuty,skills:m.skills,avatar:m.photo});navigate(workerHome(m),{replace:true});};
 return <WorkforceCopy><div className="member-access wf-page"><header className="member-access-header"><strong>Member login for ServiceHub</strong><div className="wf-header-controls"><ThemeSwitch/><LanguageSwitch compact/>{user&&<><span>{user.name}</span><button onClick={logout}>Logout</button></>}</div></header><main className="member-access-main"><form className="wf-panel" onSubmit={verify}><p className="wf-eyebrow">SERVICEHUB MEMBERS</p><h1>Member login</h1><p>Sign in to your assigned workspace.</p><Field label="Phone number or email" error={!challenge?error:undefined}><input autoComplete="username" value={identity} disabled={!!challenge} maxLength={254} onChange={e=>setIdentity(e.target.value)}/></Field>{challenge&&<><Field label="Verification code" error={error}><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></Field><p className="member-preview-note" role="status">Test code: <strong>{challenge.code}</strong>. Expires in 5 minutes. SMS and email are unavailable.</p><div className="wf-actions"><button type="button" onClick={send}>New code</button><button type="button" onClick={()=>{setChallenge(null);setError('');}}>Change phone / email</button></div></>}<button className="wf-primary" type="submit">{challenge?'Verify & open workspace':'Continue'}</button>{!challenge&&<p className="member-preview-note">Local preview. SMS/email delivery requires a connected authentication service.</p>}</form></main></div></WorkforceCopy>;
}
