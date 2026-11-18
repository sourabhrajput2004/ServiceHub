import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};
globalThis.document={documentElement:{lang:'',dataset:{},style:{}},body:{style:{}},querySelector:()=>null};
const owner={id:'shop_1',shopId:'shop_1',role:'shop_owner',name:'Owner'};
const job={id:'BK-AUTO',shopId:'shop_1',customerName:'Customer',customerPhone:'9876543210',deviceBrand:'Phone',serviceMode:'home',serviceCoordinates:{lat:28.7,lng:77.4},status:'IN_PROGRESS',workPhase:'In Progress',assignedTechId:'tech',performedServices:[{id:'work1',serviceId:'srv',name:'Screen repair',labourCharge:300}],partRequests:[{id:'req1',inventoryItemId:'part',partName:'Screen',quantity:1,status:'Issued',sellingPrice:1500,batchAllocations:[]}]};
const shop={id:'shop_1',shopName:'Test Shop',coordinates:{lat:28.6,lng:77.4},homeServiceRatePerKm:10,services:[]};
storage.set('servicehub_user',JSON.stringify(owner));storage.set('servicehub_shops',JSON.stringify([shop]));storage.set('servicehub_bookings',JSON.stringify([job]));storage.set('servicehub_inventory',JSON.stringify([{id:'part',shopId:'shop_1',name:'Screen',sellingPrice:1500,stockQty:0,costPrice:1000,batches:[]}]));
let paid=false,created=0,paymentAmount=0;
const token='c'.repeat(64),record=()=>({id:'pi_auto',shopId:'shop_1',bookingId:job.id,amount:paymentAmount,status:paid?'paid':'pending',paymentId:paid?'pay_auto':null,paidAt:paid?Date.now():null,mode:'test',token,url:'http://localhost:3000/pay/'+token});
globalThis.fetch=async(path,options={})=>{let value;if(path.endsWith('/config'))value={configured:true,localOperatorLogin:true};else if(path.endsWith('/operator/login'))value={shopId:'shop_1'};else if(path.endsWith('/intents')){if(options.method==='POST'){created++;paymentAmount=Math.round(Number(JSON.parse(options.body).amount)*100);value=record();}else value={intents:created?[record()]:[]};}else if(path.includes('/guest/'))value=record();else throw Error('Unexpected path');return {ok:true,json:async()=>value};};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree,ctx;
try{
 const {ThemeProvider}=await server.ssrLoadModule('/src/context/ThemeContext.jsx'),{LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider,useShop}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{repairCharges}=await server.ssrLoadModule('/src/utils/repairCharges.js'),{invoiceDraft}=await server.ssrLoadModule('/src/components/seller/BillComposer.jsx'),{reopenRequestedRepair}=await server.ssrLoadModule('/src/db/reopenRequestedRepair.js');
 const charge=repairCharges(job,shop,[]);assert.equal(charge.error,'');assert.ok(charge.total>1800);assert.equal(charge.services.length,1);assert.equal(charge.parts.length,1);
 assert.ok(repairCharges({...job,partRequests:[{status:'Pending'}]},shop,[]).error);
 assert.ok(repairCharges({...job,serviceCoordinates:null},shop,[]).error);
 assert.deepEqual(repairCharges({...job,chargeSnapshot:charge},{...shop,homeServiceRatePerKm:999},[]),charge,'Published charge stays fixed');
 function Host(){ctx={s:useShop(),a:useAuth()};return null;}
 const element=[ThemeProvider,LanguageProvider,AuthProvider,ShopProvider].reduceRight((c,P)=>React.createElement(P,null,c),React.createElement(Host));
 await act(async()=>{tree=Renderer.create(element);});assert.equal(created,0,'No payment link during repair');
 await act(async()=>{ctx.s.patchWorkforceOrder(job.id,{status:'Ready for Pickup',workPhase:'Done'});});
 assert.equal(created,1);assert.equal(paymentAmount,Math.round(charge.total*100));assert.ok(ctx.s.bookings[0].chargeSnapshot);assert.equal(ctx.s.bookings[0].isPaid,undefined,'Link does not imply payment');
 const draft=invoiceDraft(null,ctx.s.bookings[0]);assert.equal(draft.services[0].name,'Screen repair');assert.equal(draft.parts[0].qty,1);assert.equal(draft.charges.homeService.amount,charge.charges.homeService.amount);
 await act(async()=>{paid=true;ctx.a.setUser(null);});await act(async()=>ctx.a.setUser(owner));
 assert.equal(ctx.s.bookings[0].isPaid,true,'Verified gateway capture automatically records payment');
 let invoice;await act(async()=>{invoice=ctx.s.createInvoice({...draft,shopId:'shop_1',bookingId:job.id});});assert.ok(invoice,ctx.s.invoiceError);assert.equal(invoice.grandTotal,charge.total);assert.equal(invoice.items.length,3);assert.equal(invoice.dueAmount,0);assert.equal(ctx.s.inventory[0].stockQty,0,'Approved part must not be deducted twice');assert.equal(created,1);
 const local=new Map([['servicehub_bookings',JSON.stringify([{...job,id:'BK-AC486959',status:'Ready for Pickup',workPhase:'Done'}])]]),mem={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};reopenRequestedRepair(mem);assert.equal(JSON.parse(local.get('servicehub_bookings'))[0].workPhase,'Assigned');assert.ok(local.get('servicehub_reopen_BK-AC486959_20261113_backup'));reopenRequestedRepair(mem);assert.equal(JSON.parse(local.get('servicehub_bookings'))[0].workflowEvents.filter(e=>e.status==='override').length,1);
 const {default:useAutomaticPaymentLink}=await server.ssrLoadModule('/src/hooks/useAutomaticPaymentLink.js');
 const {bookingCustomerEmail}=await server.ssrLoadModule('/src/utils/bookingCustomerEmail.js');
 storage.set('servicehub_accounts',JSON.stringify({customer:{id:'customer-1',role:'customer',email:'customer@example.com'}}));
 assert.equal(bookingCustomerEmail({customerId:'customer-1'}),'customer@example.com');
 assert.equal(bookingCustomerEmail({customerId:'different'}),'');
 assert.equal(bookingCustomerEmail({customerEmail:'saved@example.com',customerId:'customer-1'}),'saved@example.com');
 let technicianTree,technicianBooking;
 function TechnicianHost(){
  const [rows,setRows]=React.useState([{...job,status:'Ready for Pickup',workPhase:'Done'}]);
  technicianBooking=rows[0];
  useAutomaticPaymentLink({user:{id:'tech',shopId:'shop_1',role:'technician'},bookings:rows,shops:[shop],inventory:[],setBookings:setRows});
  return null;
 }
 await act(async()=>{technicianTree=Renderer.create(React.createElement(TechnicianHost));});
 assert.equal(created,2,'Assigned technician generates a link without an owner workspace');
 assert.equal(technicianBooking.paymentUrl,record().url);
 await act(async()=>technicianTree.unmount());
 console.log('Passed automatic Ready link, service/part/home totals, price snapshot, captured payment sync, prefilled paid invoice without double stock deduction and one-time requested job reset.');
}finally{await act(async()=>tree?.unmount());await server.close();}
