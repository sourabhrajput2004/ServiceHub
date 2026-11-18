import {billSection} from './invoiceLifecycle.js';
// This projection is shared by customer screens, PDFs and WhatsApp text.
// It deliberately contains no labour/part rates, cost allocations or subtotals.
export function customerInvoice(invoice){
 const services=(invoice.items||[]).filter(i=>billSection(i)==='service').map(i=>({name:String(i.name||''),qty:Number(i.qty)||1}));
 const parts=(invoice.items||[]).filter(i=>billSection(i)==='part').map(i=>({name:String(i.name||''),qty:Number(i.qty)||1}));
 if(!services.length)services.push({name:invoice.serviceDescription||'Repair service',qty:1});
 return {id:invoice.id,bookingId:invoice.bookingId,date:invoice.date,customerName:invoice.customerName,customerPhone:invoice.customerPhone,customerAddress:invoice.customerAddress,deviceInfo:invoice.deviceInfo,grandTotal:Number(invoice.grandTotal)||0,paymentStatus:invoice.paymentStatus,status:invoice.status,warranty:invoice.warranty,supplierSnapshot:invoice.supplierSnapshot?Object.fromEntries(['shopName','address','phone','gstin'].map(k=>[k,invoice.supplierSnapshot[k]])):undefined,services,parts};
}
export function customerInvoiceMessage(invoice,shop={},tracking=''){
 const i=customerInvoice(invoice),name=i.supplierSnapshot?.shopName||shop.shopName||'ServiceHub';
 return [name,'Invoice: '+i.id,'Order: '+(i.bookingId||'—'),i.deviceInfo||'', 'Services done:',...i.services.map(s=>'- '+s.name+(s.qty>1?' × '+s.qty:'')),'Spare parts:',...(i.parts.length?i.parts.map(p=>'- '+p.name+' x '+p.qty):['None']),'Total amount: ₹'+i.grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}),'Status: '+(i.status==='Cancelled'?'Cancelled':i.paymentStatus||'Recorded'),...(tracking?['View repair: '+tracking]:[])].filter(Boolean).join('\n');
}
