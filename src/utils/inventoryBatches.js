const uid=()=> 'B-'+crypto.randomUUID();
const today=()=>new Date().toISOString().slice(0,10);
const total=rows=>rows.filter(b=>!b.deletedAt).reduce((n,b)=>n+Number(b.remaining),0);
export function stockBatches(part){
 if(Array.isArray(part.batches))return part.batches.map(b=>({...b}));
 const qty=Number(part.stockQty)||0;
 return qty?[{id:'opening-'+part.id,qty,remaining:qty,purchasePrice:Number(part.costPrice)||0,date:(part.history?.find(h=>h.type==='PURCHASE')?.at||today()).slice(0,10),legacy:true}]:[];
}
export function receiveBatch(part,qty,price,date=today()){
 const batches=[...stockBatches(part),{id:uid(),qty:Number(qty),remaining:Number(qty),purchasePrice:Number(price),date,createdAt:new Date().toISOString()}];
 return {...part,batches,stockQty:total(batches)};
}
export function takeBatches(part,qty,preferred=''){
 const batches=stockBatches(part),ordered=batches.filter(b=>!b.deletedAt).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id)));
 if(preferred){const i=ordered.findIndex(b=>b.id===preferred);if(i<0||ordered[i].remaining<=0)throw Error('Selected batch is no longer available. Choose another batch.');ordered.unshift(...ordered.splice(i,1));}
 let left=Number(qty);if(!Number.isSafeInteger(left)||left<0||total(batches)<left)throw Error('Not enough stock in the selected part.');
 const allocations=[];for(const b of ordered){const n=Math.min(left,Number(b.remaining));if(n){b.remaining-=n;left-=n;allocations.push({batchId:b.id,qty:n,purchasePrice:Number(b.purchasePrice),date:b.date});}if(!left)break;}
 return {part:{...part,batches,stockQty:total(batches)},allocations,cost:allocations.reduce((n,b)=>n+b.qty*b.purchasePrice,0)};
}
export function returnBatches(part,allocations=[],qty=0,cost=part.costPrice){
 const batches=stockBatches(part);let restored=0;
 for(const a of allocations){let b=batches.find(b=>b.id===a.batchId);if(!b){b={id:a.batchId,qty:0,remaining:0,purchasePrice:Number(a.purchasePrice)||0,date:a.date||today()};batches.push(b);}b.remaining+=Number(a.qty);b.qty=Math.max(b.qty,b.remaining);restored+=Number(a.qty);}
 const legacy=Math.max(0,Number(qty)-restored);if(legacy)batches.push({id:uid(),qty:legacy,remaining:legacy,purchasePrice:Number(cost)||0,date:today(),legacy:true});
 return {...part,batches,stockQty:total(batches)};
}
// Reconcile explicit owner stock adjustments without rewriting old batch costs.
export function reconcileBatches(part){
 if(!Array.isArray(part.batches))return {...part,batches:stockBatches(part)};
 const delta=Number(part.stockQty)-total(part.batches);
 if(delta>0)return receiveBatch({...part,stockQty:total(part.batches)},delta,part.costPrice);
 if(delta<0)return takeBatches(part,-delta).part;
 return part;
}
export function allocateBillBatches(stock,items,previous=[],credits=[]){
 const map=new Map(stock.map(p=>[p.id,reconcileBatches(p)]));
 for(const line of previous.filter(l=>l.isInventoryPart)){const p=map.get(line.inventoryItemId);if(p)map.set(p.id,returnBatches(p,line.batchAllocations,Number(line.qty),line.unitCost??p.costPrice));}
 const availableCredits=credits.map(c=>({...c,qty:Number(c.qty),batchAllocations:(c.batchAllocations||[]).map(a=>({...a}))}));
 const resolved=items.map(line=>{
  if(!line.isInventoryPart)return line;
  let qty=Number(line.qty),allocations=[];let p=map.get(line.inventoryItemId);if(!p)throw Error('Stock part unavailable.');
  for(const credit of availableCredits.filter(c=>c.inventoryItemId===p.id)){const used=Math.min(qty,credit.qty);if(!used)continue;let left=used;for(const a of credit.batchAllocations){const n=Math.min(left,a.qty);if(n){allocations.push({...a,qty:n});a.qty-=n;left-=n;}}if(left)allocations.push({batchId:'issued-'+p.id,qty:left,purchasePrice:Number(p.costPrice)||0,date:today()});credit.qty-=used;qty-=used;}
  const taken=takeBatches(p,qty,qty?line.preferredBatchId:'');map.set(p.id,taken.part);allocations.push(...taken.allocations);
  const cost=allocations.reduce((n,a)=>n+a.qty*a.purchasePrice,0);
  return {...line,batchAllocations:allocations,costTotal:cost,unitCost:cost/Number(line.qty)};
 });
 return {items:resolved,stock:stock.map(p=>map.get(p.id))};
}
export const batchCost=invoice=>(invoice.items||[]).filter(l=>l.isInventoryPart).reduce((n,l)=>n+Number(l.costTotal||0),0);
export function batchProfitRows(invoices){
 const rows=new Map();
 for(const inv of invoices){if(inv.cancelledAt||String(inv.status||inv.paymentStatus).toLowerCase()==='cancelled')continue;
  for(const line of inv.items||[])for(const a of line.batchAllocations||[]){
   const month=String(inv.date||inv.createdAt).slice(0,7),key=[month,line.inventoryItemId,a.batchId].join('|');
   if(!rows.has(key))rows.set(key,{key,month,name:line.name,variant:line.variant,batchId:a.batchId,qty:0,revenue:0,cost:0});
   const row=rows.get(key);row.qty+=a.qty;row.revenue+=a.qty*Number(line.rate);row.cost+=a.qty*a.purchasePrice;
  }
 }
 return [...rows.values()].map(r=>({...r,profit:r.revenue-r.cost})).sort((a,b)=>b.month.localeCompare(a.month));
}
