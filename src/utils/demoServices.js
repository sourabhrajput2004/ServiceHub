// Remove only the original, unedited demo entries. Owner-created/edited services
// and historical booking/invoice snapshots are never changed by this migration.
const demos={
 shop_1:[['srv_1','Screen Replacement',1800,'2 Hours'],['srv_2','Motherboard Chip-level Repair',2500,'1 Day'],['srv_3','Battery Replacement',999,'1 Hour'],['srv_4','Thermal Paste & Deep Cleaning',650,'45 Mins']],
 shop_2:[['srv_5','LED TV Panel Repair',3200,'1-2 Days'],['srv_6','Inverter PCB Repair',1200,'3 Hours']]
};
export function removeUntouchedDemoServices(shop){
 return (shop.services||[]).filter(service=>!Object.keys(service).every(key=>['id','name','price','time'].includes(key))||!(demos[shop.id]||[]).some(([id,name,price,time])=>service.id===id&&service.name===name&&service.price===price&&service.time===time));
}
