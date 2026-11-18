import assert from 'node:assert/strict';
import {customerInvoice,customerInvoiceMessage} from '../src/utils/customerInvoice.js';
import {invoiceMarkup,printInvoice} from '../src/utils/invoiceDocument.js';
const invoice={id:'INV-9001',bookingId:'BK-1',date:'2026-11-11',customerName:'Customer',customerPhone:'9876543210',deviceInfo:'Phone',grandTotal:1035,subtotal:1035,paidAmount:1035,dueAmount:0,paymentStatus:'Fully Paid',supplierSnapshot:{shopName:'Workshop',address:'Raj Nagar',phone:'9876543210',privateCost:999,services:[{rate:777}]},items:[{name:'Screen Replacement',kind:'service',qty:1,rate:137,total:137},{name:'Internal OLED part',isInventoryPart:true,qty:1,rate:687,total:687},{name:'Home Service Charge',kind:'charge',qty:1,rate:211,total:211}]};
const projection=JSON.stringify(customerInvoice(invoice));for(const hidden of ['privateCost','services":[{"rate','137','687','211','Internal OLED'])assert.ok(!projection.includes(hidden),hidden);
const customer=invoiceMarkup(invoice,{}),owner=invoiceMarkup(invoice,{}, {audience:'internal'}),message=customerInvoiceMessage(invoice,{});
for(const text of [customer,message]){assert.ok(text.includes('Screen Replacement'));assert.ok(text.includes('1,035'));for(const hidden of ['Internal OLED part','Home Service Charge','137.00','687.00','211.00','Subtotal','<th>Rate</th>'])assert.ok(!text.includes(hidden),hidden);}
assert.ok(owner.includes('137.00'));assert.ok(owner.includes('687.00'));assert.ok(owner.includes('211.00'));assert.ok(owner.includes('Subtotal'));
assert.ok(invoiceMarkup({...invoice,items:[{name:'<script>alert(1)</script>',kind:'service',qty:1,rate:1035}]}).includes('&lt;script&gt;'));
let printed='';globalThis.window={open:()=>({document:{write:s=>printed=s,close(){}}})};assert.equal(printInvoice(invoice,{}),true);assert.ok(!printed.includes('Internal OLED part'));
console.log('Passed separate owner/customer invoice copies, total-only pricing, service names, WhatsApp summary, safe default PDF and escaped content.');
