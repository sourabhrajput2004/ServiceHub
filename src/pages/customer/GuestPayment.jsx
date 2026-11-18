import React,{useEffect,useRef,useState} from 'react';
import {useParams,useNavigate,useLocation} from 'react-router-dom';
import {paymentReturnPath} from '../../utils/paymentReturn';
import {ShieldCheck, CheckCircle2, RefreshCw, LockKeyhole} from 'lucide-react';
import {paymentApi,openRazorpayCheckout} from '../../utils/paymentApi';
import ThemeSwitch from '../../components/common/ThemeSwitch';
import LanguageSwitch from '../../components/common/LanguageSwitch';
import {useLanguage} from '../../context/LanguageContext';
import '../../styles/online-payment.css';
export default function GuestPayment(){
 const {token}=useParams(),{tr}=useLanguage(),[payment,setPayment]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),alive=useRef(true);
 const load=async()=>{try{const result=await paymentApi('/guest/'+token);if(alive.current){setPayment(result);setError('');}}catch(err){if(alive.current)setError(err.message);}};
 useEffect(()=>{alive.current=true;setPayment(null);load();const timer=setInterval(load,5000);return()=>{alive.current=false;clearInterval(timer);};},[token]);
 const pay=async()=>{if(busy)return;setBusy(true);setError('');try{await openRazorpayCheckout(token,{onSuccess:result=>{if(alive.current){setPayment(result);setBusy(false);setMessage('Your payment is completed.');}},onPending:result=>{if(alive.current){setPayment(result);setBusy(false);setMessage('Payment is processing. Keep this page open or check again shortly.');}},onError:err=>{if(alive.current){setBusy(false);setError(err.message);}},onClose:()=>{if(alive.current)setBusy(false);}});}catch(err){setBusy(false);setError(err.message);}};
 const refresh=async()=>{if(busy)return;setBusy(true);try{setPayment(await paymentApi('/guest/'+token+'/refresh',{}));setError('');}catch(err){setError(err.message);}finally{setBusy(false);}};
 const paid=payment?.status==='paid',expired=payment?.expiresAt<Date.now();
 const navigate=useNavigate(),location=useLocation(),returnTo=paymentReturnPath(new URLSearchParams(location.search).get('returnTo')),[seconds,setSeconds]=useState(5);
 useEffect(()=>{
  if(!paid)return;setSeconds(5);
  const countdown=setInterval(()=>setSeconds(n=>Math.max(0,n-1)),1000),redirect=setTimeout(()=>navigate(returnTo,{replace:true}),5000);
  return()=>{clearInterval(countdown);clearTimeout(redirect);};
 },[paid,token,returnTo,navigate]);
 return <div className="guest-payment-page"><header className="guest-payment-header"><strong>Service<span>Hub</span></strong><div><ThemeSwitch/><LanguageSwitch compact/></div></header><main className="guest-payment-card"><span className="payment-test-badge">TEST PAYMENT · No real money</span>{payment?<><span className={'guest-payment-icon '+(paid?'paid':'')}>{paid?<CheckCircle2 size={30}/>:<LockKeyhole size={28}/>}</span><h1>{tr(paid?'Your payment is completed':'Pay for your repair')}</h1><p>{payment.shopName}</p><div className="guest-payment-reference"><span>{tr('Booking')}</span><strong>{payment.bookingId}</strong><p>{payment.title}</p></div><div className="guest-payment-amount">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(payment.amount/100)}</div>{paid?<><p className="guest-payment-success">{tr(payment.method==='cash'?'Cash payment received by the shop. Your payment is completed.':'Verified by Razorpay. Your payment is completed.')}</p><p role="status">{tr('Redirecting in')} {seconds} {tr('seconds')}? <button type="button" className="guest-check-button" onClick={()=>navigate(returnTo,{replace:true})}>{tr('Continue now')}</button></p><p>{tr('Payment reference')}: {payment.paymentId}</p><p>{payment.paidAt&&new Date(payment.paidAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</p></>:<>{!payment.configured&&<p className="payment-setup-note">The shop is configuring test payments. No money can be collected until Razorpay test keys are connected.</p>}{expired&&<p className="wf-error">This link expired. Ask the shop for assistance.</p>}<button className="guest-pay-button" onClick={pay} disabled={busy||!payment.configured||expired||payment.status!=='pending'}>{busy?tr('Processing...'):tr('Pay securely with Razorpay')}</button><button className="guest-check-button" disabled={busy||!payment.configured} onClick={refresh}><RefreshCw size={16}/>{tr('Check payment status')}</button></>}<p className="payment-verification-note"><ShieldCheck size={17}/>{tr('No registration required. Payment confirmation is verified on the server.')}</p></>:<h1>{error?tr('Payment link unavailable'):tr('Loading payment details...')}</h1>}{error&&<p role="alert" className="wf-error">{error}</p>}{message&&<p role="status">{message}</p>}</main><footer>ServiceHub · Razorpay test checkout</footer></div>;
}
