export const personNameInput=value=>String(value??'').replace(/[^\p{L}\p{M} ]/gu,'');
export function distinctPhoneErrors(form,fields){
 const seen=new Map(),errors={};
 for(const key of fields){
  if(/whatsapp/i.test(key))continue;
  const value=String(form[key]||'').replace(/\D/g,'').replace(/^(?:91)(?=\d{10}$)/,'');
  if(!value)continue;
  if(seen.has(value))errors[key]='This number is already used in another contact field. Enter a different number.';
  else seen.set(value,key);
 }
 return errors;
}
