import {repairCharges} from '../../utils/repairCharges';
import React,{useState} from 'react';
import {useShop} from '../../context/ShopContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import './repair-work-items.css';

export default function RepairWorkItems({job,readOnly=false,mode}){
 const shop=useShop(),work=useWorkforce(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en;
 const [serviceId,setServiceId]=useState(''),[partId,setPartId]=useState(''),[quantity,setQuantity]=useState(1),[message,setMessage]=useState(''),[error,setError]=useState('');
 const services=(shop.shops.find(s=>s.id===(job.shopId||'shop_1'))?.services||[]).filter(s=>!s.archivedAt);
 const parts=shop.inventory.filter(p=>!p.archivedAt&&(p.shopId||'shop_1')===(job.shopId||'shop_1'));
 const charge=repairCharges(job,shop.shops.find(s=>s.id===(job.shopId||'shop_1')),shop.inventory);
 const selectedAdded=job.performedServices?.some(v=>v.serviceId===serviceId);
 const add=type=>{const result=work.addWorkUpdate(job.id,type,type==='service'?{serviceId}:{inventoryItemId:partId,quantity});setError(result.success?'':result.error);setMessage(result.success?t(type==='service'?'Service added to this job.':'Part added and inventory updated.','जानकारी सेव हो गई।'):'');if(result.success){if(type!=='service'){setPartId('');setQuantity(1);}}};
 return <section className="bc-panel repair-work-items">{!mode&&<h3>{t('Services & parts','सेवाएँ और पार्ट्स')}</h3>}{!mode&&null}
 <div className={"repair-work-grid"+(mode?" repair-work-single":"")}>{mode!=='part'&&<><fieldset disabled={readOnly}><legend>{t('Add service','सेवा जोड़ें')}</legend><label>{t('Service','सेवा')}<select value={serviceId} onChange={e=>setServiceId(e.target.value)}><option value="">{t('Choose a service','सेवा चुनें')}</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>{!services.length&&<small>{t('No services in this shop catalogue.','दुकान में कोई सेवा उपलब्ध नहीं है।')}</small>}<button type="button" className="rw-primary" disabled={!serviceId||selectedAdded} onClick={()=>add('service')}>{t('Add service','सेवा जोड़ें')}</button></fieldset></>}{mode!=='service'&&<><fieldset disabled={readOnly}><legend>{t('Add inventory part','इन्वेंटरी से पार्ट जोड़ें')}</legend><label>{t('Part & variant','पार्ट और वेरिएंट')}<select value={partId} onChange={e=>setPartId(e.target.value)}><option value="">{t('Choose a part','पार्ट चुनें')}</option>{parts.map(p=><option key={p.id} value={p.id} disabled={Number(p.stockQty)<1}>{[p.brand,p.model,p.name,p.variant].filter(Boolean).join(' · ')} — {p.stockQty} in stock</option>)}</select></label><label>{t('Quantity','संख्या')}<input type="number" min="1" max="100" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><small>{t('Adding a part deducts its quantity from inventory immediately.','मालिक की मंज़ूरी के बाद स्टॉक जारी होगा।')}</small><button type="button" className="rw-primary" disabled={!partId} onClick={()=>add('part')}>{t('Add Part','मंज़ूरी के लिए पार्ट जोड़ें')}</button></fieldset></>}</div>

 {!mode&&<div className="repair-added-services"><div><strong>{t('Total','\u0915\u0941\u0932')}</strong><strong>{'\u20b9'}{charge.total.toFixed(2)}</strong></div></div>}
 {error&&<p className="biz-error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}</section>;
}
