import {TYPE_PARTS,TYPE_BRANDS,shopTypes,inventoryDomain} from './shopInventoryTypes';
export const PART_TYPES=[...new Set(Object.values(TYPE_PARTS).flat())];
export const PART_BRANDS=[...new Set(Object.values(TYPE_BRANDS).flat())];
export const partType=p=>p.partType||({'Displays':'Touch Screen','Batteries':'Battery','Ports & PCBs':'Charging Socket'}[p.category])||'Other';
export const partSearchText=p=>[p.brand,p.model,partType(p),p.customPartType,p.name,p.variant,p.sku].join(' ').toLowerCase();
export const partKey=p=>[p.inventoryDomain,p.brand,isUniversalPart(p)?'':p.model,p.partType==='Other'&&p.customPartType?p.customPartType:partType(p),'',p.variant,isUniversalPart(p)?p.name:''].map(v=>String(v||'').normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase()).join('|');
export const cleanPartText=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/gu,' ');
export const isUniversalPart=p=>cleanPartText(p.brand).toLowerCase()==='universal';
export const samePartText=(a,b)=>cleanPartText(a).toLowerCase()===cleanPartText(b).toLowerCase();
export function normalizePartDetails(input){return {...input,brand:isUniversalPart(input)?'Universal':cleanPartText(input.brand),model:isUniversalPart(input)?'':cleanPartText(input.model),partType:cleanPartText(input.partType==='Other'&&input.customPartType?input.customPartType:input.partType),customPartType:'',name:cleanPartText(input.name)};}
export function savedPartValues(rows,shopId,key,{domain='',brand='',removed=false}={}){const values=new Map();for(const p of rows){if((p.shopId||'shop_1')!==shopId||p.archivedAt&&!removed||domain&&p.inventoryDomain!==domain||brand&&!samePartText(p.brand,brand))continue;const value=cleanPartText(key==='partType'?partType(p):p[key]);if(value&&!values.has(value.toLowerCase()))values.set(value.toLowerCase(),value);}return [...values.values()].sort((a,b)=>a.localeCompare(b));}
export function partErrors(p,shop){
 const e={},types=shopTypes(shop),domain=p.inventoryDomain||(types.length===1?types[0]:'');if(shop&&!types.includes(domain))e.inventoryDomain='Choose a shop type for this part.';
 const text=(key,min,max,message)=>{const v=cleanPartText(p[key]);if(v.length<min||v.length>max||!/[\p{L}\p{N}]/u.test(v)||/[<>\u0000-\u001f]/u.test(String(p[key]||'')))e[key]=message;};
 text('brand',2,80,'Enter a brand name (2-80 characters).');if(!isUniversalPart(p))text('model',1,100,'Enter a model name (1-100 characters).');text('partType',2,100,'Enter a part type (2-100 characters).');
 if(p.partType==='Other'&&p.customPartType!==undefined&&p.customPartType!=='')text('customPartType',2,100,'Enter the part type.');
 text('name',2,220,'Enter the part name.');if(!cleanPartText(p.variant)||cleanPartText(p.variant).length>30)e.variant='Enter a variant name (1-30 characters).';
 for(const key of ['costPrice','sellingPrice'])if(p[key]===''||!Number.isFinite(Number(p[key]))||Number(p[key])<0)e[key]='Enter a valid price per unit.';
 for(const key of ['stockQty','minThreshold',...(p.restockQty!==undefined?['restockQty']:[])])if(p[key]===''||!Number.isSafeInteger(Number(p[key]))||Number(p[key])<0)e[key]='Enter a whole number, zero or more.';
 if(String(p.notes||'').length>1000)e.notes='Use up to 1000 characters.';return e;
}

export function filterParts(parts,f){return parts.filter(p=>(!p.archivedAt||f.removed)&&(!f.domain||inventoryDomain(p,f.shop)===f.domain)&&partSearchText(p).includes((f.search||'').toLowerCase().trim())&&(!f.brand||samePartText(p.brand,f.brand))&&(!f.type||samePartText(partType(p),f.type))&&(!f.low||Number(p.stockQty)<=Number(p.minThreshold||0))&&(!f.zero||Number(p.stockQty)===0)).sort((a,b)=>f.sort==='stock'?a.stockQty-b.stockQty:f.sort==='type'?partType(a).localeCompare(partType(b)):String(a.brand||'').localeCompare(String(b.brand||''))||String(a.model||'').localeCompare(String(b.model||'')));}
