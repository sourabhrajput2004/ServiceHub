import assert from 'node:assert/strict';
import React from 'react';import Renderer,{act} from 'react-test-renderer';import {createServer} from 'vite';
const data=new Map(),listeners=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};globalThis.window={addEventListener:(k,f)=>{listeners.set(f,k)},removeEventListener:(k,f)=>listeners.delete(f)};globalThis.document={body:{style:{}},documentElement:{dataset:{},style:{}}};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree,auth,support;
try{
const {AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{SupportProvider,useSupport}=await server.ssrLoadModule('/src/context/SupportContext.jsx');
const job={id:'JOB-1',shopId:'shop_1',shopName:'Shop One',customerId:'customer1',customerName:'Customer',assignedTechId:'tech1',status:'In Repair'};data.set('servicehub_bookings',JSON.stringify([job]));data.set('servicehub_workforce_v1',JSON.stringify({members:[{id:'tech1',shopId:'shop_1',role:'technician',status:'ACTIVE'}]}));
function Probe(){auth=useAuth();support=useSupport();return null;}
act(()=>{tree=Renderer.create(React.createElement(AuthProvider,null,React.createElement(ShopProvider,null,React.createElement(SupportProvider,null,React.createElement(Probe)))))});
const login=(role,id,shopId)=>act(()=>auth.setUser({role,id,shopId,email:id+'@test.in',name:id}));const image={image:'data:image/jpeg;base64,YWJj',imageName:'problem.jpg'};
login('technician','tech1','shop_1');let thread;act(()=>{thread=support.createThread(job,'Repair issue','Screen issue','ticket',image)});assert.ok(thread);assert.equal(support.threads[0].messages[0].image,image.image);
act(()=>assert.ok(support.send(thread,'',image)));assert.equal(support.threads[0].messages.length,2);
login('customer','customer1');assert.equal(support.threads.length,1);act(()=>assert.ok(support.send(thread,'Customer reply',image)));
login('shop_owner','shop_1','shop_1');assert.equal(support.threads.length,1);act(()=>assert.ok(support.send(thread,'Owner reply',image)));let report;act(()=>{report=support.createReport({type:'Feedback',subject:'Improve job support',description:'Please improve the job conversation features.'})});assert.ok(report);
login('admin','admin1');assert.equal(support.threads.length,0);act(()=>assert.ok(support.replyReport(report,'',image)));assert.equal(support.reports[0].messages.at(-1).image,image.image);
login('technician','wrong-tech','shop_1');assert.equal(support.threads.length,0);assert.equal(support.send(thread,'no'),false);assert.equal(support.createThread(job,'No access','not permitted'),null);
login('shop_owner','shop_2','shop_2');assert.equal(support.threads.length,0);assert.equal(support.replyReport(report,'no'),false);
login('customer','other-customer');assert.equal(support.threads.length,0);assert.equal(support.send(thread,'no'),false);
login('shop_owner','shop_1','shop_1');assert.equal(support.send(thread,'bad',{image:'javascript:bad'}),false);
act(()=>tree.unmount());data.set('servicehub_bookings',JSON.stringify([{...job,status:'Delivered',isPaid:true}]));data.set('servicehub_user',JSON.stringify({id:'tech1',role:'technician',shopId:'shop_1',email:'tech1@test.in'}));act(()=>{tree=Renderer.create(React.createElement(AuthProvider,null,React.createElement(ShopProvider,null,React.createElement(SupportProvider,null,React.createElement(Probe)))))});assert.equal(support.threads.length,0);assert.equal(support.send(thread,'completed access'),false);
console.log('PASS: image messages, owner/customer/admin replies, shared assigned-job technician support, role isolation, completed-job lockout.');
}finally{act(()=>tree?.unmount());await server.close();}
