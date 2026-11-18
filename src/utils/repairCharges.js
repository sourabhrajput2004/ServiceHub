import {serviceMode,parseMapCoordinates} from './repairService';
import {distanceKm} from './nearbyShops';
import {homeServiceRate,homeServiceTotal} from './homeServiceCharge';
export function repairCharges(job,shop,inventory=[]){
 if(job?.chargeSnapshot)return job.chargeSnapshot;
 const services=(job?.performedServices||[]).map(s=>({name:s.name,serviceId:s.serviceId,qty:1,rate:Number(s.labourCharge),warrantyDays:s.warrantyDays,kind:'service'}));
 const pending=(job?.partRequests||[]).some(r=>['Pending','Acknowledged'].includes(r.status));
 const parts=(job?.partRequests||[]).filter(r=>['Approved','Issued'].includes(r.status)).map(r=>{const p=inventory.find(p=>p.id===r.inventoryItemId);return {name:r.partName||p?.name,inventoryItemId:r.inventoryItemId,qty:Number(r.quantity),rate:Number(r.sellingPrice??p?.sellingPrice),variant:r.variant??p?.variant,warrantyDays:r.warrantyDays??p?.warrantyDays,isInventoryPart:true,kind:'part'};});
 const charges={};let error=pending?'Approve or reject pending parts before finalizing the charge.':'';
 if(serviceMode(job)==='home'){
  const rate=homeServiceRate(shop),km=distanceKm(shop?.coordinates,job.serviceCoordinates||parseMapCoordinates(job.googleMapsUrl));
  if(rate!==null){if(km===null)error='Save shop and customer map locations to calculate the home service charge.';else{const rounded=Math.round(km*100)/100;charges.homeService={enabled:true,distanceKm:rounded,ratePerKm:rate,amount:homeServiceTotal(rounded,rate)};}}
 }
 const items=[...services,...parts,...Object.entries(charges).map(([key,c])=>({name:'Home Service Charge',kind:'charge',chargeKey:key,qty:1,rate:c.amount,distanceKm:c.distanceKm,ratePerKm:c.ratePerKm}))];
 if(items.some(p=>!Number.isFinite(p.rate)||p.rate<0||!Number.isInteger(p.qty)||p.qty<1))error='A service or part has an invalid price or quantity.';
 const total=Math.round(items.reduce((sum,p)=>sum+p.qty*p.rate,0)*100)/100;
 if(!error&&(!services.length&&!parts.length||total<=0))error='Add services or approved parts before creating the payment link.';
 return {services,parts,charges,items,total,error};
}
