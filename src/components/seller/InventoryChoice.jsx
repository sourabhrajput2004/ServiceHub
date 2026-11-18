import React,{useState} from 'react';
import {BusinessField} from './ServiceWorkspace';
import {useLanguage} from '../../context/LanguageContext';
export default function InventoryChoice({label,value,options,onChange,error,maxLength=100,placeholder}){
 const {tr}=useLanguage(),[manual,setManual]=useState(false),values=[...new Set([...options,...(value?[value]:[])])];
 return <BusinessField label={label} error={error}><select value={manual?'__new__':value||''} onChange={e=>{setManual(e.target.value==='__new__');onChange(e.target.value==='__new__'?'':e.target.value);}}><option value="">{tr('Choose an option')}</option>{values.map(v=><option key={v} value={v}>{v}</option>)}<option value="__new__">{tr('Add a new name')}</option></select>{manual&&<input type="text" maxLength={maxLength} value={value||''} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</BusinessField>;
}
