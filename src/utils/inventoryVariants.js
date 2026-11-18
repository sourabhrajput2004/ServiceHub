import {partType,partErrors,isUniversalPart,cleanPartText} from './partsInventory';
import {inventoryDomain} from './shopInventoryTypes';
const norm=v=>cleanPartText(v).toLowerCase();
export const MAX_PART_VARIANTS=10;
export const blankVariant=()=>({variant:'',costPrice:0,sellingPrice:'',warrantyDays:0,stockQty:0,minThreshold:2,restockQty:5});
export const familyKey=(p,shop)=>[p.shopId||shop?.id||'shop_1',inventoryDomain(p,shop),p.brand,isUniversalPart(p)?'':p.model,p.partType==='Other'&&p.customPartType?p.customPartType:partType(p),'',isUniversalPart(p)?p.name:''].map(norm).join('|');
export function inventoryFamilies(rows,shop){
 const map=new Map();
 for(const row of rows){const key=row.parentId||familyKey(row,shop);if(!map.has(key))map.set(key,{...row,id:key,variants:[]});map.get(key).variants.push(row);}
 return [...map.values()].map(p=>({...p,totalStock:p.variants.filter(v=>!v.archivedAt).reduce((n,v)=>n+Number(v.stockQty||0),0)}));
}
export const familyTitle=p=>[p.brand==='Universal'?(p.name||'Universal'):p.model,partType(p)==='Other'?p.customPartType:partType(p)].filter(Boolean).join(' — ');
export function variantErrors(v){
 const e={};if(!String(v.variant||'').trim()||cleanPartText(v.variant).length>30)e.variant='Enter a variant name (1-30 characters).';
 for(const key of ['costPrice','sellingPrice'])if(v[key]===''||!Number.isFinite(Number(v[key]))||Number(v[key])<0||Number(v[key])>1e8)e[key]='Enter a valid price, zero or more.';
 for(const key of ['stockQty','minThreshold','restockQty','warrantyDays'])if(v[key]===''||v[key]===undefined||!Number.isSafeInteger(Number(v[key]))||Number(v[key])<0||Number(v[key])>1000000)e[key]='Enter a whole number, zero or more.';
 return e;
}
export function familyErrors(parent,variants,shop){
 const sample={...parent,...blankVariant(),name:isUniversalPart(parent)?parent.name:[parent.model,parent.partType==='Other'?parent.customPartType:parent.partType].filter(Boolean).join(' ')};
 const fields=partErrors(sample,shop);for(const key of ['variant','costPrice','sellingPrice','stockQty','minThreshold','restockQty'])delete fields[key];
 const rows=variants.map(variantErrors),names=variants.map(v=>norm(v.variant));names.forEach((name,i)=>{if(name&&names.indexOf(name)!==i)rows[i].variant='This variant name already exists.';});
 if(variants.length<1||variants.length>MAX_PART_VARIANTS)fields.variants='Keep between 1 and 10 variants per part.';
 return {fields,rows,valid:!Object.keys(fields).length&&rows.every(e=>!Object.keys(e).length)};
}
