import {shopTypes} from './shopInventoryTypes.js';
export function repairDeviceType(shop,service){
 const types=shopTypes(shop);
 if(types.length===1)return types[0]==='mobile'?'Smartphone':'Home Appliances';
 const devices=service?.appliesTo||[],mobile=devices.some(v=>['Phone','Smartphone','Mobile Phones'].includes(v)),appliances=devices.some(v=>['Home Appliance','Home Appliances','TV / Audio'].includes(v));
 return mobile&&!appliances?'Smartphone':appliances&&!mobile?'Home Appliances':types.length?'Smartphone / Home Appliances':'';
}
export const offeredRepairServices=shop=>(shop?.services||[]).filter(s=>!s.archivedAt&&!s.deletedAt&&s.active!==false);
export function repairDetailsErrors(form,shop){const e={};if(String(form.brand||'').trim().length<2)e.brand='Enter the device brand.';if(String(form.model||'').trim().length<1)e.model='Enter the device model.';if(!offeredRepairServices(shop).some(s=>s.id===form.serviceId))e.serviceId='Select a service provided by this shop.';if(!repairDeviceType(shop))e.deviceType='Shop type is missing. Update the shop registration details.';return e;}
export function repairDetailsPayload(form,shop){const service=offeredRepairServices(shop).find(s=>s.id===form.serviceId);return {brand:String(form.brand||'').trim(),model:String(form.model||'').trim(),deviceBrand:[form.brand,form.model].map(v=>String(v||'').trim()).filter(Boolean).join(' '),deviceType:repairDeviceType(shop,service),serviceId:service?.id||'',issueType:service?.name||'',requiredSkill:service?.requiredSkill||''};}
