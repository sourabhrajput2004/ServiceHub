import ChatComposer,{ChatImage} from './ChatComposer';
import React, { useEffect, useRef, useState } from 'react';
import {MessageCircle, Send, Search, CheckCircle2, RotateCcw, Inbox, Ticket, MessagesSquare} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/support-inbox.css';

export default function SupportInbox({ selectedId, onSelect }) {
 const { tr, language } = useLanguage();
 const { threads, send, setStatus, error } = useSupport();
 const { user } = useAuth();
 const [filter,setFilter] = useState('all');
 const [search,setSearch] = useState('');
 const [drafts,setDrafts] = useState({});
 const log = useRef(null);
 const locale = language === 'hi'?  'hi-IN' : 'en-IN';
 const time = value => {const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'});};
 const day = value => {const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'});};
 const counterpart = thread => ['customer','technician'].includes(user.role)?  thread.shopName : thread.customerName;
 const visible = threads.filter(thread => (filter === 'all' || thread.kind === filter) && `${thread.subject} ${tr(thread.subject)} ${thread.bookingId} ${counterpart(thread)} ${thread.messages.at(-1)?.text || ''}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>new Date(b.messages.at(-1)?.at||b.createdAt)-new Date(a.messages.at(-1)?.at||a.createdAt));
 const selected = threads.find(thread => thread.id === selectedId);
 const draft = drafts[selectedId] || '';
 const setDraft = value => setDrafts(previous=>({...previous,[selectedId]:value}));
 const initials = name => (name||'SH').split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight;},[selectedId,selected?.messages.length]);
 const changeFilter = value => {setFilter(value);if(selected && value!=='all' && selected.kind!==value)onSelect(null);};
 const submit = event => {event.preventDefault();if(selected && draft.trim() && send(selected.id,draft))setDraft('');};
 return <section className={`support-workspace ${selected?'has-selection':''}`}>
  <header className="support-heading"><div className="support-heading-icon"><MessagesSquare size={28}/></div><div><h2>{tr(user.role==='shop_owner'?'Customer Queries & Live Chats':'My Queries & Live Chats')}</h2><p>{tr(user.role==='technician'?'Active job conversations with the owner and customer.':user.role==='customer'?'Your repair conversations, all in one place.':'Customer and technician conversations, all in one place.')}</p></div><span className="support-total">{threads.length} {tr('conversations')}</span></header>
  <div className="support-layout">
   <aside className="support-sidebar" aria-label={tr('Conversations')}>
    <label className="support-search"><Search size={21}/><input type="search" aria-label={tr('Search conversations')} value={search} onChange={event=>setSearch(event.target.value)} placeholder={tr('Search conversations')}/></label>
    <div className="support-filters" aria-label={tr('Filter conversations')}>{[['all','All',Inbox],['ticket',user.role==='shop_owner'?'Customer Queries':'My Queries',Ticket],['chat','Live Chats',MessageCircle]].map(([value,label,Icon])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>changeFilter(value)}><Icon size={19}/><span>{tr(label)}</span><span className="support-filter-count">{threads.filter(thread=>value==='all'||thread.kind===value).length}</span></button>)}</div>
    <div className="support-list">{visible.map(thread=>{const last=thread.messages.at(-1);return <button type="button" className={`support-thread ${selectedId===thread.id?'selected':''}`} key={thread.id} aria-pressed={selectedId===thread.id} onClick={()=>onSelect(thread.id)}>
      <span className="thread-top"><span className="thread-booking">{thread.bookingId}</span><span className={`thread-status ${thread.status==='Resolved'?'resolved':'open'}`}>{thread.status==='Resolved'?<CheckCircle2 size={15}/>:<span className="thread-status-dot"/>}{tr(thread.status)}</span></span>
      <span className="thread-title">{tr(thread.subject)}</span><span className="thread-counterpart">{counterpart(thread)}</span><span className="thread-preview">{last?.text}</span><span className="thread-bottom"><span>{thread.kind==='chat'?<MessageCircle size={17}/>:<Ticket size={17}/>} {tr(thread.kind==='chat'?'Live chat':'Query')}</span><time dateTime={last?.at||thread.createdAt}>{time(last?.at||thread.createdAt)}</time></span>
     </button>;})}
     {!visible.length&&<div className="support-list-empty"><Inbox size={32}/><strong>{tr(search?'No conversations found':'No conversations yet')}</strong><p>{tr(search?'Try a booking ID, shop or another keyword.':user.role==='shop_owner'?'Customer queries and chats will appear here when they contact your shop.':'Use Need help or Live chat on your repair order to start.')}</p></div>}
    </div>
   </aside>
   <div className="support-conversation">
    {selected?<>
     <div className="conversation-heading"><button type="button" className="conversation-back" aria-label={tr('Back to conversations')} onClick={()=>onSelect(null)}>{tr('Back')}</button><span className="conversation-avatar">{initials(counterpart(selected))}</span><div className="conversation-identity"><h3>{tr(selected.subject)}</h3><p>{counterpart(selected)}</p><span className="conversation-booking">{selected.bookingId}<span aria-hidden="true" className="conversation-separator"/>{tr(selected.kind==='chat'?'Live chat':'Query')}</span></div><button type="button" className="conversation-status-action" onClick={()=>setStatus(selected.id,selected.status==='Resolved'?'Open':'Resolved')}>{selected.status==='Resolved'?<RotateCcw size={20}/>:<CheckCircle2 size={20}/>}<span>{tr(selected.status==='Resolved'?'Reopen':'Mark resolved')}</span></button></div>
     <div className="conversation-log" ref={log} role="log" aria-label={tr('Conversation messages')} aria-live="polite" aria-relevant="additions text">
      {selected.messages.map((message,index)=>{const mine=message.senderId?message.senderId===user.id:message.role===user.role;const date=day(message.at);const showDate=index===0||day(selected.messages[index-1].at)!==date;return <React.Fragment key={message.id}>{showDate&&<div className="conversation-day"><span>{date}</span></div>}<div className={`message-row ${mine?'mine':'theirs'}`}><div className="message-bubble"><span className="message-author">{mine?tr('You'):message.name}</span><p>{message.text}</p><ChatImage message={message}/><time className="message-time" dateTime={message.at}>{time(message.at)}</time></div></div></React.Fragment>;})}
     </div>
     {error&&<p role="alert" className="support-error">{tr(error)}</p>}
     {selected.status==='Resolved'?<div className="conversation-resolved"><CheckCircle2 size={23}/><div><strong>{tr('This conversation is resolved')}</strong><p>{tr('Reopen it whenever you need more help.')}</p></div><button type="button" onClick={()=>setStatus(selected.id,'Open')}>{tr('Reopen')}</button></div>:<ChatComposer key={selected.id} onSend={(text,image)=>send(selected.id,text,image)}/>}
    </>:<div className="conversation-empty"><span><MessagesSquare size={44}/></span><h3>{tr('Every repair has a conversation.')}</h3><p>{tr('Select a query or chat to view the conversation.')}</p><span className="empty-booking-note"><Ticket size={20}/>{tr('Booking details and messages, together.')}</span></div>}
   </div>
  </div>
  
 </section>;
}
