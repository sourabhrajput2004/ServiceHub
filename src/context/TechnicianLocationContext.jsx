import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {useAuth} from './AuthContext';
import {useWorkforce} from './WorkforceContext';
import {technicianCheckIn} from '../utils/technicianCheckIn';
import {locationKey,readTechnicianLocation,stopTechnicianLocation} from '../utils/liveTechnicianLocation';
const Context=createContext(null);
export const useTechnicianLocation=()=>useContext(Context);
export function TechnicianLocationProvider({children}){
 const {user}=useAuth(),w=useWorkforce(),member=w.members.find(m=>m.id===user?.id&&m.role==='technician'),watch=useRef(null),current=useRef({user,member}),[sharing,setSharing]=useState(false),[eligible,setEligible]=useState(false),[error,setError]=useState(''),[lastSaved,setLastSaved]=useState('');current.current={user,member};
 const clear=()=>{if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);watch.current=null;setSharing(false);};
 const stop=(reason='Stopped by technician')=>{clear();if(current.current.member)stopTechnicianLocation(current.current.member.id,reason);};
 const start=()=>{
  const {user,member}=current.current;if(user?.role!=='technician'||!member)return;
  const check=technicianCheckIn(member);if(!check.allowed){setError(check.reason);return;}
  if(!navigator.geolocation){setError('GPS is unavailable in this browser.');return;}if(watch.current!==null)return;setError('');setSharing(true);
  try{localStorage.setItem(locationKey(member.id),JSON.stringify({memberId:member.id,shopId:member.shopId,sharing:true,heartbeatAt:new Date().toISOString(),at:null}));}catch{setSharing(false);setError('Unable to save location.');return;}
  try{watch.current=navigator.geolocation.watchPosition(position=>{
   if(watch.current===null)return;
   if(current.current.user?.id!==member.id||!technicianCheckIn(current.current.member).allowed){stop('Shift ended');return;}
   const at=new Date().toISOString(),p={memberId:member.id,shopId:member.shopId,lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy,at,heartbeatAt:at,sharing:true};
   try{localStorage.setItem(locationKey(member.id),JSON.stringify(p));setLastSaved(at);window.dispatchEvent(new Event('technician-location-updated'));}catch{stop('Unable to save');setError('Unable to save location.');}
  },()=>{stop('GPS permission unavailable');setError('Allow location permission and turn on GPS.');},{enableHighAccuracy:true,maximumAge:0,timeout:20000});}catch{stop('GPS could not start');setError('Location needs permission and a secure browser connection.');}
 };
 useEffect(()=>{
  const id=user?.role==='technician'?user.id:null;setEligible(Boolean(id&&technicianCheckIn(current.current.member).allowed));
  const sync=()=>{
   if(!id)return;
   let saved;try{saved=JSON.parse(localStorage.getItem('servicehub_member_user')||'null');}catch{}
   const allowed=saved?.id===id&&technicianCheckIn(current.current.member).allowed;setEligible(allowed);
   if(!allowed){clear();stopTechnicianLocation(id,'Logged out or checked out');}
   else if(watch.current!==null){const p=readTechnicianLocation(id);if(p?.sharing)localStorage.setItem(locationKey(id),JSON.stringify({...p,heartbeatAt:new Date().toISOString()}));else clear();}
  };
  const stopRequested=()=>{if(id&&!readTechnicianLocation(id)?.sharing)clear();},leave=()=>{if(id){clear();stopTechnicianLocation(id,'Page closed');}};
  window.addEventListener('storage',sync);window.addEventListener('technician-attendance-updated',sync);window.addEventListener('technician-location-stop',stopRequested);window.addEventListener('pagehide',leave);
  const timer=setInterval(sync,3000);
  return()=>{clearInterval(timer);window.removeEventListener('storage',sync);window.removeEventListener('technician-attendance-updated',sync);window.removeEventListener('technician-location-stop',stopRequested);window.removeEventListener('pagehide',leave);if(id){clear();stopTechnicianLocation(id,'Technician session ended');}};
 },[user?.id,user?.role]);
 return <Context.Provider value={{sharing,error,lastSaved,start,stop,checkedIn:eligible}}>{children}</Context.Provider>;
}
