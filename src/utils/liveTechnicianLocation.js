import {technicianCheckIn,readCheckInRecords} from './technicianCheckIn';
import {serviceMode} from './repairService';
import {workflowStage} from './repairWorkflow';
export const locationKey=id=>'servicehub_technician_location_'+id;
export function readTechnicianLocation(id){try{return JSON.parse(localStorage.getItem(locationKey(id))||'null');}catch{return null;}}
export function liveLocationAllowed({viewer,member,job,point,attendance=readCheckInRecords(),now=new Date()}){
 if(!member||!technicianCheckIn(member,attendance,now).allowed)return false;
 const owner=viewer?.role==='shop_owner'&&(viewer.shopId||viewer.id)===member.shopId;
 const customer=viewer?.role==='customer'&&job?.customerId===viewer.id&&job.assignedTechId===member.id&&(job.shopId||'shop_1')===member.shopId&&serviceMode(job)==='home'&&['assigned','on_way','repairing'].includes(workflowStage(job));
 const stamp=Date.parse(point?.at),heartbeat=Date.parse(point?.heartbeatAt||point?.at),age=now.getTime()-stamp,beatAge=now.getTime()-heartbeat;
 return Boolean((owner||customer)&&point?.sharing&&point.memberId===member.id&&point.shopId===member.shopId&&Number.isFinite(point.lat)&&Number.isFinite(point.lng)&&Math.abs(point.lat)<=90&&Math.abs(point.lng)<=180&&age>=0&&age<120000&&beatAge>=0&&beatAge<30000);
}
export function stopTechnicianLocation(id,reason='Stopped'){
 const old=readTechnicianLocation(id);if(old){const {lat,lng,accuracy,...metadata}=old;localStorage.setItem(locationKey(id),JSON.stringify({...metadata,sharing:false,stoppedAt:new Date().toISOString(),stopReason:reason}));}
 window.dispatchEvent(new Event('technician-location-stop'));
 window.dispatchEvent(new Event('technician-location-updated'));
}
