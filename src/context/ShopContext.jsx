import {bookingCustomerEmail} from '../utils/bookingCustomerEmail';
import {paymentApi} from '../utils/paymentApi';
import useAutomaticPaymentLink from '../hooks/useAutomaticPaymentLink';
import {repairCharges} from '../utils/repairCharges';
import usePaymentSync from '../hooks/usePaymentSync';
import {technicianCheckIn} from '../utils/technicianCheckIn';
import {validHomeServiceRate} from '../utils/homeServiceCharge';
import {changeRestock} from '../utils/restockEditing';
import {reconcileBatches,receiveBatch,takeBatches,allocateBillBatches} from '../utils/inventoryBatches';
import {validShopCategories} from '../utils/shopCategories';

import {inventoryFamilies,familyKey,familyErrors} from '../utils/inventoryVariants';
import {canCustomerCancel} from '../utils/customerBookings';
import {withWorkflow,workflowStage,unpaidAge,workflowEvents} from '../utils/repairWorkflow';
import {homeCollectionAllowed,deliveryQueue} from '../utils/orderFulfilment';
import {shopTypes,validShopTypes,inventoryDomain} from '../utils/shopInventoryTypes';
import {partErrors,partKey,normalizePartDetails,cleanPartText} from '../utils/partsInventory';
import {serviceErrors,normalizeService} from '../utils/serviceCatalogue';
import {businessDate} from '../utils/workshopOverview';
import {repairLocationErrors,jobCardStatus,serviceMode} from '../utils/repairService';
import {staffDuty} from '../utils/workforceAccess';
import {cancelledInvoice,invoiceLocked,gstInvoice,billPayload,auditEntry,nextInvoiceNumber} from '../utils/invoiceLifecycle';
import {useAuth} from './AuthContext';
import {nameChangeAllowedAt,verificationEvent} from '../utils/sellerVerification';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ShopContext = createContext();

const INITIAL_SHOPS = [
  {
    id: 'shop_1',
    shopName: 'Rajan Mobile & Laptop Care',
    ownerName: 'Rajan Verma',
    phone: '9811223344',
    email: 'rajan.repair@gmail.com',
    locality: 'RDC, Raj Nagar, Ghaziabad',
    address: 'Shop No. 14, Ground Floor, Gaur Gravity Commercial, RDC Raj Nagar',
    coordinates: { lat: 28.6756, lng: 77.4421 },
    categories: ['Mobile Phones', 'Laptops & Computers', 'Tablets'],
    services: [],
    businessProofType: 'Udyam Registration (MSME)',
    businessProofNumber: 'UDYAM-UP-28-0045812',
    liveKycImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    shopFrontPhoto: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
    aiConfidenceScore: 92,
    verificationStatus: 'approved',
    rating: 4.8,
    reviewsCount: 142,
    registeredAt: '2026-09-12'
  },
  {
    id: 'shop_2',
    shopName: 'TechFix Electronics & Appliances',
    ownerName: 'Amit Sharma',
    phone: '9910554433',
    email: 'amit.techfix@gmail.com',
    locality: 'Indirapuram, Ghaziabad',
    address: 'Plot 45, Niti Khand 1, Near Shipra Mall, Indirapuram',
    coordinates: { lat: 28.6415, lng: 77.3712 },
    categories: ['Home Appliances', 'TV & Audio'],
    services: [],
    businessProofType: 'Shop & Establishment Act License',
    businessProofNumber: 'GZB-DL-2023-8991',
    liveKycImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    shopFrontPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    aiConfidenceScore: 89,
    verificationStatus: 'approved',
    rating: 4.6,
    reviewsCount: 98,
    registeredAt: '2026-10-05'
  }
];

