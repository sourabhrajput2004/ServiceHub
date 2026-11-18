import {useNavigate} from 'react-router-dom';
import '../../styles/fulfilment.css';
import {useAuth} from '../../context/AuthContext';
import React,{useState} from 'react';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import {validWhatsapp} from '../../utils/orderFulfilment';
import {printInvoice} from '../../utils/invoiceDocument';
export default function FulfilmentDesk({shop,jobIds}){
 const navigate=useNavigate(),{user}=useAuth(),s=useShop(),{language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en;
 const [notice,setNotice]=useState('');
 const rows=s.messagingQueue.filter(r=>r.shopId===shop.id&&(!jobIds||jobIds.has(r.jobId)));
 return <section className="bc-panel fulfilment-desk"><h2>{t('Billing notifications','\u092c\u093f\u0932\u093f\u0902\u0917 \u0915\u0947 \u0928\u094b\u091f\u093f\u092b\u093f\u0915\u0947\u0936\u0928')}</h2><p>{t("Messages are queued. Automatic WhatsApp sending is unavailable.","मैसेज कतार में हैं। WhatsApp पर अपने आप भेजने की सुविधा उपलब्ध नहीं है।")}</p>
 {notice&&<p role="status">{notice}</p>}
 {!rows.length?<p>{t('No pending handoffs.','अभी कोई अपडेट नहीं है।')}</p>:rows.map(r=><article className="bc-charge" key={r.id}><div><strong>{r.jobId} · {tr(r.kind)}</strong><p>{t(r.status,r.status==='Counter action required'?'काउंटर पर बिल बनाना है':r.status==='WhatsApp number required'?'WhatsApp नंबर चाहिए':'WhatsApp सर्विस जोड़ना बाकी है')}</p>{r.dueAt&&<small>{t('Billing target: within 2 minutes of payment completion. Charges must be entered by counter.','\u092a\u0947\u092e\u0947\u0902\u091f \u092a\u0942\u0930\u0940 \u0939\u094b\u0928\u0947 \u0915\u0947 2 \u092e\u093f\u0928\u091f में बिल बनाएँ। चार्ज काउंटर पर भरने होंगे।')}</small>}</div><div className="fulfilment-actions">{r.kind==='Bill required'&&<button className="biz-primary" onClick={()=>navigate((user?.role==='shop_owner'?'/shop/billing/new':'/staff/orders/bill/new')+'?job='+encodeURIComponent(r.jobId))}>{t('Prepare final bill','फाइनल बिल बनाएँ')}</button>}{validWhatsapp(r.recipient)&&r.text&&<a className="bc-add" href={'https://wa.me/91'+r.recipient+'?text='+encodeURIComponent(r.text)} target="_blank" rel="noreferrer">{t('Open WhatsApp to send','WhatsApp पर भेजें')}</a>}{r.invoiceId&&<button onClick={()=>{const bill=s.invoices.find(i=>i.id===r.invoiceId);if(bill&&!printInvoice(bill,shop))setNotice(t('Allow pop-ups to print or save your invoice.','बिल प्रिंट या सेव करने के लिए पॉपअप चालू करें।'));}}>{t('Print / Save PDF','प्रिंट / PDF सेव करें')}</button>}</div></article>)}
 </section>;
}
