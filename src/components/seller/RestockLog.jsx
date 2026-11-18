import React,{useState} from 'react';
import {useLanguage} from '../../context/LanguageContext';
export const restockEntries=variant=>(variant.history||[]).filter(h=>h.type==='PURCHASE'&&!h.deletedAt&&Number(h.qty)>0).map(h=>({...h,sortAt:(h.receivedDate||h.at?.slice(0,10)||'')+'T'+(h.at?.slice(11)||'00:00:00Z')})).sort((a,b)=>b.sortAt.localeCompare(a.sortAt));
export function restockDate(entry){
 const day=entry.receivedDate||entry.at?.slice(0,10)||'';
 const date=day?new Date(day+'T12:00:00'):null;
 const time=entry.at?new Date(entry.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'';
 return (date?date.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit'}):'—')+(time?', '+time:'');
}
export default function RestockLog({variant,onEdit,onDelete}){
 const {language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[limit,setLimit]=useState(10),entries=restockEntries(variant);
 const money=n=>'₹'+Number(n).toLocaleString('en-IN');
 return <details className="iv-restock-log"><summary>{t('Restock Log','स्टॉक आने का रिकॉर्ड')} ({entries.length})</summary><div className="iv-restock-log-body"><div className="iv-restock-table"><table><thead><tr>{[['Batch','बैच'],['Stock Quantity','स्टॉक के पीस'],['Purchase Price','खरीद कीमत'],['Selling Price','बेचने की कीमत'],['Time','समय'],['Date','तारीख'],['Actions','\u090f\u0915\u094d\u0936\u0928']].map(([en,hi])=><th key={en}>{t(en,hi)}</th>)}</tr></thead><tbody>{entries.slice(0,limit).map((h,i)=>{const day=h.receivedDate||h.at?.slice(0,10),time=h.at?new Date(h.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'—';return <tr key={h.id||i}><td title={h.batchId||''}>{t('Batch','बैच')} {entries.length-i}</td><td>+{h.qty} {t('pcs','पीस')}</td><td>{money(h.price)}</td><td>{h.sellingPrice===undefined?'—':money(h.sellingPrice)}</td><td><time>{time}</time></td><td>{day?new Date(day+'T12:00:00').toLocaleDateString('en-GB'):'—'}</td><td><div className="iv-log-actions"><button type="button" onClick={()=>onEdit?.(h)}>{t('Edit','\u092c\u0926\u0932\u0947\u0902')}</button><button type="button" className="iv-log-delete" onClick={()=>onDelete?.(h)}>{t('Delete','\u0939\u091f\u093e\u090f\u0901')}</button></div></td></tr>;})}</tbody></table></div>{!entries.length&&<p>{t('No restocks yet.','अभी स्टॉक नहीं आया है।')}</p>}{entries.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+10)}>{t('Show more','और देखें')}</button>}<footer>{t('Total Stock','कुल स्टॉक')}: <strong>{variant.stockQty} {t('pcs','पीस')}</strong></footer></div></details>;
}