export const ShopProvider = ({ children }) => {
  const {user}=useAuth()||{};
  const [shops, setShops] = useState(() => {
    const saved = localStorage.getItem('servicehub_shops');
    return (saved ? JSON.parse(saved) : INITIAL_SHOPS).map(shop=>({...shop,services:shop.services||[],shopTypes:shopTypes(shop)}));
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('servicehub_bookings');
    return saved?  JSON.parse(saved) : [];
  });

  const bookingsRef=useRef(bookings);bookingsRef.current=bookings;
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('servicehub_inventory');
    return saved?  JSON.parse(saved) : [];
  });

  const [technicians, setTechnicians] = useState(() => {
    const saved = localStorage.getItem('servicehub_technicians');
    return saved?  JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('servicehub_invoices');
    return saved?  JSON.parse(saved) : [];
  });

  usePaymentSync({user,bookings,invoices,setBookings,setInvoices});
  useAutomaticPaymentLink({user,bookings,shops,inventory,setBookings});
  const inventoryRef=useRef(inventory);inventoryRef.current=inventory;
  const invoiceRef=useRef(invoices);invoiceRef.current=invoices;
  const [invoiceError,setInvoiceError]=useState('');
  useEffect(() => {
    localStorage.setItem('servicehub_shops', JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem('servicehub_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('servicehub_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('servicehub_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('servicehub_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Keep the local demo workspaces synchronized between tabs.
  useEffect(()=>{const listener=event=>{const setters={servicehub_shops:setShops,servicehub_bookings:setBookings,servicehub_inventory:setInventory,servicehub_technicians:setTechnicians,servicehub_invoices:setInvoices};if(setters[event.key]&&event.newValue){try{const value=JSON.parse(event.newValue);if(Array.isArray(value))setters[event.key](value);}catch{}}};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[]);

  // Shop Owner Registration
  const registerShop = (newShopData) => {
    if(!validShopTypes(newShopData.shopTypes))throw Error('Choose one or both shop types.');
    if(newShopData.categories!==undefined&&!validShopCategories(newShopData.categories))throw Error('Choose at least one valid shop category.');
    let score = 50;
    if (newShopData.liveKycImage && newShopData.liveKycImage.startsWith('data:image')) score += 25;
    if (newShopData.businessProofNumber && newShopData.businessProofNumber.length >= 6) score += 15;
    if (newShopData.coordinates && newShopData.coordinates.lat) score += 10;
    score = Math.min(96, Math.max(72, score + Math.floor(Math.random() * 8) - 2));

    const shop = {
      id: 'shop_' + Date.now(),
      ...newShopData,categories:[...(newShopData.categories||[])],shopTypes:[...newShopData.shopTypes],
      aiConfidenceScore: score,
      verificationStatus: 'pending',
      rating: 5.0,
      reviewsCount: 0,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    setShops(prev => [shop, ...prev]);
    return shop;
  };

  const approveShop = (shopId) => {
    setShops(prev =>
      prev.map(shop =>
        shop.id === shopId ? { ...shop, verificationStatus: 'approved', businessProofReviewedAt: new Date().toISOString(),verificationHistory:[...(shop.verificationHistory||[]),verificationEvent('Admin review','approved','Approval recorded in ServiceHub.',false)] } : shop
      )
    );
  };

  const rejectShop = (shopId, reason) => {
    setShops(prev =>
      prev.map(shop =>
        shop.id === shopId
          ? { ...shop, verificationStatus: 'rejected', rejectionReason: reason,reapplyAt:new Date(Date.now()+30*86400000).toISOString(),verificationHistory:[...(shop.verificationHistory||[]),verificationEvent('Admin review','rejected',reason,false)] }
          : shop
      )
    );
  };

  // Customer Booking
  const createBooking = (bookingData) => {
    let customerId=bookingData.customerId;try{if(user?.role==='customer')customerId=user.id;else if(!customerId)customerId=Object.values(JSON.parse(localStorage.getItem('servicehub_accounts')||'{}')).find(a=>a.role==='customer'&&a.phone===bookingData.customerPhone)?.id;}catch{}
    const newBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      ...bookingData,
      customerEmail:user?.role==='customer'?(user.email||''):(bookingData.customerEmail||bookingCustomerEmail({customerId})),
      customerId,createdByName:user?.name||'Customer',workflowEvents:[{id:crypto.randomUUID(),status:'booked',at:new Date().toISOString(),by:user?.id||null,byName:user?.name||'Customer'}],
      assignedTechId:null,assignedTechName:null,assignedToOwner:false,assignedAt:null,workPhase:null,deliveryMemberId:null,pickupMode:'none',
      status: 'Request Received',
      createdAt:new Date().toISOString(),createdBy:user?.id,orderAudit:[auditEntry(user,'ORDER_CREATED')],
      bookingDate: new Date().toISOString().split('T')[0],
      statusHistory: [
        { step: 'Request Booked', timestamp: 'Just now', done: true },
        { step: 'Device Received at Shop', timestamp: '', done: false },
        { step: 'Diagnosing Issue', timestamp: '', done: false },
        { step: 'Waiting for Parts', timestamp: '', done: false },
        { step: 'Repaired & QC Tested', timestamp: '', done: false },
        { step: 'Ready for Pickup', timestamp: '', done: false }
      ],
      isPaid: false
    };

    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  // Shop Owner: Update Job status & optional technician assignment
  const updateBookingStatus=(bookingId,nextStatus,unusedCost,assignedTechId,options={})=>{
    const job=bookings.find(j=>j.id===bookingId),shopId=job?.shopId||'shop_1';if(!job||job.archivedAt||!canBill(shopId))return {success:false,error:'Only the owner or counter staff can assign this Job Card.'};
    if(nextStatus&&!['Request Received','Device Received at Shop','Diagnosing Issue','Waiting for Parts','Repaired & QC Tested','Ready for Pickup','Completed','Delivered','IN_PROGRESS'].includes(nextStatus))return {success:false,error:'Choose a valid Job Card status.'};const stage=jobCardStatus({status:nextStatus||job.status}),current=jobCardStatus(job);if(current==='Delivered'&&stage!=='Delivered')return {success:false,error:'Delivered Job Cards cannot be moved back.'};if(stage==='Received'&&current!=='Received')return {success:false,error:'Work has already been allocated. Keep its repair history.'};if(stage==='Ready'&&!['In Repair','Ready'].includes(current))return {success:false,error:'Start In Repair and allocate the work before marking it Ready.'};if(stage==='Delivered'&&!['Ready','Delivered'].includes(current))return {success:false,error:'Mark the repair Ready before delivery.'};
    if(job.startedAt||job.onWayAt){if(stage!=='In Repair'||assignedTechId&&assignedTechId!==job.assignedTechId&&!(assignedTechId==='owner'&&job.assignedToOwner))return {success:false,error:'Use the owner override with a reason to change work already started.'};}
    let members=[];try{members=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members||[];}catch{}const eligible=members.filter(m=>m.shopId===shopId&&m.role==='technician'&&m.status==='ACTIVE'&&m.availability!=='Off'&&!m.legacy);let chosen=assignedTechId||job.assignedTechId,own=assignedTechId==='owner'||(!assignedTechId&&job.assignedToOwner);if(stage==='In Repair'&&!chosen&&eligible.filter(m=>technicianCheckIn(m).allowed).length===1)chosen=eligible.find(m=>technicianCheckIn(m).allowed).id;const tech=eligible.find(m=>m.id===chosen);if(stage==='In Repair'&&(own||!tech))return {success:false,error:'Choose an active checked-in technician before starting In Repair.'};
    if(stage==='In Repair'&&!own&&tech&&(job.assignedTechId!==tech.id||current!=='In Repair')){const check=technicianCheckIn(tech);if(!check.allowed)return {success:false,error:check.reason};}
    const home=serviceMode(job)==='home',pickup=home?'technician':'none',deliveryId=null;
    if(home&&own)return {success:false,error:'Home service must be assigned to a technician. The owner is available only for shop service.'};
    if(stage==='In Repair'&&home&&!job.customerAddress?.trim())return {success:false,error:'Add the home-service address before assigning the visit.'};
    const now=new Date().toISOString(),id=own?shopId:chosen,changed=stage==='In Repair'&&(job.assignedTechId!==id||current!=='In Repair'),patch={status:nextStatus||job.status,pickupMode:stage==='Received'?'none':pickup,deliveryMemberId:stage==='Received'?null:deliveryId,...(stage==='Received'?{assignedTechId:null,assignedTechName:null,assignedToOwner:false}:stage==='In Repair'?{assignedTechId:id,assignedTechName:own?(shops.find(s=>s.id===shopId)?.ownerName||user.name):tech.name,assignedToOwner:own,assignedAt:changed?now:job.assignedAt,workPhase:changed?'Assigned':job.workPhase||'Assigned',...(changed?{startedAt:null,completedAt:null,onWayAt:null}:{} )}:{}),...(['Ready','Delivered'].includes(stage)?{workPhase:'Done',completedAt:job.completedAt||now}:{}),updatedAt:now};
    setBookings(prev=>prev.map(j=>j.id===bookingId?{...withWorkflow(j,patch,user),statusHistory:(j.statusHistory||[]).map(h=>h.step===nextStatus?{...h,done:true,timestamp:now}:h),orderAudit:[...(j.orderAudit||[]),auditEntry(user,changed?'WORK_ASSIGNED':'STATUS_UPDATED',{status:patch.status,technician:patch.assignedTechName||job.assignedTechName,pickupMode:pickup})]}:j));return {success:true,assignedTechId:patch.assignedTechId||job.assignedTechId};
  };

  // ---------------- INVENTORY OPERATIONS ----------------
  const inventoryAccess=shopId=>{if(user?.role==='shop_owner')return (user.shopId||user.id)===shopId;try{const m=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===user?.id);return user?.role==='staff'&&m?.status==='ACTIVE'&&m.shopId===shopId&&m.shopId===user.shopId&&staffDuty(m)==='Inventory Management';}catch{return false;}};
  const stockEvent=(type,qty,price,reason,extra={})=>({id:crypto.randomUUID(),type,qty,price:Number(price)||0,reason,at:new Date().toISOString(),by:user?.name||'Unknown',actorId:user?.id,...extra});
  const commitInventory=next=>{next=next.map(reconcileBatches);try{localStorage.setItem('servicehub_inventory',JSON.stringify(next));inventoryRef.current=next;setInventory(next);return {success:true};}catch{return {success:false,error:'Unable to save inventory. Free browser storage and retry.'};}};
  const saveInventoryPart=(id,input)=>{const shopId=input.shopId||user?.shopId||user?.id;if(user?.role!=='shop_owner'||!inventoryAccess(shopId))return {success:false,error:'Only the owner can add or edit part details.'};const old=id?inventoryRef.current.find(p=>p.id===id&&(p.shopId||'shop_1')===shopId&&!p.archivedAt):null;if(id&&!old)return {success:false,error:'Part unavailable.'};const targetShop=shops.find(s=>s.id===shopId);const data={...normalizePartDetails(input),variant:cleanPartText(input.variant),inventoryDomain:input.inventoryDomain||(shopTypes(targetShop).length===1?shopTypes(targetShop)[0]:''),restockQty:Number(input.restockQty||0),category:normalizePartDetails(input).partType};delete data.batches;const errors=partErrors(data,targetShop);if(Object.keys(errors).length)return {success:false,error:Object.values(errors)[0],errors};if(inventoryRef.current.some(p=>!p.archivedAt&&(p.shopId||'shop_1')===shopId&&p.id!==id&&p.brand&&partKey({...p,inventoryDomain:p.inventoryDomain||inventoryDomain(p,targetShop)})===partKey(data)))return {success:false,error:'Already exists, stock update karo.'};const siblings=inventoryRef.current.filter(p=>!p.archivedAt&&(p.shopId||'shop_1')===shopId&&familyKey(p,targetShop)===familyKey(data,targetShop));if(!old&&siblings.length>=10)return {success:false,error:'Keep between 1 and 10 variants per part.'};if(!old&&siblings.some(v=>v.parentId))data.parentId=siblings.find(v=>v.parentId).parentId;if(old&&Number(data.stockQty)!==Number(old.stockQty))return {success:false,error:'Use Stock In or Adjustment to change quantity with a reason.'};const next={...old,...data,id:id||'part_'+crypto.randomUUID(),shopId,stockQty:Number(data.stockQty),minThreshold:Number(data.minThreshold),costPrice:Number(data.costPrice),sellingPrice:Number(data.sellingPrice),image:data.image||'',history:[...(old?.history||[]),stockEvent(old?'DETAILS_UPDATED':'PURCHASE',old?0:Number(data.stockQty),data.costPrice,old?'Part details updated':'Opening stock',{sellingPrice:Number(data.sellingPrice)})]};return commitInventory(old?inventoryRef.current.map(p=>p.id===id?next:p):[next,...inventoryRef.current]);};
  // Keep stable variant IDs so existing invoices and stock movements remain valid.
  const saveInventoryFamily=(familyId,parent,variants)=>{
    refreshBills();const shopId=parent.shopId||user?.shopId||user?.id,targetShop=shops.find(v=>v.id===shopId);
    if(user?.role!=='shop_owner'||!inventoryAccess(shopId))return {success:false,error:'Only the owner can edit parts and variants.'};
    const groups=inventoryFamilies(inventoryRef.current.filter(p=>(p.shopId||'shop_1')===shopId),targetShop),existing=groups.find(p=>p.id===familyId),active=existing?.variants.filter(v=>!v.archivedAt)||[];
    if(familyId&&!existing)return {success:false,error:'Part unavailable.'};
    if(active.some(v=>!variants.some(r=>r.id===v.id)))return {success:false,error:'Use Remove Variant to remove an existing variant.'};
    if(variants.some(v=>v.id&&!active.some(a=>a.id===v.id)))return {success:false,error:'Variant unavailable for this part.'};
    if(variants.some(v=>v.id&&(v.history?.at(-1)?.id||'')!==(active.find(a=>a.id===v.id)?.history?.at(-1)?.id||'')))return {success:false,error:'Stock changed while this form was open. Close and reopen it before saving.'};
    const cleaned=normalizePartDetails(parent);const data={...cleaned,shopId,inventoryDomain:parent.inventoryDomain||(shopTypes(targetShop).length===1?shopTypes(targetShop)[0]:''),name:cleaned.brand==='Universal'?cleaned.name:[cleaned.model,cleaned.partType].filter(Boolean).join(' ')};
    delete data.batches;const validation=familyErrors(data,variants,targetShop);if(!validation.valid)return {success:false,error:'Check the highlighted fields.',validation};
    if(groups.some(p=>p.id!==familyId&&p.variants.some(v=>!v.archivedAt)&&familyKey(p,targetShop)===familyKey(data,targetShop)))return {success:false,error:'This part already exists. Add a variant to its card.'};
    const parentId=existing?.variants.find(v=>v.parentId)?.parentId||'part_group_'+crypto.randomUUID(),updated=variants.map(v=>{
      const old=active.find(a=>a.id===v.id),quantity=Number(v.stockQty),changed=old&&quantity!==Number(old.stockQty);
      return {...old,...data,id:old?.id||'part_'+crypto.randomUUID(),parentId,variant:cleanPartText(v.variant),costPrice:Number(v.costPrice),sellingPrice:Number(v.sellingPrice),warrantyDays:Number(v.warrantyDays),stockQty:quantity,minThreshold:Number(v.minThreshold),restockQty:Number(v.restockQty),category:data.partType,history:[...(old?.history||[]),stockEvent(old?(changed?'ADJUSTMENT':'DETAILS_UPDATED'):'PURCHASE',old?quantity-Number(old.stockQty):quantity,v.costPrice,old?'Variant updated by owner':'Opening stock',{balance:quantity,sellingPrice:Number(v.sellingPrice)})]};
    });
    const ids=new Set(active.map(v=>v.id));return commitInventory([...updated,...inventoryRef.current.filter(v=>!ids.has(v.id))]);
  };
  const removeInventoryFamily=(familyId,shopId,reason)=>{
    refreshBills();if(user?.role!=='shop_owner'||!inventoryAccess(shopId))return {success:false,error:'Only the owner can delete parts.'};
    const group=inventoryFamilies(inventoryRef.current.filter(p=>(p.shopId||'shop_1')===shopId),shops.find(s=>s.id===shopId)).find(p=>p.id===familyId);
    if(!group||String(reason||'').trim().length<3)return {success:false,error:'Enter a removal reason (at least 3 characters).'};
    const ids=new Set(group.variants.map(v=>v.id)),next=[];for(const v of inventoryRef.current){if(!ids.has(v.id))next.push(v);else if(inventoryPartReferenced(v))next.push({...v,archivedAt:v.archivedAt||new Date().toISOString(),history:[...(v.history||[]),stockEvent('REMOVED',0,v.costPrice,reason)]});}return commitInventory(next);
  };
  const addInventoryItem=item=>saveInventoryPart(null,item);
  const moveStock=(id,type,qty,price,reason,details={})=>{const p=inventoryRef.current.find(p=>p.id===id&&!p.archivedAt);if(!p||!inventoryAccess(p.shopId||'shop_1'))return {success:false,error:'Inventory access unavailable.'};if(type==='in'&&details.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(details.date)||!Number.isFinite(Date.parse(details.date))||details.date>new Date().toLocaleDateString('en-CA')))return {success:false,error:'Choose a valid restock date, today or earlier.'};const n=Number(qty);if(!Number.isSafeInteger(n)||n<0||(type!=='adjust'&&n<1))return {success:false,error:'Enter a valid whole quantity.'};if(type!=='in'&&user?.role!=='shop_owner')return {success:false,error:'Only the owner can adjust or deduct stock.'};if(!['in','out','adjust'].includes(type))return {success:false,error:'Choose a valid stock action.'};if(type!=='in'&&String(reason||'').trim().length<3)return {success:false,error:'A reason is required.'};const changesSellingPrice=type==='in'&&details.sellingPrice!==undefined;if(changesSellingPrice&&user?.role!=='shop_owner')return {success:false,error:'Only the owner can change selling prices.'};if(changesSellingPrice&&(details.sellingPrice===''||!Number.isFinite(Number(details.sellingPrice))||Number(details.sellingPrice)<0))return {success:false,error:'Enter a valid selling price.'};const current=Number(p.stockQty),nextQty=type==='in'?current+n:type==='out'?current-n:n;if(nextQty<0)return {success:false,error:'Not enough stock.'};const unit=price===''||price===undefined?Number(p.costPrice):Number(price);if(!Number.isFinite(unit)||unit<0)return {success:false,error:'Enter a valid purchase price.'};const moved=type==='in'?receiveBatch(p,n,unit,details.date):takeBatches(p,Math.max(0,current-nextQty)).part;const sell=changesSellingPrice?Number(details.sellingPrice):Number(p.sellingPrice);return commitInventory(inventoryRef.current.map(v=>v.id===id?{...moved,stockQty:nextQty,costPrice:type==='in'?unit:v.costPrice,sellingPrice:sell,history:[...(v.history||[]),stockEvent(type==='in'?'PURCHASE':type==='out'?'WASTAGE':'ADJUSTMENT',nextQty-current,unit,reason||'Stock received',{balance:nextQty,...(type==='in'?{batchId:moved.batches.at(-1)?.id,sellingPrice:sell,previousSellingPrice:p.sellingPrice,supplier:String(details.supplier||'').trim(),receivedDate:details.date||new Date().toISOString().slice(0,10)}:{})})]}:v));};

  const updateRestockEntry=(partId,entryId,input,remove=false)=>{refreshBills();const part=inventoryRef.current.find(p=>p.id===partId&&!p.archivedAt);if(!part||user?.role!=='shop_owner'||(user.shopId||user.id)!==(part.shopId||'shop_1'))return {success:false,error:'Only the owner can edit stock records.'};const result=changeRestock(part,entryId,input,{remove,actor:user.name});if(!result.success)return result;return commitInventory(inventoryRef.current.map(p=>p.id===partId?result.part:p));};
  const inventoryPartReferenced=p=>invoiceRef.current.some(i=>(i.shopId||'shop_1')===(p.shopId||'shop_1')&&(i.items||[]).some(v=>v.isInventoryPart&&(v.inventoryItemId===p.id||(!v.inventoryItemId&&v.name===p.name))))||bookings.some(o=>(o.partRequests||[]).some(r=>r.inventoryItemId===p.id))||shops.some(s=>(s.services||[]).some(v=>v.linkedPartIds?.includes(p.id)));
  const removeInventoryPart=(id,reason)=>{refreshBills();const p=inventoryRef.current.find(v=>v.id===id);if(!p||user?.role!=='shop_owner'||(user.shopId||user.id)!==(p.shopId||'shop_1'))return {success:false,error:'Only the owner can delete parts.'};if(String(reason||'').trim().length<3)return {success:false,error:'Enter a removal reason.'};const referenced=inventoryPartReferenced(p);return commitInventory(referenced?inventoryRef.current.map(v=>v.id===id?{...v,archivedAt:new Date().toISOString(),history:[...(v.history||[]),stockEvent('REMOVED',0,v.costPrice,reason)]}:v):inventoryRef.current.filter(v=>v.id!==id));};

  const updateInventoryStock=(id,qty,reason)=>moveStock(id,'adjust',qty,undefined,reason);
  const restockInventoryItem=(id,qty,price)=>moveStock(id,'in',qty,price,'Stock received');
  const deductInventoryStock=()=>({success:false,error:'Use a bill, approved request or a reasoned adjustment.'});

  const handledRequests=useRef(new Set());
  const issueRepairPart=(orderId,values)=>{
    const rows=bookingsRef.current,order=rows.find(o=>o.id===orderId),qty=Number(values.quantity);
    const legacy=values.requestId&&order?.partRequests?.find(r=>r.id===values.requestId),ownerIssuing=legacy&&user?.role==='shop_owner'&&(user.shopId||user.id)===(order?.shopId||'shop_1');
    if(legacy&&['Approved','Issued'].includes(legacy.status))return {success:true};
    if(values.requestId&&(!legacy||!['Pending','Acknowledged'].includes(legacy.status)||legacy.inventoryItemId!==values.inventoryItemId||Number(legacy.quantity)!==qty))return {success:false,error:'Part record unavailable.'};
    if(!order||order.archivedAt||(!ownerIssuing&&(user?.role!=='technician'||order.assignedTechId!==user.id||(order.shopId||'shop_1')!==user.shopId))||!(workflowStage(order)==='repairing'||legacy&&workflowStage(order)==='payment_due'))return {success:false,error:'Only the assigned technician can add parts while repairing.'};
    if(order.paymentIntentId||order.isPaid||invoiceRef.current.some(i=>i.bookingId===orderId&&!cancelledInvoice(i)))return {success:false,error:'The bill or payment amount is locked.'};
    if(!Number.isInteger(qty)||qty<1||qty>100)return {success:false,error:'Enter a quantity between 1 and 100.'};
    const current=inventoryRef.current,part=current.find(p=>p.id===values.inventoryItemId&&!p.archivedAt&&(p.shopId||'shop_1')===(order.shopId||'shop_1'));
    if(!part||Number(part.stockQty)<qty)return {success:false,error:'Part unavailable or not enough stock.'};
    const text=String(values.text||'').trim();if(text.length>1000)return {success:false,error:'Use up to 1000 characters.'};
    const id=legacy?.id||crypto.randomUUID(),at=legacy?.at||new Date().toISOString(),issued=takeBatches(part,qty),entry={...legacy,id,inventoryItemId:part.id,partName:part.name,variant:part.variant,warrantyDays:part.warrantyDays,sellingPrice:Number(part.sellingPrice),quantity:qty,status:'Issued',batchAllocations:issued.allocations,text:legacy?.text||text,by:legacy?.by||user.id,byName:legacy?.byName||user.name,at};
    const nextStock=current.map(p=>p.id===part.id?{...issued.part,history:[...(p.history||[]),stockEvent('TECHNICIAN_ISSUE',-qty,p.costPrice,'Part used in repair',{orderId,requestId:id,balance:Number(p.stockQty)-qty})]}:p).map(reconcileBatches);
    const nextOrders=(rows.length?rows:bookings).map(o=>o.id===orderId?{...order,updatedAt:at,partRequests:legacy?(order.partRequests||[]).map(r=>r.id===legacy.id?entry:r):[...(order.partRequests||[]),entry]}:o),oldStock=localStorage.getItem('servicehub_inventory'),oldOrders=localStorage.getItem('servicehub_bookings');
    try{localStorage.setItem('servicehub_inventory',JSON.stringify(nextStock));localStorage.setItem('servicehub_bookings',JSON.stringify(nextOrders));}catch{try{if(oldStock!==null)localStorage.setItem('servicehub_inventory',oldStock);if(oldOrders!==null)localStorage.setItem('servicehub_bookings',oldOrders);}catch{}return {success:false,error:'Unable to save part usage. Please retry.'};}
    inventoryRef.current=nextStock;bookingsRef.current=nextOrders;setInventory(nextStock);setBookings(nextOrders);return {success:true};
  };
  const resolvePartRequest=(orderId,requestId,approved,reason='')=>{const order=bookings.find(o=>o.id===orderId),r=order?.partRequests?.find(r=>r.id===requestId);if(!order||order.archivedAt||user?.role!=='shop_owner'||(user.shopId||user.id)!==(order.shopId||'shop_1')||!r||!['Pending','Acknowledged'].includes(r.status)||handledRequests.current.has(requestId))return {success:false,error:'Only the owner can review a pending request.'};if(!approved&&reason.trim().length<3)return {success:false,error:'Enter a rejection reason.'};let stock=inventoryRef.current,issuedAllocations=[];if(approved){if(order.paymentIntentId||order.isPaid)return {success:false,error:'Payment amount is locked. Parts cannot be changed.'};if(invoiceRef.current.some(i=>i.bookingId===orderId&&!cancelledInvoice(i)))return {success:false,error:'This job already has a bill. Review the bill before issuing more parts.'};const part=stock.find(p=>p.id===r.inventoryItemId&&!p.archivedAt&&(p.shopId||'shop_1')===(order.shopId||'shop_1'));if(!part||part.stockQty<Number(r.quantity))return {success:false,error:'Requested part is unavailable or stock is insufficient.'};const issued=takeBatches(part,Number(r.quantity));issuedAllocations=issued.allocations;stock=stock.map(p=>p.id===part.id?{...issued.part,history:[...(p.history||[]),stockEvent('TECHNICIAN_ISSUE',-Number(r.quantity),p.costPrice,'Approved parts request',{orderId,requestId,balance:p.stockQty-Number(r.quantity)})]}:p);const saved=commitInventory(stock);if(!saved.success)return saved;}handledRequests.current.add(requestId);setBookings(prev=>prev.map(o=>o.id===orderId?{...o,partRequests:o.partRequests.map(v=>v.id===requestId?{...v,status:approved?'Approved':'Rejected',...(approved?{batchAllocations:issuedAllocations,sellingPrice:inventoryRef.current.find(p=>p.id===r.inventoryItemId)?.sellingPrice,variant:inventoryRef.current.find(p=>p.id===r.inventoryItemId)?.variant,warrantyDays:inventoryRef.current.find(p=>p.id===r.inventoryItemId)?.warrantyDays}:{}),reviewedBy:user.name,reviewedAt:new Date().toISOString(),rejectionReason:approved?'':reason.trim()}:v)}:o));return {success:true};};

  // ---------------- TECHNICIAN OPERATIONS ----------------
  const addTechnician = (tech) => {
    const newTech = {
      id: 'tech_' + Date.now(),
      ...tech,
      status: 'Available',
      rating: 5.0,
      completedJobs: 0,
      currentLocation: {
        area: 'In Shop (RDC Raj Nagar)',
        lat: 28.6756,
        lng: 77.4421,
        lastUpdated: 'Just now'
      }
    };
    setTechnicians(prev => [...prev, newTech]);
  };

  const updateTechnicianLocation = (techId, areaName, lat, lng, newStatus, activeTask) => {
    setTechnicians(prev =>
      prev.map(tech => {
        if (tech.id === techId) {
          return {
            ...tech,
            status: newStatus || tech.status,
            ...(activeTask !== undefined && { activeTask }),
            currentLocation: {
              area: areaName || tech.currentLocation.area,
              lat: lat || tech.currentLocation.lat,
              lng: lng || tech.currentLocation.lng,
              lastUpdated: 'Just now'
            }
          };
        }
        return tech;
      })
    );
  };

  // ---------------- BILLING & INVOICING ----------------
  const canBill=shopId=>{
    if(user?.role==='shop_owner')return shopId===(user.shopId||user.id);
    if(user?.role!=='staff')return false;
    try{const m=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===user.id);return m?.status==='ACTIVE'&&m.role==='staff'&&m.shopId===shopId&&m.shopId===user.shopId&&staffDuty(m)==='Counter & Billing';}catch{return false;}
  };
  const refreshBills=()=>{try{const stock=JSON.parse(localStorage.getItem('servicehub_inventory')||'null');if(Array.isArray(stock))inventoryRef.current=stock;const saved=JSON.parse(localStorage.getItem('servicehub_invoices')||'null');if(Array.isArray(saved))invoiceRef.current=saved;}catch{}};
  const stockForBill=(items,shopId,previous=[],reference={},credits=[])=>{
    const current=inventoryRef.current,resolve=(line,historical=false)=>{if(!line.isInventoryPart)return {...line,isInventoryPart:false};const product=current.find(p=>(p.shopId||'shop_1')===shopId&&(line.inventoryItemId?p.id===line.inventoryItemId:p.name===line.name));if(!product||(!historical&&product.archivedAt))throw Error('The selected stock part is unavailable.');if(!historical){const savedRates=reference.preservePartRates?(reference.rateItems||previous).filter(v=>v.isInventoryPart&&(v.inventoryItemId===product.id||(!v.inventoryItemId&&v.name===product.name))):[];if(savedRates.length?!savedRates.some(v=>Number(v.rate)===Number(line.rate)):Number(line.rate)!==Number(product.sellingPrice))throw Error('Spare part prices are locked. Use the inventory selling price.');}return {...line,name:historical?line.name:product.name,inventoryItemId:product.id,variant:historical||reference.preservePartRates?line.variant??product.variant:product.variant,warrantyDays:historical||reference.preservePartRates?line.warrantyDays??product.warrantyDays:product.warrantyDays};},resolved=items.map(p=>resolve(p)),old=previous.filter(p=>p.isInventoryPart).map(p=>resolve(p,true)),needed=new Map(),returned=new Map(),allocated=new Map();resolved.filter(p=>p.isInventoryPart).forEach(p=>needed.set(p.inventoryItemId,(needed.get(p.inventoryItemId)||0)+Number(p.qty)));old.forEach(p=>returned.set(p.inventoryItemId,(returned.get(p.inventoryItemId)||0)+Number(p.qty)));credits.forEach(p=>allocated.set(p.inventoryItemId,(allocated.get(p.inventoryItemId)||0)+Number(p.qty)));for(const [id,qty]of needed){const available=Number(current.find(p=>p.id===id)?.stockQty)+(returned.get(id)||0)+(allocated.get(id)||0);if(qty>available)throw Error('Sirf '+available+' stock mein hai, '+qty+' chahiye. Bill generate nahi hua.');}
    const batched=allocateBillBatches(current,resolved,old,credits);return {items:batched.items,stock:batched.stock.map(p=>{const out=needed.get(p.id)||0,back=returned.get(p.id)||0,credit=Math.min(allocated.get(p.id)||0,out),delta=back-out+credit;if(!out&&!back)return p;const originalQty=Number(current.find(v=>v.id===p.id)?.stockQty||0),history=[...(p.history||[])];if(back)history.push(stockEvent('BILL_RETURN',back,p.costPrice,'Bill cancellation / correction',{...reference,balance:originalQty+back}));if(out-credit>0)history.push(stockEvent('BILL_OUT',-(out-credit),resolved.find(i=>i.inventoryItemId===p.id)?.rate,'Used in bill',{...reference,balance:Number(p.stockQty)}));if(credit)history.push(stockEvent('ISSUED_TO_BILL',0,p.costPrice,'Already issued '+credit+' pcs; no second deduction',reference));return {...p,history};})};
  };
  const commitBills=(next,stock)=>{const oldBills=localStorage.getItem('servicehub_invoices'),oldStock=localStorage.getItem('servicehub_inventory');try{if(stock)localStorage.setItem('servicehub_inventory',JSON.stringify(stock));localStorage.setItem('servicehub_invoices',JSON.stringify(next));invoiceRef.current=next;setInvoices(next);if(stock){inventoryRef.current=stock;setInventory(stock);}setInvoiceError('');return true;}catch{try{if(oldBills!==null)localStorage.setItem('servicehub_invoices',oldBills);if(oldStock!==null)localStorage.setItem('servicehub_inventory',oldStock);}catch{}setInvoiceError('Unable to save billing records. Please free browser storage and retry.');return false;}};
  const attachPaymentLink=(bookingId,record)=>{
    const job=bookings.find(j=>j.id===bookingId);
    if(user?.role!=='shop_owner'||!job||(user.shopId||user.id)!==(job.shopId||'shop_1')||record.bookingId!==job.id||record.shopId!==(job.shopId||'shop_1'))return false;
    setBookings(rows=>rows.map(j=>j.id===bookingId?{...j,paymentToken:record.token,paymentIntentId:record.id,paymentUrl:record.url,paymentAmountDue:record.amount/100,chargeSnapshot:repairCharges(j,shops.find(s=>s.id===(j.shopId||'shop_1')),inventoryRef.current)}:j));return true;
  };
  const recordLinkedCash=async(orderId,amount)=>{
    const order=bookingsRef.current.find(j=>j.id===orderId);let member;try{member=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===user?.id);}catch{}
    const tech=user?.role==='technician'&&member?.status==='ACTIVE'&&member.shopId===(order?.shopId||'shop_1')&&order?.assignedTechId===user.id;
    if(!order||(!tech&&!canBill(order.shopId||'shop_1'))||workflowStage(order)!=='payment_due'||order.isPaid)return {success:false,error:'Cash collection access unavailable.'};
    if(!order.paymentIntentId)return recordRepairPayment(orderId,amount,'Cash');
    try{
      const config=await paymentApi('/config');if(config.localOperatorLogin)await paymentApi('/operator/login',{password:''});
      const record=await paymentApi('/cash',{intentId:order.paymentIntentId,amount:String(amount),collectorName:user.name,collectorId:user.id,collectorRole:user.role});
      const patch={isPaid:true,status:'Delivered',paymentAmount:record.amount/100,paymentMethod:'Cash',paymentRecordedBy:user.id,paymentRecordedByName:user.name,paymentRecordedByRole:user.role,paymentRecordedAt:new Date(record.paidAt).toISOString(),cashCollectedBy:user.name,cashCollectedByRole:user.role,cashCollectedAt:new Date(record.paidAt).toISOString(),gatewayPaymentId:record.paymentId};
      setBookings(rows=>rows.map(j=>j.id===orderId?withWorkflow(j,patch,user):j));
      setInvoices(rows=>rows.map(i=>i.bookingId===orderId&&!cancelledInvoice(i)?{...i,paidAmount:i.grandTotal,dueAmount:0,paymentStatus:'Fully Paid',paymentMode:'Cash'}:i));
      return {success:true};
    }catch(error){return {success:false,error:error.message};}
  };
  const recordRepairPayment=(orderId,amount,method='Cash')=>{refreshBills();let liveRows=bookings,latest=bookings.find(j=>j.id===orderId);try{const stored=JSON.parse(localStorage.getItem('servicehub_bookings')||'[]');if(Array.isArray(stored)&&stored.length){liveRows=stored;latest=stored.find(j=>j.id===orderId)||latest;}}catch{}const value=Number(amount);let member;try{member=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===user?.id);}catch{}const techAllowed=user?.role==='technician'&&method==='Cash'&&member?.status==='ACTIVE'&&member.shopId===(latest?.shopId||'shop_1')&&latest?.assignedTechId===user.id;if(!latest||latest.archivedAt||(!techAllowed&&!canBill(latest.shopId||'shop_1')))return {success:false,error:'Payment access unavailable.'};if(latest.paymentIntentId&&!latest.isPaid)return {success:false,error:'Use the cash collection action to settle the linked payment.'};if(workflowStage(latest)!=='payment_due'||latest.isPaid)return {success:false,error:'Payment can only be recorded after repair, while Payment Due.'};if(!Number.isFinite(value)||Math.round(value*100)<1||value>100000000||!['Cash','UPI','Card'].includes(method))return {success:false,error:'Enter the full payment amount and a valid payment method.'};const bill=invoiceRef.current.find(i=>i.bookingId===orderId&&!cancelledInvoice(i));if(bill){if(value!==Number(bill.dueAmount))return {success:false,error:'Record the complete outstanding balance.'};return approveOrRecordPayment(bill.id,value)?{success:true}:{success:false,error:'Unable to record payment.'};}const charge=repairCharges(latest,shops.find(v=>v.id===(latest.shopId||'shop_1')),inventoryRef.current);const tracked=Boolean(latest.chargeSnapshot||latest.performedServices?.length||latest.partRequests?.some(r=>['Approved','Issued'].includes(r.status)));if(tracked&&(charge.error||Math.round(value*100)!==Math.round(charge.total*100)))return {success:false,error:charge.error||'Payment must match the calculated services, parts and home service total.'};const now=new Date().toISOString();const updated=withWorkflow(latest,{...(tracked?{chargeSnapshot:charge}:{}),isPaid:true,paymentAmount:Math.round(value*100)/100,paymentMethod:method,paymentRecordedBy:user.id,paymentRecordedByName:user.name,paymentRecordedByRole:user.role,...(method==='Cash'?{cashCollectedBy:user.name,cashCollectedByRole:user.role,cashCollectedAt:now}:{}),paymentRecordedAt:now,status:'Delivered'},user);updated.orderAudit=[...(latest.orderAudit||[]),auditEntry(user,'FINAL_PAYMENT_RECORDED',{amount:Math.round(value*100)/100,method})];const next=liveRows.map(j=>j.id===orderId?updated:j);try{localStorage.setItem('servicehub_bookings',JSON.stringify(next));setBookings(next);return {success:true};}catch{return {success:false,error:'Unable to save payment. Please retry.'};}};
  const createInvoice = data => {
    refreshBills();
    const shopId=data.shopId||'shop_1';if(!canBill(shopId)){setInvoiceError('Billing access is unavailable.');return null;}
    try{
      if(data.isGstInvoice&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(shops.find(s=>s.id===shopId)?.gstin||''))throw Error('Add a valid shop GSTIN before issuing a GST invoice.');const payload=billPayload(data),paidJob=bookings.find(j=>j.id===data.bookingId);if(!paidJob||workflowStage(paidJob)!=='completed'||!paidJob.isPaid)throw Error('Complete the repair and record full payment before generating its bill.');const paid=Number(paidJob.paymentAmount??payload.grandTotal);if(Math.round(paid*100)!==Math.round(payload.grandTotal*100))throw Error('Bill total must match the full payment already recorded for this repair.');if(!Number.isFinite(paid)||paid<0||paid>payload.grandTotal)throw Error('Payment must be between zero and the bill total.');
      if(data.bookingId){const order=bookings.find(o=>o.id===data.bookingId&&(o.shopId||'shop_1')===shopId&&!o.archivedAt);if(!order)throw Error('Repair order is unavailable.');if(workflowStage(order)!=='completed'||!order.isPaid)throw Error('Complete the repair and record full payment before generating its bill.');if(invoiceRef.current.some(i=>i.bookingId===data.bookingId&&(i.shopId||'shop_1')===shopId&&!cancelledInvoice(i)))throw Error('This repair already has an active bill.');}
      const now=new Date().toISOString(),id=nextInvoiceNumber(invoiceRef.current,shopId),order=bookings.find(o=>o.id===data.bookingId),allocations=[],credits=[],remaining=new Map();payload.items.filter(p=>p.isInventoryPart).forEach(p=>remaining.set(p.inventoryItemId,(remaining.get(p.inventoryItemId)||0)+p.qty));for(const r of order?.partRequests||[]){if(!['Approved','Issued'].includes(r.status))continue;const qty=Math.min(Math.max(0,Number(r.quantity)-Number(r.billedQty||0)),remaining.get(r.inventoryItemId)||0);if(qty>0){let skip=Number(r.billedQty||0),left=qty;const issued=[];for(const a of r.batchAllocations||[]){const offset=Math.min(skip,a.qty);skip-=offset;const n=Math.min(left,a.qty-offset);if(n>0){issued.push({...a,qty:n});left-=n;}}credits.push({inventoryItemId:r.inventoryItemId,qty,batchAllocations:issued});allocations.push({requestId:r.id,qty});remaining.set(r.inventoryItemId,remaining.get(r.inventoryItemId)-qty);}}const {items,stock}=stockForBill(payload.items,shopId,[],{invoiceId:id,orderId:data.bookingId,...(order?.chargeSnapshot?{preservePartRates:true,rateItems:order.chargeSnapshot.parts}: {})},credits);if(invoiceRef.current.some(i=>i.id===id))throw Error('This bill number already exists.');
      const prior=invoiceRef.current.find(i=>i.bookingId===data.bookingId&&cancelledInvoice(i)&&!i.replacementId);const inv={...payload,serviceDescription:order?.issueType||'',...(prior?{replacesInvoiceId:prior.id,transferredPayment:paid}:{}),requestAllocations:allocations,id,shopId,bookingId:data.bookingId||null,items,date:businessDate(now),createdAt:now,createdBy:user.id,createdByName:user.name,createdByRole:user.role,paidAmount:paid,dueAmount:payload.grandTotal-paid,paymentMode:paidJob.paymentMethod||data.paymentMode||'Cash',paymentStatus:paid===payload.grandTotal?'Fully Paid':paid>0?'Partially Paid':'Pending',...(user.role==='shop_owner'&&Number.isFinite(Number(data.costTotal))&&data.costTotal!==''&&data.costTotal!==undefined?{costTotal:Number(data.costTotal)}:{}),supplierSnapshot:{shopName:shops.find(s=>s.id===shopId)?.shopName,address:shops.find(s=>s.id===shopId)?.address,phone:shops.find(s=>s.id===shopId)?.phone,gstin:shops.find(s=>s.id===shopId)?.gstin},isGstInvoice:Boolean(data.isGstInvoice),...(data.isGstInvoice?{gstIssuedAt:now,supplierGstin:shops.find(s=>s.id===shopId)?.gstin||''}:{}),...(paid>0||data.isGstInvoice?{lockedAt:now}:{}),audit:[auditEntry(user,'CREATED',{total:payload.grandTotal}),...(paid>0&&!prior?[auditEntry(user,'PAYMENT_RECORDED',{amount:paid,at:paidJob.paymentRecordedAt||now,actorId:paidJob.paymentRecordedBy||user.id,actorName:paidJob.paymentRecordedByName||user.name})]:[])]};
      if(prior)inv.audit.push(auditEntry(user,'PAYMENT_CARRIED_FORWARD',{fromInvoiceId:prior.id,amount:paid}));if(!commitBills([inv,...invoiceRef.current.map(i=>prior&&i.id===prior.id?{...i,replacementId:id,customerCreditBalance:0,audit:[...(i.audit||[]),auditEntry(user,'REPLACEMENT_CREATED',{invoiceId:id,amount:paid})]}:i)],stock))return null;
      if(inv.bookingId)setBookings(prev=>prev.map(o=>o.id===inv.bookingId?{...withWorkflow(o,{invoiceNumber:inv.id,isPaid:inv.dueAmount===0,...(inv.dueAmount===0&&['Ready','Delivered'].includes(jobCardStatus(o))?{status:'Delivered'}:{})},user),partRequests:(o.partRequests||[]).map(r=>({...r,billedQty:Number(r.billedQty||0)+(allocations.find(a=>a.requestId===r.id)?.qty||0)}))}:o));return inv;
    }catch(error){setInvoiceError(error.message);return null;}
  };
  const editInvoice=(id,data)=>{refreshBills();
    const current=invoiceRef.current.find(i=>i.id===id);if(!current||!canBill(current.shopId||'shop_1'))return {success:false,error:'Billing access is unavailable.'};
    if(invoiceLocked(current))return {success:false,error:'This bill is locked. Only the owner can cancel and re-create it.'};
    try{const payload=billPayload(data),adjustment=stockForBill(payload.items,current.shopId||'shop_1',current.items,{invoiceId:id,orderId:current.bookingId,preservePartRates:true}),next={...current,...payload,items:adjustment.items,paymentMode:data.paymentMode||current.paymentMode,modifiedBy:user.id,modifiedByName:user.name,modifiedAt:new Date().toISOString(),paidAmount:0,dueAmount:payload.grandTotal,paymentStatus:'Pending',updatedAt:new Date().toISOString(),audit:[...(current.audit||[]),auditEntry(user,'EDITED',{before:{customerName:current.customerName,total:current.grandTotal,items:current.items},after:{customerName:payload.customerName,total:payload.grandTotal,items:payload.items}})]};return commitBills(invoiceRef.current.map(i=>i.id===id?next:i),adjustment.stock)?{success:true,invoice:next}:{success:false,error:'Unable to save bill changes.'};}catch(error){return {success:false,error:error.message};}
  };
  const approveOrRecordPayment=(id,amount)=>{refreshBills();
    const current=invoiceRef.current.find(i=>i.id===id),value=Number(amount);if(!current||!canBill(current.shopId||'shop_1')||cancelledInvoice(current)||!Number.isFinite(value)||value<=0||value>Number(current.dueAmount))return false;
    const paymentJob=bookings.find(j=>j.id===current.bookingId);if(paymentJob?.paymentIntentId&&!paymentJob.isPaid)return false;if(paymentJob&&!['payment_due','completed'].includes(workflowStage(paymentJob,current)))return false;if(value!==Number(current.dueAmount))return false;const paid=Math.round((Number(current.paidAmount||0)+value)*100)/100,due=Math.max(0,Math.round((current.grandTotal-paid)*100)/100),now=new Date().toISOString();const next={...current,paidAmount:paid,dueAmount:due,paymentStatus:due===0?'Fully Paid':'Partially Paid',lockedAt:current.lockedAt||now,audit:[...(current.audit||[]),auditEntry(user,'PAYMENT_RECORDED',{amount:value})]};const saved=commitBills(invoiceRef.current.map(i=>i.id===id?next:i));if(saved&&current.bookingId)setBookings(prev=>prev.map(j=>j.id===current.bookingId?withWorkflow(j,{isPaid:due===0,...(due===0&&(['Ready','Delivered'].includes(jobCardStatus(j))||j.status==='Unpaid - Closed')?{status:'Delivered'}:{})},user):j));return saved;
  };
  const collectHomeCash=(orderId)=>{refreshBills();
    let member;try{member=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===user?.id);}catch{}
    const order=bookings.find(j=>j.id===orderId),bill=invoiceRef.current.find(i=>i.bookingId===orderId&&!cancelledInvoice(i));
    if(order?.paymentIntentId&&!order.isPaid)return {success:false,error:'An online payment link is active. Use that link to avoid duplicate collection.'};
    if(user?.role!=='technician'||!homeCollectionAllowed(order,member)||!bill||(bill.shopId||'shop_1')!==(order.shopId||'shop_1')||!Number.isFinite(Number(bill.dueAmount))||!(Number(bill.dueAmount)>0))return {success:false,error:'Only the assigned active technician can collect an outstanding home-service bill.'};
    const now=new Date().toISOString(),amount=Number(bill.dueAmount),next={...bill,paidAmount:Number(bill.paidAmount||0)+amount,dueAmount:0,paymentMode:'Cash',paymentStatus:'Fully Paid',lockedAt:bill.lockedAt||now,cashCollectedBy:user.id,cashCollectedAt:now,audit:[...(bill.audit||[]),auditEntry(user,'CASH_COLLECTED',{amount,orderId})]};
    if(!commitBills(invoiceRef.current.map(i=>i.id===bill.id?next:i)))return {success:false,error:'Unable to save collection.'};
    setBookings(prev=>prev.map(j=>j.id===orderId?{...withWorkflow(j,{isPaid:true,status:'Delivered',paymentMethod:'Cash',cashCollectedAt:now},user),orderAudit:[...(j.orderAudit||[]),auditEntry(user,'HOME_SERVICE_PAYMENT_COMPLETED',{amount,invoiceId:bill.id})]}:j));return {success:true};
  };
  const startOwnerRepair=(id)=>{const job=bookings.find(j=>j.id===id);if(!job||job.archivedAt||user?.role!=='shop_owner'||(user.shopId||user.id)!==(job.shopId||'shop_1')||jobCardStatus(job)!=='In Repair'||!job.assignedTechId||job.startedAt)return {success:false,error:'Assign this repair before starting work.'};const now=new Date().toISOString();setBookings(prev=>prev.map(j=>j.id===id?{...withWorkflow(j,{status:'IN_PROGRESS',workPhase:'In Progress',startedAt:now,updatedAt:now},user),orderAudit:[...(j.orderAudit||[]),auditEntry(user,'REPAIR_STARTED')]}:j));return {success:true};};
  const overrideRepair=(id,target,reason)=>{refreshBills();const job=bookings.find(j=>j.id===id),text=String(reason||'').trim();if(!job||job.archivedAt||user?.role!=='shop_owner'||(user.shopId||user.id)!==(job.shopId||'shop_1'))return {success:false,error:'Only the owner can override this repair.'};if(text.length<5)return {success:false,error:'Enter an override reason (at least 5 characters).'};const bill=invoiceRef.current.find(i=>i.bookingId===id&&!cancelledInvoice(i));if((job.isPaid||bill&&Number(bill.paidAmount)>0)&&target!=='completed')return {success:false,error:'Review or cancel the paid bill before changing this job.'};if(target==='completed'&&!job.isPaid&&(!bill||Number(bill.dueAmount)>0))return {success:false,error:'Record the actual payment before completing this job.'};if(!['booked','assigned','on_way','repairing','ready','completed','cancelled'].includes(target))return {success:false,error:'Choose a valid status.'};if(target==='on_way'&&serviceMode(job)!=='home')return {success:false,error:'On The Way applies only to home service.'};if(!['booked','cancelled'].includes(target)&&!job.assignedTechId)return {success:false,error:'Assign a technician before overriding to this status.'};if(target==='cancelled'&&bill){const result=cancelPendingInvoice(bill.id,'Job cancelled: '+text);if(!result.success)return result;}const now=new Date().toISOString(),patch={status:({booked:'Request Received',assigned:'Diagnosing Issue',on_way:'EN_ROUTE',repairing:'IN_PROGRESS',ready:'Ready for Pickup',completed:'Delivered',cancelled:'Cancelled'})[target],workPhase:target==='booked'?null:target==='assigned'?'Assigned':target==='on_way'?'On The Way':target==='repairing'?'In Progress':'Done',...(target==='booked'?{assignedTechId:null,assignedTechName:null,assignedToOwner:false,assignedAt:null}:{}),onWayAt:target==='on_way'?now:null,startedAt:target==='repairing'?now:['ready','completed'].includes(target)?job.startedAt:null,completedAt:['ready','completed'].includes(target)?job.completedAt||now:null};setBookings(prev=>prev.map(j=>j.id===id?withWorkflow(j,patch,user,{overrideReason:text}):j));return {success:true};};
  const cancelCustomerBooking=id=>{
    try{
      const fresh=JSON.parse(localStorage.getItem('servicehub_bookings')||'[]'),bills=JSON.parse(localStorage.getItem('servicehub_invoices')||'[]'),job=fresh.find(j=>j.id===id),bill=bills.find(i=>i.bookingId===id&&!cancelledInvoice(i));
      if(!canCustomerCancel(job,user,bill))return {success:false,error:'This booking cannot be cancelled now. Please contact Support to appeal.'};
      const next=fresh.map(j=>j.id===id?withWorkflow(j,{status:'Cancelled',cancelledAt:new Date().toISOString(),cancelledBy:user.id,cancellationReason:'Cancelled by customer before assignment'},user):j);
      localStorage.setItem('servicehub_bookings',JSON.stringify(next));setBookings(next);return {success:true};
    }catch{return {success:false,error:'Unable to save cancellation. Please try again.'};}
  };
  const requestPaymentAtShop=id=>{const job=bookings.find(j=>j.id===id);if(user?.role!=='customer'||!job||job.customerId!==user.id||workflowStage(job)!=='payment_due')return {success:false,error:'Payment preference is unavailable for this job.'};setBookings(prev=>prev.map(j=>j.id===id?{...j,paymentPreference:'Pay at Shop',paymentPreferenceAt:new Date().toISOString()}:j));return {success:true};};
  useEffect(()=>{const refresh=()=>{try{const raw=localStorage.getItem('servicehub_bookings'),bills=localStorage.getItem('servicehub_invoices');if(raw){const rows=JSON.parse(raw);if(Array.isArray(rows))setBookings(prev=>JSON.stringify(prev)===raw?prev:rows);}if(bills){const rows=JSON.parse(bills);if(Array.isArray(rows))setInvoices(prev=>JSON.stringify(prev)===bills?prev:rows);}}catch{}};const timer=setInterval(refresh,30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(user?.role!=='shop_owner')return;const close=()=>{const expired=bookings.filter(j=>(j.shopId||'shop_1')===(user.shopId||user.id)&&!j.archivedAt&&unpaidAge(j,invoices.find(i=>i.bookingId===j.id&&!cancelledInvoice(i)))>=30);if(expired.length)setBookings(prev=>prev.map(j=>expired.some(e=>e.id===j.id)?withWorkflow(j,{status:'Unpaid - Closed',unpaidClosedAt:new Date().toISOString()},{id:'system',name:'System'}):j));};close();const timer=setInterval(close,30000);return()=>clearInterval(timer);},[bookings,invoices,user?.id,user?.role]);
  const messagingQueue=deliveryQueue(bookings,invoices);
  const cancelPendingInvoice=(id,reason)=>{refreshBills();
    const old=invoiceRef.current.find(i=>i.id===id);if(!old||!canBill(old.shopId||'shop_1')||cancelledInvoice(old)||(invoiceLocked(old)&&user?.role!=='shop_owner')||String(reason||'').trim().length<5)return {success:false,error:'Only the owner can cancel a paid bill. Enter a cancellation reason.'};
    try{const adjustment=stockForBill([],old.shopId||'shop_1',old.items,{invoiceId:id,orderId:old.bookingId}),now=new Date().toISOString(),next={...old,status:'Cancelled',cancelledAt:now,cancelledBy:user.id,cancelledByName:user.name,cancellationReason:reason.trim(),customerCreditBalance:Number(old.paidAmount)||0,stockReleased:true,...(gstInvoice(old)?{creditNoteDraft:{id:'CN-DRAFT-'+crypto.randomUUID().slice(0,8).toUpperCase(),invoiceId:old.id,amount:old.grandTotal,tax:old.tax||0,reason:reason.trim(),createdAt:now,createdBy:user.id,status:'Draft - accountant review required'}}:{}),audit:[...(old.audit||[]),auditEntry(user,'CANCELLED',{reason:reason.trim(),stockReleased:true})]};return commitBills(invoiceRef.current.map(i=>i.id===id?next:i),adjustment.stock)?{success:true}:{success:false,error:'Unable to cancel bill.'};}catch(error){return {success:false,error:error.message};}

  };
  const replaceInvoice=(id,data,reason)=>{refreshBills();
    const old=invoiceRef.current.find(i=>i.id===id),shopId=old?.shopId||'shop_1';if(!old||user?.role!=='shop_owner'||shopId!==(user.shopId||user.id)||cancelledInvoice(old))return {success:false,error:'Only the shop owner can cancel and re-create this bill.'};
    try{if(String(reason||'').trim().length<5)throw Error('Enter a cancellation reason (at least 5 characters).');const payload=billPayload(data),adjustment=stockForBill(payload.items,shopId,old.items,{invoiceId:id,orderId:old.bookingId}),now=new Date().toISOString(),newId=nextInvoiceNumber(invoiceRef.current,shopId),credit=Math.max(0,Number(old.paidAmount)||0),applied=Math.min(credit,payload.grandTotal),excess=Math.max(0,credit-applied);
      const replacement={...payload,items:adjustment.items,supplierSnapshot:old.supplierSnapshot||shops.find(s=>s.id===shopId),id:newId,shopId,bookingId:old.bookingId||null,date:businessDate(now),createdAt:now,createdBy:user.id,createdByName:user.name,createdByRole:user.role,paymentMode:['UPI','Cash','Card'].includes(data.paymentMode)?data.paymentMode:(['UPI','Cash','Card'].includes(old.paymentMode)?old.paymentMode:'Cash'),paidAmount:applied,dueAmount:payload.grandTotal-applied,paymentStatus:applied===payload.grandTotal?'Fully Paid':applied>0?'Partially Paid':'Pending',...(applied?{lockedAt:now,transferredPayment:applied}:{}),...(old.costTotal!==undefined?{costTotal:old.costTotal}:{}),replacesInvoiceId:old.id,isGstInvoice:gstInvoice(old),...(gstInvoice(old)?{gstIssuedAt:now,supplierGstin:old.supplierGstin,lockedAt:now}:{}),audit:[auditEntry(user,'CREATED',{replacesInvoiceId:old.id,total:payload.grandTotal}),...(applied?[auditEntry(user,'PAYMENT_CARRIED_FORWARD',{fromInvoiceId:old.id,amount:applied})]:[])]};
      const cancelled={...old,status:'Cancelled',cancelledAt:now,cancelledBy:user.id,cancelledByName:user.name,cancellationReason:reason.trim(),replacementId:newId,customerCreditBalance:excess,...(gstInvoice(old)?{creditNoteDraft:{id:'CN-DRAFT-'+crypto.randomUUID().slice(0,8).toUpperCase(),invoiceId:old.id,amount:old.grandTotal,tax:old.tax||0,reason:reason.trim(),createdAt:now,createdBy:user.id,status:'Draft — accountant review required'}}:{}),audit:[...(old.audit||[]),auditEntry(user,'CANCELLED',{reason:reason.trim(),replacementId:newId}),auditEntry(user,'REPLACEMENT_CREATED',{invoiceId:newId,amount:payload.grandTotal,customerCreditBalance:excess})]};
      if(!commitBills([replacement,...invoiceRef.current.map(i=>i.id===id?cancelled:i)],adjustment.stock))return {success:false,error:'Unable to save replacement bill.'};if(old.bookingId)setBookings(prev=>prev.map(o=>o.id===old.bookingId?withWorkflow(o,{invoiceNumber:newId,isPaid:replacement.dueAmount===0,...(['Ready','Delivered'].includes(jobCardStatus(o))?{status:replacement.dueAmount===0?'Delivered':'Ready for Pickup'}:{})},user):o));return {success:true,invoice:replacement,customerCreditBalance:excess};
    }catch(error){return {success:false,error:error.message};}
  };

  const editRepair=(id,data)=>{
    const order=bookings.find(o=>o.id===id);if(!order||order.archivedAt||!canBill(order.shopId||'shop_1'))return {success:false,error:'This repair is unavailable.'};
    const errors=repairLocationErrors(data);if(Object.keys(errors).length)return {success:false,error:Object.values(errors)[0]};
    if(!String(data.customerName||'').trim()||!(/^[6-9]\d{9}$/.test(data.customerPhone||''))||!String(data.deviceBrand||'').trim()||!String(data.issueType||'').trim())return {success:false,error:'Enter valid customer and repair details.'};
    const patch={customerName:data.customerName.trim(),customerPhone:data.customerPhone,whatsappNumber:String(data.whatsappNumber||'').trim(),deviceType:data.deviceType,deviceBrand:data.deviceBrand.trim(),brand:String(data.brand||'').trim(),model:String(data.model||'').trim(),issueType:data.issueType.trim(),description:String(data.description||'').trim(),serviceId:data.serviceId||null,requiredSkill:shops.find(s=>s.id===(order.shopId||'shop_1'))?.services?.find(v=>v.id===data.serviceId)?.requiredSkill||'',serialNumber:String(data.serialNumber||'').trim(),serviceMode:data.serviceMode,...(data.serviceMode==='shop'?{pickupMode:'none',deliveryMemberId:null}:{}),customerAddress:data.customerAddress.trim(),googleMapsUrl:data.serviceMode==='home'?data.googleMapsUrl||'':'',serviceCoordinates:data.serviceMode==='home'&&data.latitude!==''&&data.longitude!==''?{lat:Number(data.latitude),lng:Number(data.longitude)}:null,updatedAt:new Date().toISOString()};
    setBookings(prev=>prev.map(o=>o.id===id?{...o,...patch,orderAudit:[...(o.orderAudit||[]),auditEntry(user,'ORDER_EDITED',{fields:Object.keys(patch)})]}:o));return {success:true};
  };
  const archiveRepair=(id,reason)=>{
    const order=bookings.find(o=>o.id===id);if(!order||order.archivedAt||!canBill(order.shopId||'shop_1'))return {success:false,error:'This repair is unavailable.'};
    if(String(reason||'').trim().length<5)return {success:false,error:'Enter a removal reason (at least 5 characters).'};
    if(user.role!=='shop_owner'&&invoiceRef.current.some(i=>i.bookingId===id&&!cancelledInvoice(i)))return {success:false,error:'Only the owner can remove an order with a linked bill.'};
    setBookings(prev=>prev.map(o=>o.id===id?{...o,archivedAt:new Date().toISOString(),archivedBy:user.id,archiveReason:reason.trim(),orderAudit:[...(o.orderAudit||[]),auditEntry(user,'ORDER_ARCHIVED',{reason:reason.trim()})]}:o));return {success:true};
  };

  const syncCustomerContact = (userId, previous = {}, next = {}) => {
    const matchesCustomer = (row) =>
      row.customerId === userId ||
      (previous.name && row.customerName === previous.name) ||
      (previous.phone && row.customerPhone === previous.phone);

    setBookings((prev) =>
      prev.map((booking) =>
        matchesCustomer(booking)
          ? {
              ...booking,
              customerId: userId,
              customerName: next.name || booking.customerName,
              customerPhone: next.phone || booking.customerPhone
            }
          : booking
      )
    );

    // Issued bills preserve their customer snapshot; corrections use the billing audit flow.

  };

  const updateShopOwnerDetails = (shopId, details = {}) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.id === shopId
          ? {
              ...shop,
              ownerName: details.name || shop.ownerName,
              email: details.email || shop.email,
              phone: details.phone || shop.phone
            }
          : shop
      )
    );
  };

  const updateShopPublicDetails = (shopId, details) => {
    const next = Object.fromEntries(['shopName','phone','email','locality','address'].map(key => [key, String(details[key] || '').trim()]));
    if (!next.shopName || !next.address || !next.locality || !/^\d{10}$/.test(next.phone)) return { success: false, error: 'Enter the shop details and a valid 10-digit phone number.' };
    const current=shops.find(shop=>shop.id===shopId);if(!current)return {success:false,error:'Shop not found.'};
    if(next.phone!==current.phone||next.email!==current.email)return {success:false,error:'Change phone and email from Settings using re-verification.'};
    const rename=next.shopName!==current.shopName;
    if(rename&&nameChangeAllowedAt(current))return {success:false,error:'Your shop name change is still in its cooldown period.'};
    setShops(previous=>previous.map(shop=>shop.id===shopId?{...shop,...next,...(rename?{shopNameChangedAt:new Date().toISOString(),verificationStatus:'pending',verificationHistory:[...(shop.verificationHistory||[]),verificationEvent('Shop name change','flagged','Name change submitted for review.',false)]}:{})}:shop));
    return { success: true };
  };

  const saveSellerVerificationPreview=(shopId,updates)=>{
    if(!shops.some(shop=>shop.id===shopId))return {success:false,error:'Shop not found.'};
    const payout=updates.payoutAccount;
    const safe=payout?{holder:payout.holder,bank:payout.bank,last4:String(payout.last4||'').slice(-4),ifsc:payout.ifsc,verificationStatus:'pending',previewVerified:true,updatedAt:new Date().toISOString()}:null;
    setShops(previous=>previous.map(shop=>shop.id===shopId?{...shop,...(safe?{payoutAccount:safe}:{}),verificationHistory:[...(shop.verificationHistory||[]),...(updates.verificationHistory||[])]}:shop));
    return {success:true};
  };
  const updateShopCategories=(shopId,categories)=>{setShops(previous=>previous.map(shop=>shop.id===shopId?{...shop,categories}:shop));};

  const saveService=(shopId,id,service)=>{if(user?.role!=='shop_owner'||(user.shopId||user.id)!==shopId)return {success:false,error:'Only the shop owner can change services.'};const shop=shops.find(v=>v.id===shopId);if(!shop||(id&&!shop.services?.some(v=>v.id===id)))return {success:false,error:'Service unavailable.'};const errors=serviceErrors(service,inventory.filter(p=>(p.shopId||'shop_1')===shopId));if(Object.keys(errors).length)return {success:false,error:Object.values(errors)[0]};const value={...normalizeService(service),id:id||'srv_'+crypto.randomUUID()};setShops(prev=>prev.map(s=>s.id===shopId?{...s,services:id?s.services.map(v=>v.id===id?value:v):[...(s.services||[]),value]}:s));return {success:true};};
  const deleteService=(shopId,id)=>{if(user?.role!=='shop_owner'||(user.shopId||user.id)!==shopId)return {success:false,error:'Only the shop owner can change services.'};const shop=shops.find(v=>v.id===shopId),service=shop?.services?.find(v=>v.id===id);if(!service)return {success:false,error:'Service unavailable.'};setShops(prev=>prev.map(s=>s.id===shopId?{...s,services:s.services.filter(v=>v.id!==id),deletedServices:[...(s.deletedServices||[]),{...service,deletedAt:new Date().toISOString(),deletedBy:user.id}]}:s));return {success:true};};
  const setHomeServiceRate=(shopId,rate)=>{if(user?.role!=='shop_owner'||(user.shopId||user.id)!==shopId)return {success:false,error:'Only the shop owner can change this charge.'};if(!shops.some(v=>v.id===shopId))return {success:false,error:'Shop unavailable.'};if(rate!==null&&!validHomeServiceRate(rate))return {success:false,error:'Enter a valid charge per kilometre.'};setShops(prev=>prev.map(v=>v.id===shopId?{...v,homeServiceRatePerKm:rate===null?null:Number(rate),homeServiceRateUpdatedAt:new Date().toISOString()}:v));return {success:true};};
  const addService=(shopId,service)=>saveService(shopId,null,service);
  return (
    <ShopContext.Provider
      value={{
        shops,
        bookings,
        inventory,
        technicians,
        invoices,
        registerShop,
        approveShop,
        rejectShop,
        patchWorkforceOrder: (id,patch)=>setBookings(previous=>previous.map(order=>{if(order.id!==id)return order;if(patch.assignedTechId&&patch.assignedTechId!==order.assignedTechId&&patch.assignedTechId!==(order.shopId||'shop_1')){let member;try{member=JSON.parse(localStorage.getItem('servicehub_workforce_v1')||'{}').members?.find(m=>m.id===patch.assignedTechId&&m.shopId===(order.shopId||'shop_1'));}catch{}if(!technicianCheckIn(member).allowed)return order;}return withWorkflow(order,patch,user);})),
        createBooking,editRepair,archiveRepair,
        updateBookingStatus,
        inventoryPartReferenced,issueRepairPart,resolvePartRequest,addInventoryItem,saveInventoryPart,saveInventoryFamily,removeInventoryFamily,moveStock,updateRestockEntry,removeInventoryPart,
        updateInventoryStock,
        updateInventoryUnitCost:()=>({success:false,error:'Use the part editor or Stock In.'}),
        restockInventoryItem,
        deductInventoryStock,
        addTechnician,
        updateTechnicianLocation,
        attachPaymentLink,recordLinkedCash,recordRepairPayment,createInvoice,editInvoice,cancelPendingInvoice,replaceInvoice,invoiceError,
        approveOrRecordPayment,
        collectHomeCash, startOwnerRepair, messagingQueue, overrideRepair, requestPaymentAtShop, cancelCustomerBooking,
        addService, deleteService,
        setHomeServiceRate,updateService: (shopId,id,service)=>saveService(shopId,id,service),
        syncCustomerContact,
        updateShopOwnerDetails,
        updateShopPublicDetails,
        saveSellerVerificationPreview,
        submitShopReverification: (shopId,submission)=>{
          const ownerId=user?.shopId||user?.id;
          if(user?.role!=='shop_owner'||ownerId!==shopId)return {success:false,error:'This shop is not linked to your account.'};
          if(!submission.documentId||!submission.reason)return {success:false,error:'Add a reason and document before submitting.'};
          const current=shops.find(shop=>shop.id===shopId);
          if(!current||(current.verificationStatus==='pending'&&current.reverificationSubmission?.status==='pending'))return {success:false,error:'A request is already under review.'};
          const next=shops.map(shop=>shop.id===shopId?{...shop,verificationStatus:'pending',reverificationSubmission:{...submission,status:'pending',submittedAt:new Date().toISOString()}}:shop);
          try{localStorage.setItem('servicehub_shops',JSON.stringify(next));setShops(next);return {success:true};}catch{return {success:false,error:'Unable to save. Please free browser storage and try again.'};}
        },
        updateShopCategories,
        setTechnicians // expose so shop owner can toggle online/offline
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
