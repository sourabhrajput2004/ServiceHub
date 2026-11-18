import {customerInvoice} from './customerInvoice.js';

export async function customerInvoicePdf(invoice,shop={}){
 const {jsPDF}=await import('jspdf'),doc=new jsPDF({unit:'mm',format:'a4'}),i=customerInvoice(invoice),supplier=i.supplierSnapshot||shop;
 const created=new Date(invoice.createdAt||i.date||'2000-01-01T00:00:00Z');doc.setCreationDate(Number.isFinite(created.getTime())?created:new Date(0));
 if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({invoice:i,supplier})));doc.setFileId(Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,32));}
 const left=18,right=192,width=174,bottom=275;let y=20;
 const ensure=height=>{if(y+height>bottom){doc.addPage();y=20;}};
 const text=(value,{size=11,bold=false,color=[35,53,72],indent=0}={})=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
  const lines=doc.splitTextToSize(String(value||''),width-indent),height=size*.46;
  for(const line of lines){ensure(height+2);doc.text(line,left+indent,y);y+=height;}y+=2;
 };
 const rule=()=>{ensure(6);doc.setDrawColor(210,222,235);doc.line(left,y,right,y);y+=8;};
 const heading=value=>{ensure(17);y+=5;text(value,{size:13,bold:true});};
 text(supplier.shopName||'ServiceHub',{size:20,bold:true});
 text(supplier.address||'',{size:10});if(supplier.phone)text('Phone: '+supplier.phone,{size:10});
 y+=3;rule();
 text('CUSTOMER BILL / INVOICE',{size:12,bold:true});
 text('Invoice: '+i.id+'    Date: '+(i.date||''),{size:10});
 heading('Customer & repair');text(i.customerName);text('Phone: '+(i.customerPhone||''));
 text('Order: '+(i.bookingId||''));text(i.deviceInfo||'');
 heading('Services done');for(const service of i.services)text(service.name+(service.qty>1?' x '+service.qty:''),{indent:3});
 heading('Spare parts');if(i.parts.length){for(const part of i.parts)text(part.name+' x '+part.qty,{indent:3});}else text('None',{indent:3});
 y+=6;ensure(24);doc.setFillColor(237,243,249);doc.roundedRect(left,y-5,width,15,2,2,'F');doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(24,51,78);
 doc.text('Total amount',left+4,y+4);doc.text('Rs. '+i.grandTotal.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}),right-4,y+4,{align:'right'});y+=19;
 text(i.paymentStatus||'Recorded',{size:11,bold:true,color:[20,112,74]});
 if(i.warranty){y+=5;rule();text('Warranty: '+i.warranty,{size:10});}
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100,116,134);doc.text('ServiceHub | '+i.id+' | '+page+' / '+pages,left,288);}
 return {blob:doc.output('blob'),filename:String(i.id||'customer-bill').replace(/[^A-Za-z0-9_-]/g,'_')+'.pdf'};
}

export function downloadInvoicePdf(file){
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();const timer=setTimeout(()=>URL.revokeObjectURL(url),60000);timer.unref?.();
}
