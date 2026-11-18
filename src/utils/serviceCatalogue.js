export const SERVICE_CATEGORIES=['Screen','Battery','Motherboard','Charging','Software','Cleaning','Other'];
export const SERVICE_DEVICES=['Phone','Laptop','Tablet','Smartwatch','Home Appliance','TV / Audio'];
export const SERVICE_SKILLS=['Screen','Battery','Motherboard','Charging','General','Charging Port','Software','Cleaning'];
export const SERVICE_TIMES=['30 min','1 hour','2 hours','4 hours','1 day'];
export function serviceTime(value){const key=String(value||'').toLowerCase().replace(/\s+/g,'');return ({'30min':'30 min','30mins':'30 min','30minutes':'30 min','1hour':'1 hour','1hr':'1 hour','2hours':'2 hours','2hrs':'2 hours','4hours':'4 hours','4hrs':'4 hours','1day':'1 day'})[key]||value||'';}
export const serviceLabour=s=>Number(s.labourCharge??s.price??0);
export function serviceStartingFrom(s){
 if((s.labourCharge??s.price)===''||(s.labourCharge??s.price)==null)return null;
 if(s.requiresParts&&(s.cheapestPartPrice===''||s.cheapestPartPrice==null))return null;
 return Math.round((serviceLabour(s)+(s.requiresParts?Number(s.cheapestPartPrice):0))*100)/100;
}
export const serviceDefaults=s=>({name:'',labourCharge:'',time:'',description:'',category:'',appliesTo:[],warrantyDays:'',requiresParts:false,cheapestPartPrice:'',startingFromOverride:null,requiredSkill:'',...s,labourCharge:s?.labourCharge??s?.price??'',time:serviceTime(s?.time),warrantyDays:s?.warrantyDays??'',appliesTo:[...(s?.appliesTo||[])]});
const validMoney=v=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1000000;
export function serviceErrors(s){
 const e={};if(String(s.name||'').trim().length<3||String(s.name||'').length>100)e.name='Enter a service name (3–100 characters).';
 if(!SERVICE_CATEGORIES.includes(s.category))e.category='Choose a category.';
 if(!validMoney(s.labourCharge??s.price))e.labourCharge='Enter a valid labour charge between ₹0 and ₹10,00,000.';
 if(!SERVICE_TIMES.includes(serviceTime(s.time)))e.time='Choose an estimated time.';
 if(typeof s.requiresParts!=='boolean')e.requiresParts='Choose whether this service requires parts.';
 if(s.requiresParts&&!validMoney(s.cheapestPartPrice))e.cheapestPartPrice='Enter the cheapest part price for the starting estimate.';
 if(s.warrantyDays!==''&&s.warrantyDays!=null&&(!Number.isInteger(Number(s.warrantyDays))||Number(s.warrantyDays)<0||Number(s.warrantyDays)>3650))e.warrantyDays='Enter warranty days between 0 and 3650.';
 if(String(s.description||'').length>500)e.description='Use up to 500 characters.';
 return e;
}
export function normalizeService(s){
 const labour=serviceLabour(s),value={...s,name:String(s.name||'').trim(),pricingVersion:2,labourCharge:labour,price:labour,time:serviceTime(s.time),cheapestPartPrice:s.requiresParts?Number(s.cheapestPartPrice):null,startingFromOverride:null,warrantyDays:s.warrantyDays===''||s.warrantyDays==null?null:Number(s.warrantyDays),description:String(s.description||'').trim(),linkedPartIds:[]};
 delete value.overrideStartingFrom;return {...value,startingFrom:serviceStartingFrom(value)};
}
export const serviceWarranty=rows=>rows.filter(p=>p.serviceId&&p.warrantyDays!==''&&p.warrantyDays!=null&&Number.isInteger(Number(p.warrantyDays))).map(p=>p.name+': '+(Number(p.warrantyDays)>0?p.warrantyDays+' days warranty':'No warranty')).join('\n');
