import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.document={body:{style:{}},documentElement:{lang:'',dataset:{},style:{}},querySelector(){return null;}};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {ThemeProvider}=await server.ssrLoadModule('/src/context/ThemeContext.jsx'),{LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider,useShop}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{WorkforceProvider,useWorkforce}=await server.ssrLoadModule('/src/context/WorkforceContext.jsx'),{SupportProvider}=await server.ssrLoadModule('/src/context/SupportContext.jsx');
 const {bookingGroup,canCustomerCancel,bookingIssues}=await server.ssrLoadModule('/src/utils/customerBookings.js'),{default:Customer}=await server.ssrLoadModule('/src/pages/customer/CustomerRepairRecords.jsx'),{default:Support}=await server.ssrLoadModule('/src/pages/customer/CustomerBookingSupport.jsx'),{useSupport}=await server.ssrLoadModule('/src/context/SupportContext.jsx');
 const customer={id:'customer-test',role:'customer',name:'Customer',email:'customer@test.in'},owner={id:'shop_1',shopId:'shop_1',role:'shop_owner',name:'Owner',email:'owner@test.in'};
 store.set('servicehub_user',JSON.stringify(customer));store.set('servicehub_bookings','[]');store.set('servicehub_invoices','[]');store.set('servicehub_support','[]');
 let a,s,support,view='repairs',first,second,result;function Host(){a=useAuth();s=useShop();support=useSupport();return view==='probe'?null:view==='support'?React.createElement(Support):React.createElement(Customer);}
 const element=[ThemeProvider,LanguageProvider,AuthProvider,ShopProvider,WorkforceProvider,SupportProvider].reduceRight((child,P)=>React.createElement(P,null,child),React.createElement(MemoryRouter,{initialEntries:['/support?booking=invalid&issue=cancellation'],future:{v7_startTransition:true,v7_relativeSplatPath:true}},React.createElement(Host)));
 act(()=>tree=Renderer.create(element,{createNodeMock:()=>({showModal(){},close(){},focus(){}})}));
 const text=n=>n.children.map(c=>typeof c==='string'?c:text(c)).join(''),job=id=>s.bookings.find(j=>j.id===id);
 act(()=>{first=s.createBooking({shopId:'shop_1',shopName:'Shop',customerName:'Customer',customerPhone:'9876543210',deviceBrand:'Test phone',issueType:'Battery',serviceMode:'shop'});second=s.createBooking({shopId:'shop_1',shopName:'Shop',customerName:'Customer',customerPhone:'9876543210',deviceBrand:'Second phone',issueType:'Battery',serviceMode:'shop'});});
 for(const label of ['All Bookings','Active Bookings','Completed Bookings','Cancelled Bookings'])assert.ok(text(tree.root).includes(label));
 assert.equal(canCustomerCancel(job(first.id),customer),true);assert.equal(canCustomerCancel(job(first.id),{...customer,id:'stranger'}),false);
 act(()=>result=s.cancelCustomerBooking(first.id));assert.equal(result.success,true);assert.equal(bookingGroup(job(first.id)),'cancelled');assert.ok(job(first.id).workflowEvents.some(e=>e.status==='cancelled'&&e.by===customer.id));assert.equal(s.bookings.length,2,'Cancellation preserves records');
 const fresh=JSON.parse(store.get('servicehub_bookings'));fresh.find(j=>j.id===second.id).assignedTechId='tech-1';store.set('servicehub_bookings',JSON.stringify(fresh));
 assert.equal(s.cancelCustomerBooking(second.id).success,false,'Fresh persisted assignment blocks stale customer cancellation');
 assert.equal(canCustomerCancel({...job(second.id),workflowEvents:[{status:'assigned'}]},customer),false,'Assignment history cannot be bypassed');
 view='support';act(()=>a.setUser({...customer}));const form=tree.root.findByType('form');act(()=>form.props.onSubmit({preventDefault(){}}));assert.ok(text(tree.root).includes('Select your booking.'));assert.ok(text(tree.root).includes('Describe your issue'));
 const selects=tree.root.findAllByType('select');act(()=>selects[0].props.onChange({target:{value:second.id}}));
 for(const [issue] of bookingIssues){assert.equal(support.createBookingQuery(second.id,issue,''),null,'Every category requires comment');assert.equal(support.createBookingQuery(second.id,issue,'short'),null);}
 act(()=>selects[1].props.onChange({target:{value:'other'}}));act(()=>tree.root.findByType('textarea').props.onChange({target:{value:'Please check this repair and call me.'}}));act(()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(support.threads.length,1);assert.equal(support.threads[0].bookingId,second.id);assert.equal(support.threads[0].shopId,'shop_1');assert.ok(support.threads[0].subject.startsWith('Other'));assert.equal(support.createBookingQuery('foreign','other','This is an invalid booking.'),null);
 view='probe';act(()=>a.setUser(owner));assert.equal(support.threads.length,1,'Shop owner receives customer query');assert.equal(support.createBookingQuery(second.id,'other','Owner cannot impersonate customer'),null);
 console.log('Passed booking filters, preserved cancellation/audit, fresh assignment race guard, ownership, required comments for every issue, Other query form and shop-owner routing.');
}finally{act(()=>tree?.unmount());await server.close();}
