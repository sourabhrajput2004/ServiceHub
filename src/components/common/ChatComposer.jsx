import React,{useRef,useState} from 'react';
import {Plus, Send, X} from 'lucide-react';
import {useLanguage} from '../../context/LanguageContext';
import {prepareChatImage} from '../../utils/chatAttachment';
import '../../styles/chat-attachments.css';
export function ChatImage({message}){return message.image?<a className="chat-image" href={message.image} target="_blank" rel="noreferrer"><img src={message.image} alt={message.imageName||'Attached image'}/><span>{message.imageName||'View image'}</span></a>:null;}
export function ImagePicker({value,onChange,onBusy}){
 const input=useRef(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),{language}=useLanguage(),t=(a,b)=>language==='hi'?b:a;
 const choose=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);onBusy?.(true);setError('');try{onChange(await prepareChatImage(file));}catch(e){setError(e.message);}finally{setBusy(false);onBusy?.(false);}};
 return <div className="chat-attachment-picker"><input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={choose}/><button type="button" className="chat-attach-button" disabled={busy} title={t('Attach image','फोटो जोड़ें')} aria-label={t('Attach image','फोटो जोड़ें')} onClick={()=>input.current?.click()}><Plus size={23}/></button>{busy&&<small role="status">{t('Preparing image…','फोटो तैयार हो रही है…')}</small>}{value&&<div className="chat-image-preview"><img src={value.image} alt="Attachment preview"/><span>{value.imageName}</span><button type="button" aria-label={t('Remove image','फोटो हटाएँ')} onClick={()=>onChange(null)}><X size={18}/></button></div>}{error&&<p className="chat-upload-error" role="alert">{error}</p>}</div>;
}
export default function ChatComposer({onSend,disabled=false}){
 const [text,setText]=useState(''),[attachment,setAttachment]=useState(null),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState(''),{language}=useLanguage(),t=(a,b)=>language==='hi'?b:a;
 const submit=async e=>{e.preventDefault();if(disabled||busy||sending||!text.trim()&&!attachment)return;setSending(true);setError('');try{const result=await onSend(text,attachment);if(result===false||result===null){setError(t('Message could not be sent. Please retry.','मैसेज नहीं गया। दोबारा कोशिश करें।'));return;}setText('');setAttachment(null);}catch{setError(t('Message could not be sent. Please retry.','मैसेज नहीं गया। दोबारा कोशिश करें।'));}finally{setSending(false);}};
 return <form className="chat-composer" onSubmit={submit}><fieldset disabled={disabled||sending}><ImagePicker value={attachment} onChange={setAttachment} onBusy={setBusy}/><textarea aria-label={t('Message','मैसेज')} rows={2} maxLength={4000} value={text} onChange={e=>setText(e.target.value)} placeholder={t('Write your message…','अपना मैसेज लिखें…')}/><button className="chat-send" type="submit" disabled={busy||!text.trim()&&!attachment} aria-label={t('Send message','मैसेज भेजें')}><Send size={22}/></button></fieldset>{error&&<p role="alert" className="chat-upload-error">{error}</p>}</form>;
}
