import {useEffect,useState} from 'react';
export const validShopUpi=value=>/^[\w.-]{2,}@[a-zA-Z][\w.-]+$/.test(String(value||'').trim())&&String(value).trim().length<=100;
export default function useShopUpi(shopId){
 const key='servicehub_upi_'+shopId,read=()=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
 const [value,setValue]=useState(read);
 useEffect(()=>{setValue(read());const sync=e=>{if(!e.key||e.key===key)setValue(read());};window.addEventListener('storage',sync);window.addEventListener('servicehub-upi-updated',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('servicehub-upi-updated',sync);};},[key]);
 const save=next=>{const clean=String(next||'').trim();if(clean)localStorage.setItem(key,clean);else localStorage.removeItem(key);setValue(clean);if(typeof window.dispatchEvent==='function')window.dispatchEvent(new Event('servicehub-upi-updated'));};
 return [value,save];
}
