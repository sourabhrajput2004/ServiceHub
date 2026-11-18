import {Eye, MessageCircle, Printer, Download, Link2, Copy} from 'lucide-react';
import '../../styles/invoice-result.css';
import {cancelledInvoice} from '../../utils/invoiceLifecycle';
import React,{useEffect,useState} from 'react';
import {BusinessDialog} from './ServiceWorkspace';
import InvoiceDocument from './InvoiceDocument';
import {printInvoice} from '../../utils/invoiceDocument';
import {customerInvoicePdf,downloadInvoicePdf} from '../../utils/customerInvoicePdf';
import {paymentPhone} from '../../utils/paymentSharing';
import {paymentApi} from '../../utils/paymentApi';
import {pdfBase64,billWhatsAppUrl,billDownloadUrl,publicBillUrl} from '../../utils/billSharing';
import {whatsappContact} from '../../utils/orderFulfilment';
import {useLanguage} from '../../context/LanguageContext';
export default function CustomerInvoiceActions({invoice,shop,job,showWhatsapp=false}){
 const {language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[open,setOpen]=useState(false),[error,setError]=useState(''),[file,setFile]=useState(null),[sharing,setSharing]=useState(false),[published,setPublished]=useState(null),[password,setPassword]=useState(''),[needsPassword,setNeedsPassword]=useState(false),[notice,setNotice]=useState('');
 const recipient=paymentPhone(whatsappContact(job||{})||job?.customerPhone||invoice.customerPhone),shopName=invoice.supplierSnapshot?.shopName||shop?.shopName||'ServiceHub';
 useEffect(()=>{let active=true;setFile(null);setPublished(null);setNotice('');customerInvoicePdf(invoice,shop).then(({blob,filename})=>{if(active)setFile(new File([blob],filename,{type:'application/pdf'}));}).catch(()=>{if(active)setError('Unable to prepare the PDF. Please retry.');});return()=>{active=false;};},[invoice,shop]);
 const whatsapp=url=>billWhatsAppUrl({recipient,customerName:invoice.customerName||job?.customerName,shopName,invoiceId:invoice.id,url});
 const sharePdf=async()=>{
  if(!file||sharing)return;if(!recipient){setError('Add a valid customer WhatsApp or phone number first.');return;}setError('');setNotice('');setSharing(true);
  const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
  try{
   let record=published&&publicBillUrl(published.url)?published:null;
   if(!record){
    const config=await paymentApi('/config');if(config.shopId!==(invoice.shopId||job?.shopId||shop?.id||'shop_1'))throw Error('This bill belongs to a different shop than the configured backend.');
    if(config.localOperatorLogin||password){await paymentApi('/operator/login',{password});setPassword('');}
    record=await paymentApi('/bills',{invoiceId:invoice.id,pdf:await pdfBase64(file)});setPublished(record);setNeedsPassword(false);
   }
   const url=whatsapp(record.url);
   if(popup)popup.location.replace(url);else setNotice('Bill link ready. Use Open WhatsApp below if your browser blocked the new tab.');
  }catch(err){popup?.close();if(err.status===401){setNeedsPassword(true);setError('Connect the shop billing desk to publish this bill link.');}else setError(err.message);}finally{setSharing(false);}
 };
 const localOnly=published&&!publicBillUrl(published.url);
 return <><button type="button" className="bc-add invoice-action-customer" onClick={()=>setOpen(true)}><Eye size={18}/>{t('Customer bill','कस्टमर का बिल')}</button>
 {showWhatsapp&&!cancelledInvoice(invoice)&&<button type="button" className="bc-add invoice-action-whatsapp" disabled={!file||sharing} onClick={sharePdf}><MessageCircle size={18}/>{sharing?t('Preparing bill link...','बिल लिंक तैयार हो रहा है...'):!file?t('Preparing PDF...','PDF तैयार हो रही है...'):t('Send on WhatsApp','WhatsApp पर भेजें')}</button>}
 {needsPassword&&<label className="invoice-pdf-share-help">{t('Billing desk password','बिलिंग डेस्क पासवर्ड')}<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 {published&&!localOnly&&<div className="invoice-pdf-share-help"><p><Link2 size={16}/> {t('Customer bill PDF link','कस्टमर बिल PDF लिंक')}</p><div className="online-payment-link"><a className="bill-download-link" aria-label="Customer bill PDF link" href={billDownloadUrl(published.url)}>{billDownloadUrl(published.url)}</a><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(billDownloadUrl(published.url));setNotice('Bill link copied.');}catch{setNotice('Select and copy the bill link.');}}}><Copy size={16}/>{t('Copy','कॉपी')}</button><a href={published.url} target="_blank" rel="noreferrer">{t('View PDF','PDF देखें')}</a><a href={billDownloadUrl(published.url)}>{t('Download PDF','PDF डाउनलोड करें')}</a><a href={whatsapp(published.url)} target="_blank" rel="noreferrer">{t('Open WhatsApp','WhatsApp खोलें')}</a></div>{localOnly&&<p>{t('Local test link: a public HTTPS address is required for customers to open this on another phone or laptop.','स्थानीय टेस्ट लिंक: दूसरे फोन या लैपटॉप पर खोलने के लिए सार्वजनिक HTTPS पता चाहिए।')}</p>}</div>}
 {localOnly&&<p className="invoice-pdf-share-help">Public bill hosting is not configured yet. Localhost bill links will not be sent to customers.</p>}{notice&&<p role="status">{notice}</p>}{error&&!open&&<p className="biz-error" role="alert">{error}</p>}
 {open&&<BusinessDialog className="bc-dialog" title={t('Customer bill','कस्टमर का बिल')} onClose={()=>setOpen(false)}><InvoiceDocument invoice={invoice} shop={shop} audience="customer"/>{error&&<p className="biz-error">{error}</p>}<div className="bc-actions"><button type="button" disabled={!file} onClick={()=>downloadInvoicePdf(file)}><Download size={18}/>{t('Download PDF','PDF डाउनलोड करें')}</button><button type="button" className="biz-primary" onClick={()=>{if(!printInvoice(invoice,shop))setError('Allow pop-ups to print your bill.');}}><Printer size={18}/>{t('Print customer bill','कस्टमर बिल प्रिंट करें')}</button></div></BusinessDialog>}</>;
}
