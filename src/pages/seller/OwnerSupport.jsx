import React from 'react';
import {useSearchParams} from 'react-router-dom';
import {MessageSquare, LifeBuoy} from 'lucide-react';
import {useSupport} from '../../context/SupportContext';
import {useLanguage} from '../../context/LanguageContext';
import SupportInbox from '../../components/common/SupportInbox';
import PlatformReports from '../../components/common/PlatformReports';
import '../../styles/business-workspace.css';
import '../../styles/shop-support.css';
export default function OwnerSupport(){
 const {threads}=useSupport(),{language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[params,setParams]=useSearchParams();const select=id=>{const next=new URLSearchParams(params);if(id)next.set('conversation',id);else next.delete('conversation');setParams(next,{replace:true});};
 const stats=[[t('Customer queries','कस्टमर के सवाल'),threads.filter(r=>r.kind==='ticket').length],[t('Live chats','लाइव चैट'),threads.filter(r=>r.kind==='chat').length],[t('Open conversations','खुली बातचीत'),threads.filter(r=>r.status!=='Resolved').length],[t('Resolved','सुलझ गई'),threads.filter(r=>r.status==='Resolved').length]];
 return <div className="biz-page help-page shop-support-page"><header className="biz-heading"><div><span className="biz-eyebrow">{t('SHOP SUPPORT WORKSPACE','दुकान का सपोर्ट वर्कस्पेस')}</span><h1>{t('Customer support','कस्टमर सपोर्ट')}</h1><p>{t('Reply to your customers, track their queries and resolve repair issues.','कस्टमर को जवाब दें, उनके सवाल देखें और रिपेयर की परेशानी सुलझाएँ।')}</p></div><span className="biz-icon"><MessageSquare size={28}/></span></header><div className="sp-customer-stats">{stats.map(([label,count])=><article key={label}><span>{label}</span><strong>{count}</strong></article>)}</div><section className="sp-customers" aria-label={t('Customer queries and live chats','कस्टमर के सवाल और लाइव चैट')}><SupportInbox selectedId={params.get('conversation')} onSelect={select}/></section><PlatformReports/></div>;
}
export function AdminSupport(){const {language}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,{reports}=useSupport();return <div className="biz-page help-page admin-support-page"><header className="biz-heading"><div><span className="biz-eyebrow">{t('SUPER ADMIN SUPPORT','सुपर एडमिन सपोर्ट')}</span><h1>{t('Shop support inbox','दुकानों का सपोर्ट इनबॉक्स')}</h1><p>{t('Reports and feedback sent by shop owners.','दुकान मालिकों की भेजी रिपोर्ट और सुझाव।')}</p></div><span className="sp-status open">{reports.filter(r=>r.status!=='Resolved').length} {t('open requests','खुली रिक्वेस्ट')}</span></header><PlatformReports admin/></div>;}
