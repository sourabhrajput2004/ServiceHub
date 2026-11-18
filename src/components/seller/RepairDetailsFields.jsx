import React from 'react';
import {BusinessField} from './ServiceWorkspace';
import {useLanguage} from '../../context/LanguageContext';
import {repairDeviceType,offeredRepairServices} from '../../utils/repairDetails';
export default function RepairDetailsFields({form,onChange,shop,errors={}}){
 const {tr}=useLanguage(),services=offeredRepairServices(shop),selected=services.find(s=>s.id===form.serviceId);
 return <><div className="biz-form-grid"><BusinessField label={tr('Device type')} error={errors.deviceType}><input disabled value={repairDeviceType(shop,selected)} aria-label={tr('Device type')}/></BusinessField>{[['brand','Brand *','e.g. Samsung'],['model','Model *','e.g. Galaxy A54']].map(([key,label,placeholder])=><BusinessField key={key} label={tr(label)} error={errors[key]&&tr(errors[key])}><input required maxLength={100} value={form[key]||''} placeholder={tr(placeholder)} onChange={e=>onChange({...form,[key]:e.target.value})}/></BusinessField>)}</div><BusinessField label={tr('Select service *')} error={errors.serviceId&&tr(errors.serviceId)}><select required value={form.serviceId||''} onChange={e=>{const service=services.find(s=>s.id===e.target.value);onChange({...form,serviceId:e.target.value,issueType:service?.name||'',deviceType:repairDeviceType(shop,service)});}}><option value="" disabled>{tr(services.length?'Select service':'No services added yet')}</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></BusinessField></>;
}
