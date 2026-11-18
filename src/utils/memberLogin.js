import {workerScreens} from './workforceAccess';

export function memberLoginIdentity(value){
 const text=String(value??'').trim().toLowerCase();
 if(text.includes('@'))return text;
 const digits=text.replace(/[\s()+-]/g,'');
 return /^(?:\+?91|0091)?[6-9]\d{9}$/.test(digits)?digits.slice(-10):text;
}

export function resolveMemberLogin(members,identity){
 const value=memberLoginIdentity(identity);
 if(!/^[6-9]\d{9}$/.test(value)&&!/^\S+@\S+\.\S+$/.test(value))return {error:'Enter your registered phone number or email.'};
 const matches=members.filter(m=>memberLoginIdentity(m.phone)===value||String(m.email??'').trim().toLowerCase()===value);
 const active=matches.filter(m=>m.status==='ACTIVE');
 const eligible=active.filter(m=>workerScreens(m).length);
 if(eligible.length>1)return {error:'More than one active member uses this contact. Ask your shop owner to correct the duplicate.'};
 if(eligible.length===1)return {member:eligible[0],identity:value};
 if(active.length)return {error:'This member has no dashboard assigned. Ask your shop owner to check their role.'};
 if(matches.length)return {error:'This membership is inactive or removed. Ask your shop owner to activate it.'};
 return {error:'No member found in this browser. Use the same browser and site address where your shop owner added the member.'};
}
