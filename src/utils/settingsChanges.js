const addressKeys=['houseNumber','street','city','state','pincode'];
export function settingsChanges(baseline,draft) {
 const changes={};
 for(const key of ['name','avatar','phone','email'])changes[key]=(draft[key]||'')!==(baseline[key]||'');
 changes.pending=JSON.stringify(draft.pending??null)!==JSON.stringify(baseline.pending??null);
 changes.notifications=['push','email','sms'].some(key=>Boolean(draft.notifications?.[key])!==Boolean(baseline.notifications?.[key]));
 changes.addresses=JSON.stringify(draft.addresses.map(item=>[item.id,Boolean(item.isDefault),...addressKeys.map(key=>item[key]||'')]))!==JSON.stringify(baseline.addresses.map(item=>[item.id,Boolean(item.isDefault),...addressKeys.map(key=>item[key]||'')]));
 return {...changes,any:Object.values(changes).some(Boolean)};
}
export function changedAddressError(baseline,addresses) {
 for(const item of addresses) {
  const before=baseline.find(value=>value.id===item.id);
  for(const key of addressKeys) {
   if(before&&(before[key]||'')===(item[key]||''))continue;
   if(!(item[key]||'').trim())return 'Complete the changed address fields before saving.';
   if(key==='pincode'&&!/^[1-9][0-9]{5}$/.test(item.pincode.trim()))return 'Enter a valid 6-digit PIN code.';
  }
 }
 return null;
}
