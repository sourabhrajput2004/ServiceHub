import useShopUpi from '../../hooks/useShopUpi';
import RepairPayment from './RepairPayment';
import '../../styles/fulfilment.css';
import React,{useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {useShop} from '../../context/ShopContext';
import {useAuth} from '../../context/AuthContext';
import {useWorkforce} from '../../context/WorkforceContext';
import {useLanguage} from '../../context/LanguageContext';
import {homeCollectionAllowed,upiLink} from '../../utils/orderFulfilment';
import {BusinessDialog} from './ServiceWorkspace';
export default function HomeServicePayment({job,readOnly}){
 const s=useShop(),w=useWorkforce(),{user}=useAuth(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en;
 const [mode,setMode]=useState('UPI'),[confirm,setConfirm]=useState(false),[notice,setNotice]=useState(''),[qr,setQr]=useState('');
 const member=w.members.find(m=>m.id===user?.id),allowed=homeCollectionAllowed(job,member),bill=s.invoices.find(i=>i.bookingId===job.id&&i.status!=='Cancelled'),shop=s.shops.find(v=>v.id===(job.shopId||'shop_1'));
 const [vpa]=useShopUpi(job.shopId||'shop_1');const link=upiLink(vpa,shop?.shopName,bill?.dueAmount);
 useEffect(()=>{let active=true;setQr('');if(allowed&&link)QRCode.toDataURL(link,{width:240,margin:2}).then(url=>{if(active)setQr(url);}).catch(()=>{if(active)setNotice(t('Unable to generate QR. Use the UPI app link.','QR नहीं बन पाया। UPI ऐप लिंक इस्तेमाल करें।'));});return()=>{active=false;};},[allowed,link]);
 if(!allowed)return null;if(!bill)return <RepairPayment job={job} readOnly={readOnly} technician/>;
 return <section className="bc-panel home-payment"><h3>{t('Home service · Payment','होम सर्विस · पेमेंट')}</h3>{!bill?<p>{t('Repair is ready. Ask the counter to prepare the final bill before collecting payment.','रिपेयर तैयार है। पेमेंट लेने से पहले काउंटर से फाइनल बिल बनवाएँ।')}</p>:Number(bill.dueAmount)===0?<p>{t('Payment recorded.','पेमेंट रिकॉर्ड हो गई।')}</p>:<><p>{t('Balance to collect','लेने बाकी हैं')}: <strong>₹{bill.dueAmount}</strong> · {bill.id}</p><div className="wf-actions">{['UPI','Cash'].map(v=><button key={v} aria-pressed={mode===v} onClick={()=>setMode(v)}>{t(v,v==='Cash'?'कैश':'UPI')}</button>)}</div>{mode==='UPI'?link?<><p>{vpa}</p>{qr&&<img width="240" height="240" src={qr} alt="UPI payment QR" style={{background:'white',borderRadius:12}}/>}<a className="bc-add" href={link}>{t('Pay using UPI app','UPI ऐप से पेमेंट करें')}</a><p>{t('Payment stays pending until the shop confirms receipt. Scanning QR does not confirm payment.','दुकान पर पेमेंट मिलने की पुष्टि तक पेमेंट बाकी रहेगी। QR स्कैन करना पेमेंट की पुष्टि नहीं है।')}</p></>:<p>{t('Ask the owner to add the shop UPI ID on the dashboard.','मालिक से डैशबोर्ड पर दुकान की UPI ID जोड़ने को कहें।')}</p>:<><p>{t('Confirm only after receiving cash. This is a recorded declaration.','कैश मिलने के बाद ही पुष्टि करें। यह रिकॉर्ड में रहेगा।')}</p><button className="biz-primary" disabled={readOnly} onClick={()=>setConfirm(true)}>{t('Cash collected','कैश मिल गया')} · ₹{bill.dueAmount}</button></>}</>}{notice&&<p role="status">{notice}</p>}{confirm&&<BusinessDialog title={t('Confirm cash received','कैश मिलने की पुष्टि करें')} onClose={()=>setConfirm(false)}><p>₹{bill?.dueAmount} · {bill?.id}</p><p>{t('False confirmation may lead to account suspension.','गलत पुष्टि करने पर अकाउंट बंद हो सकता है।')}</p><div className="bc-actions"><button onClick={()=>setConfirm(false)}>{t('Cancel','कैंसल')}</button><button disabled={readOnly} onClick={()=>{const r=s.collectHomeCash(job.id);setNotice(r.success?t('Cash recorded. Task completed.','कैश रिकॉर्ड हो गया। काम पूरा हो गया।'):r.error);setConfirm(false);}}>{t('Yes, cash received','हाँ, कैश मिल गया')}</button></div></BusinessDialog>}</section>;
}
