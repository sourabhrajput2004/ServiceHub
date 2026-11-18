import {stockBatches} from './inventoryBatches.js';
export function linkedRestocks(part){
 const batches=stockBatches(part),used=new Set(),history=[...(part.history||[])];
 const entries=history.filter(h=>h.type==='PURCHASE').sort((a,b)=>String(a.at).localeCompare(String(b.at)));
 const links=new Map();
 for(const h of entries){let b=batches.find(b=>b.id===h.batchId);if(!b)b=batches.find(b=>!used.has(b.id)&&Number(b.qty)===Number(h.qty)&&Number(b.purchasePrice)===Number(h.price));if(!b&&entries.length===1&&batches.length===1)b=batches[0];if(b){links.set(h.id,b.id);used.add(b.id);}}
 return {...part,batches,history:history.map(h=>links.has(h.id)?{...h,batchId:links.get(h.id)}:h)};
}
export function changeRestock(part,entryId,input,{remove=false,actor='Owner',now=new Date().toISOString()}={}){
 const base=linkedRestocks(part),entry=base.history.find(h=>h.id===entryId&&h.type==='PURCHASE'&&!h.deletedAt),errors={};
 if(!entry)return {success:false,error:'Stock entry is unavailable.'};
 const batch=base.batches.find(b=>b.id===entry.batchId&&!b.deletedAt);
 if(!batch)return {success:false,error:'This older entry cannot be matched to a stock batch.'};
 const consumed=Math.max(0,Number(batch.qty)-Number(batch.remaining));
 if(!remove){
  if(input.qty===''||!Number.isSafeInteger(Number(input.qty))||Number(input.qty)<Math.max(1,consumed))errors.qty='Quantity cannot be less than the stock already used ('+consumed+').';
  for(const key of ['purchasePrice','sellingPrice'])if(input[key]===''||!Number.isFinite(Number(input[key]))||Number(input[key])<0)errors[key]='Enter a valid price, zero or more.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||(Number.isNaN(Date.parse(input.date))||new Date(input.date).toISOString().slice(0,10)!==input.date)||input.date>new Date().toLocaleDateString('en-CA'))errors.date='Choose today or an earlier date.';
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))errors.time='Enter a valid time.';
  if(Object.keys(errors).length)return {success:false,errors,error:'Check the highlighted fields.'};
 }
 const batches=base.batches.map(b=>b.id!==batch.id?b:remove?{...b,remaining:0,deletedAt:now}:{...b,qty:Number(input.qty),remaining:Number(input.qty)-consumed,purchasePrice:Number(input.purchasePrice),sellingPrice:Number(input.sellingPrice),date:input.date});
 const history=base.history.map(h=>h.id!==entryId?h:remove?{...h,deletedAt:now,deletedBy:actor}:{...h,qty:Number(input.qty),price:Number(input.purchasePrice),sellingPrice:Number(input.sellingPrice),receivedDate:input.date,at:input.date===(entry.receivedDate||entry.at.slice(0,10))&&input.time===new Date(entry.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})?entry.at:new Date(input.date+'T'+input.time+':00').toISOString(),modifiedAt:now,modifiedBy:actor});
 const latest=history.filter(h=>h.type==='PURCHASE'&&!h.deletedAt).sort((a,b)=>String(b.receivedDate||b.at).localeCompare(String(a.receivedDate||a.at))||String(b.at).localeCompare(String(a.at)))[0];
 history.push({id:crypto.randomUUID(),type:remove?'RESTOCK_DELETED':'RESTOCK_EDITED',at:now,by:actor,qty:0,price:entry.price,entryId,batchId:batch.id,before:{...entry},after:remove?null:{...history.find(h=>h.id===entryId)}});
 return {success:true,part:{...base,batches,history,stockQty:batches.filter(b=>!b.deletedAt).reduce((n,b)=>n+Number(b.remaining),0),costPrice:latest?.price??base.costPrice,sellingPrice:latest?.sellingPrice??base.sellingPrice}};
}
