import React,{useState} from 'react';
import {Check, Wrench} from 'lucide-react';
import {useLanguage} from '../../context/LanguageContext';
import {FLOW_LABELS} from '../../utils/repairWorkflow';
import '../../styles/home-repair-preview.css';

const explanations={
 booked:['Your booking is received. A technician has not been assigned yet.','बुकिंग मिल गई है। अभी टेक्नीशियन असाइन नहीं हुआ है।'],
 assigned:['The shop assigns a technician. For shop service, the owner can also handle the repair.','दुकान टेक्नीशियन असाइन करती है। दुकान पर सर्विस हो तो मालिक भी रिपेयर कर सकता है।'],
 on_way:['The assigned technician is on the way to your home.','जिस टेक्नीशियन को काम मिला है, वह आपके घर आ रहा है।'],
 repairing:['Repair work has started. Follow updates from your shop.','रिपेयर शुरू हो गई है। दुकान के अपडेट यहाँ मिलते हैं।'],
 ready:['The repair is ready. Complete the payment next.','\u0930\u093f\u092a\u0947\u092f\u0930 \u0924\u0948\u092f\u093e\u0930 \u0939\u0948\u0964 \u0905\u092c \u092a\u0947\u092e\u0947\u0902\u091f \u092a\u0942\u0930\u0940 \u0915\u0930\u0947\u0902\u0964'],
 payment_due:['View the final amount and pay via UPI or at the shop.','फाइनल रकम देखें और UPI से या दुकान पर पेमेंट करें।'],
 completed:['Payment is recorded and the repair is completed. The shop can now generate your final bill.','पेमेंट दर्ज हो गई और रिपेयर पूरी हो गई। रिकॉर्ड आपके पास रहता है।']
};
export default function HomeRepairPreview(){
 const {language,tr}=useLanguage(),t=(en,hi)=>language==='hi'?hi:en,[mode,setMode]=useState('shop'),[selected,setSelected]=useState('assigned');
 const keys=['booked','assigned',...(mode==='home'?['on_way']:[]),'repairing','ready','payment_due','completed'],index=Math.max(0,keys.indexOf(selected)),key=keys[index],progress=key==='completed'?100:Math.round(index/keys.length*100);
 return <section className="repair-preview home-flow-preview" aria-label={tr('Your repair, at a glance')}><div className="preview-header"><span className="preview-icon"><Wrench size={18}/></span><div><strong>{tr('Your repair, at a glance')}</strong><small>{tr("Repair stages")}</small></div><span className="preview-dot"/></div>
 <div className="home-flow-modes" aria-label={t('Preview service mode','डेमो में सर्विस चुनें')}>{[['shop','Shop Service','दुकान पर सर्विस'],['home','Home Service','घर पर सर्विस']].map(([id,en,hi])=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>{setMode(id);if(id==='shop'&&selected==='on_way')setSelected('assigned');}}>{t(en,hi)}</button>)}</div>
 <div className="preview-status"><span>{tr(FLOW_LABELS[key])}</span><strong>{index+1}<small> / {keys.length}</small></strong></div><div className="home-flow-progress" role="progressbar" aria-label={t('Preview repair progress','डेमो में रिपेयर की प्रोग्रेस')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:progress+'%'}}/></div>
 <div className="home-flow-steps" aria-label={t('Choose a repair stage','रिपेयर का स्टेज चुनें')}>{keys.map((id,i)=><button type="button" key={id} aria-pressed={i===index} className={i===index?'current':i<index?'finished':''} onClick={()=>setSelected(id)}><span>{i<index||key==='completed'?<Check size={15}/>:i+1}</span><small>{tr(FLOW_LABELS[id])}</small></button>)}</div><p aria-live="polite">{t(...explanations[key])}</p></section>;
}
