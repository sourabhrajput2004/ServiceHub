import {useInRouterContext,useLocation} from 'react-router-dom';
import {customerPaymentUrl} from '../../utils/paymentReturn';
import React from 'react';
import {useShop} from '../../context/ShopContext';
import {useLanguage} from '../../context/LanguageContext';
import CustomerInvoiceActions from '../seller/CustomerInvoiceActions';
export default function CustomerOnlinePayment({job,invoice,shop}){
 const routed=useInRouterContext(),location=routed?useLocation():null;
 const s=useShop(),{tr}=useLanguage(),[notice,setNotice]=React.useState('');
 return <section className="rw-payment"><p>{tr('PAYMENT')}</p>{job.isPaid?<><strong>{tr('Payment received')}</strong><p>{job.gatewayPaymentId||job.paymentMethod||''}</p></>:job.paymentUrl?<><strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(job.paymentAmountDue||0))}</strong><div className="rw-actions"><a className="rw-primary" href={customerPaymentUrl(job.paymentUrl,location?location.pathname+location.search+location.hash:'/customer-dashboard')} target="_blank" rel="noreferrer">{tr('Pay securely')}</a><button type="button" onClick={()=>{const result=s.requestPaymentAtShop(job.id);setNotice(result.success?'Pay-at-shop preference saved. Payment remains due until receipt is recorded.':result.error);}}>{tr('Pay at Shop')}</button></div><p>{tr('Your booking updates automatically after the payment gateway verifies payment.')}</p></>:<p>{tr('The shop will confirm the final amount and prepare your payment link. No account registration is needed to use the link.')}</p>}{invoice&&<CustomerInvoiceActions invoice={invoice} shop={shop} job={job}/>} {notice&&<p role="status">{notice}</p>}</section>;
}
