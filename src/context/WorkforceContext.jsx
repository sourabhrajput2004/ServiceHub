import {technicianCheckIn} from '../utils/technicianCheckIn';
import {workflowStage} from '../utils/repairWorkflow';
import {serviceMode} from '../utils/repairService';
import {activeRepair} from '../utils/jobAssignment';
import {repairLocationErrors,jobCardStatus} from '../utils/repairService';
import {cancelledInvoice} from '../utils/invoiceLifecycle';
import {workerScreens,staffDuty} from '../utils/workforceAccess';
import {resolveMemberLogin} from '../utils/memberLogin';
import { safeMemberDetails,validMemberEmail } from '../pages/workforce/memberDetails';
import { useLanguage } from './LanguageContext';
import '../styles/workforce.css';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useShop } from './ShopContext';
import { memberKey, scoped, canAccess, orderState } from '../pages/workforce/model';
const Context = createContext(null);
export function WorkforceProvider({
  children
}) {
  const {
    tr
  } = useLanguage();
  const {
      user,setUser
    } = useAuth(),
    shop = useShop();
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(memberKey)) || {
        members: shop.technicians.map(t => ({
          id: t.id,
          shopId: t.shopId || 'shop_1',
          name: t.name,
          phone: t.phone || '',
          skills: t.specialty || 'Repair',
          role: 'technician',
          status: 'ACTIVE',
          joinedAt: t.joinedAt || '',
          legacy: true
        })),
        events: []
      };
    } catch {
      return {
        members: [],
        events: []
      };
    }
  });
  const [toast, setToast] = useState('');
  useEffect(()=>setToast(''),[user?.id]);
  useEffect(() => {
    try {
      localStorage.setItem(memberKey, JSON.stringify(data));
    } catch {
      setToast('Local storage is full. Changes could not be saved.');
    }
  }, [data]);
  useEffect(() => {
    const listener = e => {
      if (e.key === memberKey && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const previousInvoices = useRef(shop.invoices);
  useEffect(() => {
    const previous = previousInvoices.current;
    previousInvoices.current = shop.invoices;
    for (const invoice of shop.invoices) {
      const old = previous.find(i => i.id === invoice.id);
      if (!old || old.dueAmount <= 0 || invoice.dueAmount > 0) continue;
      const order = shop.bookings.find(o => o.id === invoice.bookingId);
      if (!order || order.isPaid) continue;
      if (orderState(order) === 'COMPLETED') {
        shop.patchWorkforceOrder(order.id, {
          isPaid: true,
          status: 'PAID'
        });
      } else {
        setData(d => ({
          ...d,
          events: [...[order.assignedTechId, 'staff'].filter(Boolean).map(recipient => ({
            id: crypto.randomUUID(),
            text: 'Payment received for Order ' + order.id,
            recipient,
            shopId: order.shopId || 'shop_1',
            date: new Date().toISOString()
          })), ...d.events].slice(0, 100)
        }));
      }
    }
  }, [shop.invoices]);
  const previousOrders = useRef(shop.bookings);
  useEffect(() => {
    const old = previousOrders.current;
    previousOrders.current = shop.bookings;
    const events = [];
    for (const order of shop.bookings) {
      const previous = old.find(o => o.id === order.id);
      if (previous && !previous.isPaid && order.isPaid) {
        const text = 'Payment received for Order ' + order.id;
        for (const recipient of [order.assignedTechId, 'staff'].filter(Boolean)) events.push({
          id: crypto.randomUUID(),
          text,
          recipient,
          shopId: order.shopId || 'shop_1',
          date: new Date().toISOString()
        });
      }
      if (previous && previous.status !== order.status && order.status === 'Disputed' && order.assignedTechId) events.push({
        id: crypto.randomUUID(),
        text: 'Dispute on Order ' + order.id,
        recipient: order.assignedTechId,
        shopId: order.shopId || 'shop_1',
        date: new Date().toISOString()
      });
    }
    if (events.length) setData(d => ({
      ...d,
      events: [...events, ...d.events].slice(0, 100)
    }));
  }, [shop.bookings]);
  useEffect(() => {
    if (!user) return;
    const actor=data.members.find(m=>m.id===user.id);
    const event = data.events.find(e => {
      if(e.shopId!==(user.shopId||user.id)||!(e.recipient===user.id||e.recipient===user.role))return false;
      if(user.role==='technician')return !/payment|cash|invoice|profit|earning|₹/i.test(e.text||'');
      if(user.role==='staff')return staffDuty(actor)==='Inventory Management'?/stock|product|inventory|restock/i.test(e.text||''):staffDuty(actor)==='Counter & Billing'&&!/profit|earning|investment/i.test(e.text||'');
      return true;
    });
    if (!event) return;
    const key = 'wf-seen-' + user.id;
    if (localStorage.getItem(key) !== event.id) {
      localStorage.setItem(key, event.id);
      if (localStorage.getItem('wf-notifications-' + user.id) !== 'off') setToast(user.role === 'technician' && event.orderId && (!shop.bookings.some(o => o.id === event.orderId && o.assignedTechId === user.id) || !['NEW', 'EN_ROUTE', 'IN_PROGRESS'].includes(orderState(shop.bookings.find(o => o.id === event.orderId) || {}))) ? 'Job update for ' + event.orderId : event.text);
    }
  }, [data.events, user?.id,data.members]);
  const member = data.members.find(m => m.id === user?.id),
    shopId = user?.shopId || user?.id;
  const owner = user?.role === 'shop_owner';
  const notify = (text, recipient, relatedShop = shopId, orderId = null) => {
    setData(d => ({
      ...d,
      events: [{
        id: crypto.randomUUID(),
        text,
        recipient,
        orderId,
        shopId: relatedShop,
        date: new Date().toISOString()
      }, ...d.events].slice(0, 100)
    }));
    setToast(text);
  };
  const findLoginMember = identity => {
    let latest=data;
    try{const saved=JSON.parse(localStorage.getItem(memberKey));if(saved&&Array.isArray(saved.members)){latest=saved;if(JSON.stringify(saved)!==JSON.stringify(data))setData(saved);}}catch{}
    return resolveMemberLogin(latest.members,identity);
  };
  const add = form => {
    if (!owner) return null;
    if (data.members.filter(m => m.shopId === shopId && m.status !== 'REMOVED' && !m.legacy && !m.isDemo && !m.demo).length >= 10) {
      setToast('Maximum 10 members per shop.');
      return null;
    }
    if (data.members.some(m => m.phone === form.phone && m.status !== 'REMOVED')) {
      setToast('This phone number already belongs to a member.');
      return null;
    }
    const m = {
      ...safeMemberDetails(form),
      id: 'member_' + crypto.randomUUID(),
      shopId,
      status: 'ACTIVE',
      addedByOwner: true,
      joinedAt: new Date().toISOString()
    };
    setData(d => ({
      ...d,
      members: [...d.members, m]
    }));
    if (m.role === 'technician') shop.addTechnician({
      id: m.id,
      shopId: m.shopId,
      name: m.name,
      phone: m.phone,
      specialty: m.skills
    });
    setToast('Member added successfully.');
    return m;
  };
  const updateMember = (id, updates) => {
    const member = data.members.find(m => m.id === id && m.shopId === shopId && m.status !== 'REMOVED');
    if (!owner || !member) return {
      success: false,
      error: 'Member not found.'
    };
    if (data.members.some(m => m.id !== id && m.phone === updates.phone && m.status !== 'REMOVED')) return {
      success: false,
      error: 'This phone number already belongs to a member.'
    };
    if (member.role !== updates.role && shop.bookings.some(o => o.shopId === shopId && o.assignedTechId === id && activeRepair(o))) return {
      success: false,
      error: 'Finish assigned jobs before changing this role.'
    };
    const safe = safeMemberDetails({
      ...member,
      ...updates
    });
    const next = {
      ...safe,
      id: member.id,
      shopId: member.shopId,
      status: member.status,
      joinedAt: member.joinedAt,
      updatedAt: new Date().toISOString()
    };
    setData(d => ({
      ...d,
      members: d.members.map(m => m.id === id ? next : m)
    }));
    if (next.role === 'technician') {
      if (shop.technicians.some(t => t.id === id)) shop.setTechnicians(rows => rows.map(t => t.id === id ? {
        ...t,
        name: next.name,
        phone: next.phone,
        specialty: next.skills
      } : t));else shop.addTechnician({
        id,
        shopId,
        name: next.name,
        phone: next.phone,
        specialty: next.skills
      });
    } else if (member.role === 'technician') shop.setTechnicians(rows => rows.filter(t => t.id !== id));
    setToast('Member details updated.');
    return {
      success: true,
      member: next
    };
  };
  const change = (id, status) => {
    const m = data.members.find(m => m.id === id && m.shopId === shopId);
    if (!owner || !m) return;
    if (m.role === 'technician') {
      if (status === 'ACTIVE' && !shop.technicians.some(t => t.id === m.id)) shop.addTechnician({
        id: m.id,
        shopId: m.shopId,
        name: m.name,
        phone: m.phone,
        specialty: m.skills
      });
      if (status === 'REMOVED') shop.setTechnicians(previous => previous.filter(t => t.id !== m.id));
    }
    setData(d => ({
      ...d,
      members: d.members.map(x => x.id === id ? {
        ...x,
        status,
        ...(status === 'REMOVED' ? {
          removedAt: new Date().toISOString()
        } : {
          approvedAt: new Date().toISOString()
        })
      } : x)
    }));
    setToast(status === 'ACTIVE' ? 'Member approved.' : 'Member access removed.');
  };
  const allowed = owner || canAccess(member, user);
  const recordActivity = (action, orderId, details, memberId = user?.id) => {
    if (!allowed) return;
    const target = data.members.find(m => m.id === memberId && m.shopId === shopId);
    if (!target) return;
    setData(d => ({
      ...d,
      activities: [{
        id: crypto.randomUUID(),
        shopId,
        memberId,
        actorId: user.id,
        action,
        orderId,
        details,
        date: new Date().toISOString()
      }, ...(d.activities || [])]
    }));
  };
  const patchOrder = (id, patch) => {
    const order = shop.bookings.find(b => b.id === id);
    if (!allowed || !order || order.archivedAt || !scoped(order, shopId)) return false;
    if(user.role==='staff')return false;
    if(patch.assignedTechId&&patch.assignedTechId!==order.assignedTechId&&patch.assignedTechId!==shopId&&!technicianCheckIn(data.members.find(m=>m.id===patch.assignedTechId&&m.shopId===shopId)).allowed){setToast('Check-in required today before assigning a job.');return false;}
    if(user.role==='technician'){
      if(order.assignedTechId!==user.id||!activeRepair(order))return false;
      const stage=workflowStage(order),home=serviceMode(order)==='home',trip=patch.status==='EN_ROUTE'&&home&&stage==='assigned',start=patch.status==='IN_PROGRESS'&&(home?stage==='on_way':stage==='assigned'),progress=patch.workPhase==='In Progress'&&order.workPhase==='Started',done=patch.status==='Ready for Pickup'&&stage==='repairing';
      const keys=trip?['status','workPhase']:start?['status','startedAt','workPhase']:progress?['workPhase']:done?['status','completedAt','workPhase']:[];if(!keys.length||Object.keys(patch).some(key=>!keys.includes(key)))return false;
      if(trip)patch={status:'EN_ROUTE',workPhase:'On The Way',onWayAt:new Date().toISOString()};
      if(start){completing.current.delete(order.id);patch={...patch,workPhase:'In Progress',startedAt:new Date().toISOString()};}

    }
    shop.patchWorkforceOrder(id, patch);
    if (patch.assignedTechId && patch.assignedTechId !== order.assignedTechId) {
      recordActivity('ORDER_ASSIGNED', id, order.issueType || order.deviceBrand, patch.assignedTechId);
      if (user.role === 'staff') recordActivity('ORDER_ASSIGNED', id, (patch.assignedTechName || 'Technician') + ' · ' + (order.issueType || ''));
    }
    if (patch.status === 'Ready for Pickup' && order.status !== 'Ready for Pickup') recordActivity('ORDER_COMPLETED', id, order.issueType || order.deviceBrand);
    if (patch.cashConfirmed && !order.cashConfirmed) recordActivity('CASH_CONFIRMED', id, String(order.estimatedCost));
    if (patch.status === 'REJECTED' && order.status !== 'REJECTED') recordActivity('ORDER_REJECTED', id, order.issueType || 'Order rejected');if(user.role==='technician')setToast('Work status updated: '+(patch.workPhase||patch.status));
    return true;
  };
  const updateOwnProfile = updates => {
    if(user?.role!=='technician'||!canAccess(member,user))return {success:false,error:'Active technician membership required.'};
    const keys=['photo','name','phone','email','alternatePhone','dateOfBirth','gender','guardianName','guardianPhone','emergencyName','emergencyPhone','house','street','locality','city','state','pincode','qualifications','experience','skills'];
    if(Object.keys(updates).some(key=>!keys.includes(key)))return {success:false,error:'These fields are managed by the owner.'};
    const clean=Object.fromEntries(Object.entries(updates).map(([key,value])=>[key,String(value).trim()])),next={...member,...clean},errors={};
    if(!/^[\p{L}\p{M} ]{2,80}$/u.test(next.name))errors.name='Enter a name with 2–80 letters.';
    for(const key of ['phone','alternatePhone','guardianPhone','emergencyPhone'])if((key==='phone'||next[key])&&!/^[6-9]\d{9}$/.test(next[key]||''))errors[key]='Enter a valid 10-digit phone number.';
    if(!validMemberEmail(next.email||''))errors.email='Enter a valid email.';
    if(data.members.some(m=>m.id!==member.id&&m.status!=='REMOVED'&&m.phone===next.phone))errors.phone='This phone belongs to another member.';
    if(data.members.some(m=>m.id!==member.id&&m.status!=='REMOVED'&&m.email?.toLowerCase()===next.email?.toLowerCase()))errors.email='This email belongs to another member.';
    if(next.pincode&&!/^[1-9]\d{5}$/.test(next.pincode))errors.pincode='Enter a valid 6-digit pincode.';
    if(next.dateOfBirth&&(!/^\d{4}-\d{2}-\d{2}$/.test(next.dateOfBirth)||!Number.isFinite(Date.parse(next.dateOfBirth))||next.dateOfBirth>=new Date().toISOString().slice(0,10)))errors.dateOfBirth='Enter a valid past date.';
    if(clean.photo&&clean.photo!==member.photo&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(clean.photo))errors.photo='Choose a valid profile image.';
    if(clean.photo?.length>2400000)errors.photo='Choose a smaller image.';
    for(const key of keys.filter(key=>key!=='photo'))if(String(next[key]||'').length>(key==='skills'?300:254))errors[key]='Value is too long.';
    if(Object.keys(errors).length)return {success:false,errors};
    if(typeof next.qualifications==='string')next.qualifications=next.qualifications.split(',').map(v=>v.trim()).filter(Boolean);
    next.email=next.email.toLowerCase();next.updatedAt=new Date().toISOString();
    setData(d=>({...d,members:d.members.map(m=>m.id===member.id?next:m)}));
    shop.setTechnicians(rows=>rows.map(t=>t.id===member.id?{...t,name:next.name,phone:next.phone,specialty:next.skills}:t));
    setUser({...user,name:next.name,phone:next.phone,email:next.email,skills:next.skills,avatar:next.photo});
    setToast('Profile updated.');return {success:true,member:next};
  };
  const updateVisitEta = (id,minutes) => {
    const job=shop.bookings.find(j=>j.id===id),value=Number(minutes);
    if(user?.role!=='technician'||!canAccess(member,user)||!job||job.assignedTechId!==user.id||!scoped(job,shopId)||serviceMode(job)!=='home'||!['assigned','on_way'].includes(workflowStage(job))||!Number.isInteger(value)||value<1||value>480)return false;
    shop.patchWorkforceOrder(id,{etaMinutes:value,estimatedArrivalAt:new Date(Date.now()+value*60000).toISOString(),etaUpdatedAt:new Date().toISOString()});
    notify('Technician arrival updated: '+value+' minutes for '+id,job.customerId||'customer',shopId,id);return true;
  };
  const confirmPaidCompletion = id => {
    const job=shop.bookings.find(j=>j.id===id);
    if(user?.role!=='technician'||!canAccess(member,user)||!job||job.assignedTechId!==user.id||!scoped(job,shopId)||job.archivedAt||!job.isPaid||workflowStage(job)!=='completed'||job.technicianConfirmedAt)return false;
    shop.patchWorkforceOrder(id,{technicianConfirmedAt:new Date().toISOString(),technicianConfirmedBy:user.id});recordActivity('TECHNICIAN_COMPLETION_CONFIRMED',id,'Payment received and job closed');return true;
  };
  const setAvailability = (id, availability) => {
    const m = data.members.find(m => m.id === id && m.shopId === shopId && m.role === 'technician' && m.status === 'ACTIVE');
    if (!owner || !m || !['Available', 'Off'].includes(availability)) return;
    if (shop.bookings.some(o => o.shopId === shopId && o.assignedTechId === id && ['NEW', 'EN_ROUTE', 'IN_PROGRESS'].includes(orderState(o)))) {
      setToast('Finish the current job before changing availability.');
      return;
    }
    setData(d => ({
      ...d,
      members: d.members.map(m => m.id === id ? {
        ...m,
        availability
      } : m)
    }));
    setToast('Technician availability updated.');
  };
  const completing = useRef(new Set());
  const complete = order => {
    order = shop.bookings.find(o => o.id === order.id) || order;
    if (completing.current.has(order.id)) return;
    if (order.archivedAt || user?.role !== 'technician' || !canAccess(member, user) || order.workPhase !== 'In Progress' || order.assignedTechId !== user.id) return;
    completing.current.add(order.id);
    if (patchOrder(order.id, {
      status: 'Ready for Pickup',workPhase:'Done',
      completedAt: new Date().toISOString(),
    })) {
      notify('Kaam complete. Rate & Pay: ' + order.id, order.customerId || 'customer');
      notify('Order ' + order.id + ' complete. Invoice ready.', 'staff');
    }
  };
  const addWorkUpdate=(id,type,values)=>{
    const order=shop.bookings.find(o=>o.id===id);if(user?.role!=='technician'||!canAccess(member,user)||!order||(order.shopId||'shop_1')!==shopId||order.assignedTechId!==user.id||!activeRepair(order))return {success:false,error:'Only your active assigned jobs can be updated.'};
    if(!['service','removeService','part','note'].includes(type))return {success:false,error:'Invalid work update.'};
    if(type==='service'||type==='removeService'||type==='part'){
      if(workflowStage(order)!=='repairing')return {success:false,error:'Start repairing before adding services or parts.'};
      if(order.paymentIntentId||order.isPaid||shop.invoices.some(i=>i.bookingId===id&&!cancelledInvoice(i)))return {success:false,error:'The bill is already locked. Ask the owner to review it.'};
    }
    if(type==='removeService'){
      const entry=order.performedServices?.find(s=>s.serviceId===values.serviceId);
      if(!entry)return {success:false,error:'Service is not added to this job.'};
      shop.patchWorkforceOrder(id,{performedServices:order.performedServices.filter(s=>s.serviceId!==values.serviceId)});recordActivity('SERVICE_REMOVED',id,entry.name);return {success:true};
    }
    if(type==='service'){
      const service=shop.shops.find(s=>s.id===shopId)?.services?.find(s=>s.id===values.serviceId&&!s.archivedAt);
      if(!service)return {success:false,error:'Choose a service from your shop catalogue.'};
      if(order.performedServices?.some(s=>s.serviceId===service.id))return {success:false,error:'This service is already added.'};
      const entry={id:crypto.randomUUID(),serviceId:service.id,name:service.name,labourCharge:Number(service.labourCharge??service.price??0),warrantyDays:service.warrantyDays,by:user.id,byName:user.name,at:new Date().toISOString()};
      shop.patchWorkforceOrder(id,{performedServices:[...(order.performedServices||[]),entry]});recordActivity('SERVICE_RECORDED',id,service.name);return {success:true};
    }
    if(type==='part'){
      const result=shop.issueRepairPart(id,values);if(result.success){recordActivity('PART_USED',id,values.inventoryItemId);setToast('Part added and inventory updated.');}return result;
    }
    const requestedPart=type==='part'?shop.inventory.find(p=>p.id===values.inventoryItemId&&!p.archivedAt&&(p.shopId||'shop_1')===shopId):null;if(type==='part'&&!requestedPart)return {success:false,error:'Choose a part from the request catalogue.'};const text=String(values.text||requestedPart?.name||'').trim();if(text.length<3||text.length>1000)return {success:false,error:'Write between 3 and 1000 characters.'};if(type==='part'&&(!Number.isInteger(Number(values.quantity))||Number(values.quantity)<1||Number(values.quantity)>100))return {success:false,error:'Enter a quantity between 1 and 100.'};
    const key=type==='part'?'partRequests':'workNotes',entry={id:crypto.randomUUID(),text,by:user.id,byName:user.name,at:new Date().toISOString(),...(type==='part'?{inventoryItemId:requestedPart.id,partName:requestedPart.name,quantity:Number(values.quantity),status:'Pending'}:{})};shop.patchWorkforceOrder(id,{[key]:[...(order[key]||[]),entry]});recordActivity(type==='part'?'PART_REQUESTED':'WORK_NOTE_ADDED',id,text);notify(type==='part'?'Parts requested for '+id:'Technical note on '+id,'staff',shopId,id);if(type==='part')notify('Parts requested for '+id,shopId,shopId,id);setToast(type==='part'?'Part request sent to the owner/counter.':'Technical note saved.');return {success:true};
  };
  const acknowledgePart=(id,requestId)=>{const order=shop.bookings.find(o=>o.id===id);if(!order||order.shopId!==shopId||(!owner&&!(user?.role==='staff'&&canAccess(member,user)&&staffDuty(member)==='Counter & Billing')))return false;shop.patchWorkforceOrder(id,{partRequests:(order.partRequests||[]).map(r=>r.id===requestId?{...r,status:'Acknowledged',acknowledgedBy:user.name,acknowledgedAt:new Date().toISOString()}:r)});setToast('Part request acknowledged. Add used parts to the final bill.');return true;};
  const staffCan=duty=>user?.role==='staff'&&canAccess(member,user)&&staffDuty(member)===duty;
  const createRepair=form=>{
    if(!staffCan('Counter & Billing'))return null;
    if(!form.customerName?.trim()||!/^([6-9]\d{9})$/.test(form.customerPhone||'')||!form.issueType?.trim() ||Object.keys(repairLocationErrors(form)).length)return null;
    const order=shop.createBooking({...form,id:'BK-'+crypto.randomUUID().slice(0,8).toUpperCase(),shopId,shopName:shop.shops.find(s=>s.id===shopId)?.shopName,requiredSkill:shop.shops.find(s=>s.id===shopId)?.services?.find(v=>v.id===form.serviceId)?.requiredSkill||'',customerName:form.customerName.trim(),customerAddress:form.customerAddress.trim(),googleMapsUrl:form.serviceMode==='home'?form.googleMapsUrl||'':'',latitude:form.serviceMode==='home'?form.latitude:'',longitude:form.serviceMode==='home'?form.longitude:'',serviceCoordinates:form.serviceMode==='home'&&form.latitude&&form.longitude?{lat:Number(form.latitude),lng:Number(form.longitude)}:null,preferredSlot:form.serviceMode==='home'?'Service at Home':'Service at Shop',deviceBrand:form.deviceBrand||form.issueType,deviceType:form.deviceType||'Repair',statusHistory:[],createdBy:user.id});
    recordActivity('ORDER_CREATED',order.id,order.issueType);setToast('Repair added. The owner can assign a technician.');return order;
  };
  const issueInvoice=(orderId,amount,paidAmount,mode)=>{
    if(!staffCan('Counter & Billing'))return null;
    const order=shop.bookings.find(o=>o.id===orderId&&scoped(o,shopId));
    if(!order||!Number.isFinite(Number(amount))||Number(amount)<=0||!Number.isFinite(Number(paidAmount))||Number(paidAmount)<0||Number(paidAmount)>Number(amount))return null;
    const existing=shop.invoices.find(i=>!cancelledInvoice(i)&&scoped(i,shopId)&&(i.bookingId===orderId||i.id===order.invoiceNumber));if(existing)return existing;
    const total=Number(amount),paid=Number(paidAmount),inv=shop.createInvoice({id:'INV-'+crypto.randomUUID().slice(0,8).toUpperCase(),shopId,bookingId:order.id,customerName:order.customerName,customerPhone:order.customerPhone,serviceMode:order.serviceMode,serialNumber:order.serialNumber,customerAddress:order.customerAddress,deviceInfo:order.deviceBrand,items:[{name:order.issueType,qty:1,rate:total,total}],subtotal:total,grandTotal:total,discount:0,paidAmount:paid,dueAmount:total-paid,paymentMode:mode,paymentStatus:paid===total?'Fully Paid':'Partially Paid',createdBy:user.id});
    if(!inv)return null;recordActivity('INVOICE_CREATED',order.id,inv.id);setToast('Invoice created.');return inv;
  };
  const updateCounterStatus=(id,status)=>{
    if(!staffCan('Counter & Billing'))return false;
    const states=['Device Received at Shop','Diagnosing Issue','Waiting for Parts','Repaired & QC Tested','Ready for Pickup','Completed','Delivered'];
    const order=shop.bookings.find(o=>o.id===id&&scoped(o,shopId));if(!order||order.archivedAt||!states.includes(status))return false;if(!['Ready for Pickup','Delivered'].includes(status))return false;if(jobCardStatus({status})==='In Repair'){setToast('The owner assigns work when starting In Repair.');return false;}if(status==='Delivered'&&(!order.isPaid||jobCardStatus(order)!=='Ready'))return false;if(['Ready for Pickup','Completed'].includes(status)&&!['Done'].includes(order.workPhase)&&jobCardStatus(order)!=='Ready')return false;
    const history=order.statusHistory||[],index=history.findIndex(step=>step.step===status),finished=['Ready for Pickup','Completed','Delivered'].includes(status);
    shop.patchWorkforceOrder(id,{status,...(finished?{completedAt:new Date().toISOString()}:{}),statusHistory:history.map((step,i)=>(finished||i<=index)?{...step,done:true,timestamp:step.timestamp||'Just now'}:step)});
    recordActivity('ORDER_STATUS_UPDATED',id,status);setToast('Repair status updated.');return true;
  };
  const collectCounterPayment=(id,amount)=>{
    if(!staffCan('Counter & Billing'))return false;const invoice=shop.invoices.find(i=>i.id===id&&scoped(i,shopId)),value=Number(amount);if(!invoice||!Number.isFinite(value)||value<=0||value>Number(invoice.dueAmount))return false;
    if(!shop.approveOrRecordPayment(id,value))return false;recordActivity('PAYMENT_RECORDED',invoice.bookingId,id);setToast('Payment recorded.');return true;
  };
  const addStock=form=>{if(!staffCan('Inventory Management'))return false;const r=shop.addInventoryItem({...form,shopId});if(r.success)setToast('Product added.');return r.success;};
  const saveStock=(id,qty,unitCost,restock=false,reason='')=>{if(!staffCan('Inventory Management'))return false;const r=shop.moveStock(id,restock?'in':'adjust',qty,unitCost,reason);if(r.success)setToast('Stock updated.');return r.success;};
  return <Context.Provider value={{
    ...data,
    addWorkUpdate,acknowledgePart,createRepair,issueInvoice,updateCounterStatus,collectCounterPayment,addStock,saveStock,
    member,
    shopId,
    allowed,
    toast,
    setToast,
    add,
    updateMember,updateOwnProfile,updateVisitEta,confirmPaidCompletion,findLoginMember,
    change,
    notify,
    patchOrder,
    complete,
    setAvailability,
    recordActivity
  }}>{children}{toast && <div className="wf-toast" role="status">{tr(toast)}</div>}</Context.Provider>;
}
export const useWorkforce = () => useContext(Context);
