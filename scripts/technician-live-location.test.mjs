import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {MemoryRouter} from 'react-router-dom';
const store=new Map(),events=new Map();let position,cleared=0;
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.window={addEventListener:(k,fn)=>{if(!events.has(k))events.set(k,new Set());events.get(k).add(fn);},removeEventListener:(k,fn)=>events.get(k)?.delete(fn),dispatchEvent:e=>{for(const fn of events.get(e.type)||[])fn(e);},matchMedia:()=>({matches:false})};
globalThis.document={documentElement:{lang:'',dataset:{},style:{}},body:{style:{}}};
Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition:fn=>{position=fn;return 7;},clearWatch:()=>{cleared++;}}});
const member={id:'live-tech',shopId:'shop_1',role:'technician',status:'ACTIVE',name:'Live Technician'},owner={id:'shop_1',shopId:'shop_1',role:'shop_owner'},customer={id:'customer-live',role:'customer'};
store.set('servicehub_user',JSON.stringify(member));store.set('servicehub_workforce_v1',JSON.stringify({members:[member],events:[]}));
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree,auth,location;
try{
 const {LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx');
 const {AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{WorkforceProvider}=await server.ssrLoadModule('/src/context/WorkforceContext.jsx'),{TechnicianLocationProvider,useTechnicianLocation}=await server.ssrLoadModule('/src/context/TechnicianLocationContext.jsx'),{liveLocationAllowed,readTechnicianLocation,locationKey}=await server.ssrLoadModule('/src/utils/liveTechnicianLocation.js'),{businessDate}=await server.ssrLoadModule('/src/utils/workshopOverview.js'),{ATTENDANCE_KEY}=await server.ssrLoadModule('/src/utils/technicianAttendance.js');
 const day=businessDate(new Date()),attendance={entries:{['shop_1:'+day+':'+member.id]:{memberId:member.id,shopId:'shop_1',date:day,attendanceMode:'clock',status:'Checked in',checkIn:'00:00',checkOut:''}}};store.set(ATTENDANCE_KEY,JSON.stringify(attendance));
 function Probe(){auth=useAuth();location=useTechnicianLocation();return null;}
 const element=[MemoryRouter,LanguageProvider,AuthProvider,ShopProvider,WorkforceProvider,TechnicianLocationProvider].reduceRight((c,P)=>React.createElement(P,P===MemoryRouter?{initialEntries:['/technician/jobs'],future:{v7_startTransition:true,v7_relativeSplatPath:true}}:null,c),React.createElement(Probe));
 await act(async()=>{tree=Renderer.create(element);});assert.equal(location.checkedIn,true);
 act(()=>location.start());assert.equal(location.sharing,true);
 act(()=>position({coords:{latitude:28.6,longitude:77.4,accuracy:5}}));let point=readTechnicianLocation(member.id);assert.equal(point.lat,28.6);
 const job={id:'home-job',shopId:'shop_1',assignedTechId:member.id,customerId:customer.id,serviceMode:'home',workPhase:'Assigned'};
 assert.equal(liveLocationAllowed({viewer:owner,member,point,attendance}),true);
 assert.equal(liveLocationAllowed({viewer:customer,member,job,point,attendance}),true);
 assert.equal(liveLocationAllowed({viewer:{...customer,id:'other'},member,job,point,attendance}),false);
 assert.equal(liveLocationAllowed({viewer:customer,member,job:{...job,isPaid:true,workPhase:'Done'},point,attendance}),false);
 assert.equal(liveLocationAllowed({viewer:customer,member,job:{...job,serviceMode:'shop'},point,attendance}),false);
 assert.equal(liveLocationAllowed({viewer:owner,member,point:{...point,at:new Date(Date.now()-180000).toISOString()},attendance}),false);
 act(()=>position({coords:{latitude:28.61,longitude:77.41,accuracy:5}}));assert.equal(readTechnicianLocation(member.id).lat,28.61,'Moving GPS updates replace the map point');
 const entry=attendance.entries['shop_1:'+day+':'+member.id];entry.checkOut='19:00';store.set(ATTENDANCE_KEY,JSON.stringify(attendance));act(()=>window.dispatchEvent(new Event('technician-attendance-updated')));
 assert.equal(location.sharing,false);assert.equal(location.checkedIn,false);assert.equal(readTechnicianLocation(member.id).lat,undefined);assert.ok(cleared>0);
 act(()=>location.start());assert.equal(location.sharing,false,'Cannot restart after checkout');
 entry.checkOut='';store.set(ATTENDANCE_KEY,JSON.stringify(attendance));act(()=>window.dispatchEvent(new Event('technician-attendance-updated')));act(()=>location.start());act(()=>position({coords:{latitude:28.62,longitude:77.42,accuracy:5}}));
 act(()=>auth.logout());assert.equal(readTechnicianLocation(member.id).sharing,false);assert.equal(readTechnicianLocation(member.id).lat,undefined,'Logout removes coordinates immediately');
 assert.ok(store.get(locationKey(member.id)));
 console.log('Passed moving GPS, checked-in-only sharing, owner/customer job scoping, stale location hiding and immediate checkout/logout stop.');
}finally{await act(async()=>tree?.unmount());await server.close();}
