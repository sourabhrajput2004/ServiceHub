export function addressSummary(item) {
 const parts = item.street !== undefined ? [item.houseNumber, item.street] : [item.line];
 for (const part of [item.locality, item.city, item.state, item.pincode]) {
  if (part && !parts.filter(Boolean).join(', ').toLowerCase().includes(part.toLowerCase())) parts.push(part);
 }
 return parts.filter(Boolean).join(', ');
}
export function addressDraft(item) {
 return {...item, houseNumber:item.houseNumber||'',street:item.street??[item.line,item.locality].filter(Boolean).filter((part,index,all)=>index===0||!all[0].toLowerCase().includes(part.toLowerCase())).join(', '),city:item.city||'Ghaziabad',state:item.state||'Uttar Pradesh',pincode:item.pincode||''};
}
