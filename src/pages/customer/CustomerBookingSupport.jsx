import {ImagePicker} from '../../components/common/ChatComposer';
import React,{useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {LifeBuoy, MessageSquare, Send} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {useShop} from '../../context/ShopContext';
import {useSupport} from '../../context/SupportContext';
import {useLanguage} from '../../context/LanguageContext';
import {bookingIssues} from '../../utils/customerBookings';
import SupportInbox from '../../components/common/SupportInbox';
import {BusinessField} from '../../components/seller/ServiceWorkspace';
import '../../styles/business-workspace.css';
import '../../styles/customer-booking-support.css';

export default function CustomerBookingSupport(){
 const {user}=useAuth(),shop=useShop(),support=useSupport(),{language}=useLanguage(),[params,setParams]=useSearchParams(),t=(en,hi)=>language==='hi'?hi:en;
 const orders=shop.bookings.filter(j=>j.customerId===user.id&&!j.archivedAt);
 const [image,setImage]=useState(null),[imageBusy,setImageBusy]=useState(false),[orderId,setOrderId]=useState(params.get('booking')||''),[issue,setIssue]=useState(bookingIssues.some(i=>i[0]===params.get('issue'))?params.get('issue'):'quality'),[comment,setComment]=useState(''),[errors,setErrors]=useState({}),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const submit=e=>{
  e.preventDefault();if(imageBusy)return;const job=orders.find(j=>j.id===orderId),next={};
  if(!job)next.order=t('Select your booking.','अपनी बुकिंग चुनें।');
  if(!bookingIssues.some(i=>i[0]===issue))next.issue=t('Select an issue.','परेशानी चुनें।');
  if(comment.trim().length<10||comment.trim().length>2000)next.comment=t('Describe your issue in 10–2000 characters.','अपनी परेशानी 10–2000 अक्षरों में लिखें।');
  setErrors(next);if(Object.keys(next).length)return;
  setBusy(true);const category=bookingIssues.find(i=>i[0]===issue),id=support.createThread(job,category[1]+' — '+job.id,comment.trim(),'ticket',image);setBusy(false);
  if(id){setImage(null);setComment('');setNotice(t('Query saved for your shop. Follow the reply below.','दुकान के लिए आपकी क्वेरी सेव हो गई। जवाब नीचे देखें।'));setParams({conversation:id},{replace:true});}
  else setNotice(t('Could not save your query. Please retry.','क्वेरी सेव नहीं हुई। दोबारा कोशिश करें।'));
 };
 return <main className="biz-page customer-booking-support"><header className="booking-support-heading"><span className="biz-icon"><LifeBuoy size={28}/></span><div><span className="biz-eyebrow">{t('CUSTOMER SUPPORT','कस्टमर सपोर्ट')}</span><h1>{t('Help with your repair','आपकी रिपेयर में मदद')}</h1><p>{t('Choose a booking and tell your shop what needs attention.','बुकिंग चुनें और दुकान को अपनी परेशानी बताएँ।')}</p></div></header>
 <section className="biz-panel booking-query-panel"><div className="booking-query-intro"><MessageSquare size={26}/><h2>{t('Raise a booking query','बुकिंग की क्वेरी डालें')}</h2><p>{t('Cancellation appeal, repair update or another issue — add the details below.','कैंसल करने की अपील, रिपेयर अपडेट या कोई और परेशानी — नीचे पूरी बात लिखें।')}</p></div><form noValidate onSubmit={submit} className="booking-query-form"><BusinessField label={t('Select booking *','बुकिंग चुनें *')} error={errors.order}><select value={orderId} onChange={e=>setOrderId(e.target.value)} aria-required="true"><option value="">{t('Choose your booking','अपनी बुकिंग चुनें')}</option>{orders.map(j=><option value={j.id} key={j.id}>{j.id} · {j.deviceBrand} · {j.shopName}</option>)}</select></BusinessField><BusinessField label={t('Issue *','परेशानी *')} error={errors.issue}><select value={issue} onChange={e=>setIssue(e.target.value)}>{bookingIssues.map(([id,en,hi])=><option key={id} value={id}>{t(en,hi)}</option>)}</select></BusinessField><BusinessField label={t('Comment / describe your issue *','कमेंट / अपनी परेशानी बताएँ *')} error={errors.comment}><textarea rows={5} maxLength={2000} aria-required="true" value={comment} onChange={e=>setComment(e.target.value)} placeholder={t('What happened, and how can the shop help?','क्या हुआ और दुकान से क्या मदद चाहिए?')}/></BusinessField><ImagePicker value={image} onChange={setImage} onBusy={setImageBusy}/><div className="booking-query-footer"><small>{comment.length}/2000</small><button className="biz-primary" disabled={busy||imageBusy||!orders.length} type="submit"><Send size={19}/>{t(busy?'Saving…':'Submit Query',busy?'सेव हो रहा है…':'क्वेरी भेजें')}</button></div>{!orders.length&&<p>{t('Book a repair first to raise an order query.','ऑर्डर की क्वेरी डालने के लिए पहले रिपेयर बुक करें।')}</p>}</form></section>{notice&&<p role="status" className="biz-notice">{notice}</p>}<section className="booking-conversations"><h2>{t('Your queries & live chats','आपकी क्वेरी और लाइव चैट')}</h2><SupportInbox selectedId={params.get('conversation')} onSelect={id=>setParams(id?{conversation:id}:{},{replace:true})}/></section></main>;
}
