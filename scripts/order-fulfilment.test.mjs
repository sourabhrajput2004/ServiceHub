import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.window={addEventListener(){},removeEventListener(){}};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider,useShop}=await server.ssrLoadModule('/src/context/ShopContext.jsx');
 const {workStatus,deliveryQueue,homeCollectionAllowed,upiLink,validWhatsapp}=await server.ssrLoadModule('/src/utils/orderFulfilment.js');
 const {validateCustomerSignup}=await server.ssrLoadModule('/src/utils/signupValidation.js');
 const owner={id:'shop_1',shopId:'shop_1',role:'shop_owner',name:'Owner',email:'owner@test.in'},tech={id:'tech_test',shopId:'shop_1',role:'technician',status:'ACTIVE',name:'Tech',email:'tech@test.in'};
 store.set('servicehub_user',JSON.stringify(owner));store.set('servicehub_workforce_v1',JSON.stringify({members:[tech]}));
 let s,a,job,result,bill;function Probe(){s=useShop();a=useAuth();return null;}
 act(()=>tree=Renderer.create(React.createElement(AuthProvider,null,React.createElement(ShopProvider,null,React.createElement(Probe)))));
 act(()=>job=s.createBooking({shopId:'shop_1',customerName:'Customer',customerPhone:'9876543210',whatsappNumber:'9876543210',deviceBrand:'Phone',issueType:'Battery',serviceMode:'home',customerAddress:'42 Raj Nagar'}));
 assert.equal(workStatus(job),'Received');assert.equal(job.assignedTechId,null);
 act(()=>result=s.updateBookingStatus(job.id,'Diagnosing Issue',undefined,tech.id));assert.equal(result.success,true);assert.equal(workStatus(s.bookings.find(j=>j.id===job.id)),'Assigned to technician');
 act(()=>result=s.startOwnerRepair(job.id));assert.equal(result.success,true);assert.equal(workStatus(s.bookings.find(j=>j.id===job.id)),'Repairing');
 act(()=>result=s.updateBookingStatus(job.id,'Ready for Pickup'));assert.equal(result.success,true);
 let ready=s.bookings.find(j=>j.id===job.id);assert.equal(homeCollectionAllowed(ready,tech),true);assert.equal(homeCollectionAllowed({...ready,serviceMode:'shop'},tech),false);assert.equal(homeCollectionAllowed(ready,{...tech,id:'other'}),false);
 let queue=deliveryQueue([ready],[]);assert.equal(queue.length,2);assert.ok(queue.some(r=>r.kind==='Bill required'));assert.ok(queue.every(r=>!r.status.includes('Sent')));
 act(()=>a.setUser(tech));act(()=>result=s.collectHomeCash(job.id));assert.equal(result.success,false,'No guessed payment before final bill');
 act(()=>a.setUser(owner));act(()=>bill=s.createInvoice({shopId:'shop_1',bookingId:job.id,customerName:'Customer',customerPhone:'9876543210',items:[{name:'Repair',qty:1,rate:2500}],discount:0,paidAmount:0}));assert.ok(bill);
 assert.ok(upiLink('shop@bank','Shop',2500).startsWith('upi://pay?'));assert.equal(upiLink('', 'Shop',2500),'');assert.equal(s.invoices.find(i=>i.id===bill.id).dueAmount,2500,'Creating QR cannot record a payment');
 act(()=>a.setUser({...tech,id:'other'}));act(()=>result=s.collectHomeCash(job.id));assert.equal(result.success,false);
 act(()=>a.setUser(tech));act(()=>result=s.collectHomeCash(job.id));assert.equal(result.success,true);assert.equal(s.invoices.find(i=>i.id===bill.id).dueAmount,0);assert.equal(s.bookings.find(j=>j.id===job.id).status,'Delivered');assert.ok(s.invoices.find(i=>i.id===bill.id).audit.some(e=>e.action==='CASH_COLLECTED'));
 act(()=>result=s.collectHomeCash(job.id));assert.equal(result.success,false,'No double collection');assert.equal(deliveryQueue(s.bookings,s.invoices).filter(r=>r.id===bill.id+':receipt').length,1);
 assert.ok(validateCustomerSignup({name:'Test User',phone:'9876543210',email:'test@example.in',locality:'Raj Nagar',password:'Strong@123',confirmPassword:'Strong@123'}).whatsappNumber);assert.equal(validWhatsapp('123'),false);
 console.log('Passed assignment/start/ready sync, home-only assigned cash collection, invoice prerequisite, duplicate protection, audit, UPI pending, WhatsApp validation and notification handoff.');
}finally{act(()=>tree?.unmount());await server.close();}
