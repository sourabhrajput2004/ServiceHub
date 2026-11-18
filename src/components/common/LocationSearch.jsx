import React, { useEffect, useId, useRef, useState } from 'react';
import {MapPin, Navigation, Search, X, LoaderCircle} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { coordinates, findLocations, locationOptions } from '../../utils/nearbyShops';
import '../../styles/location-search.css';
import { reverseCurrentLocation } from '../../utils/reverseLocation';

export default function LocationSearch({ shops, origin, onChange }) {
 const { tr, language }=useLanguage();
 const [query,setQuery]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [locating,setLocating]=useState(false);
 const [error,setError]=useState('');
 const [active,setActive]=useState(-1);
 const request=useRef(0);
 const lookup=useRef(null);
 const container=useRef(null);
 const id=useId();
 const options=findLocations(query,[...(origin?.kind==='gps'?[origin]:[]),...locationOptions(shops)],tr);
 useEffect(()=>()=>{request.current++;lookup.current?.abort();},[]);
 useEffect(()=>{request.current++;setLocating(false);setQuery(origin ? tr(origin.label) : '');setExpanded(false);setActive(-1);setError('');},[origin,tr]);
 useEffect(()=>{const close=event=>{if(!container.current?.contains(event.target)){setExpanded(false);setActive(-1);}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const choose=option=>{lookup.current?.abort();request.current++;setLocating(false);onChange(option);setQuery(tr(option.label));setExpanded(false);setActive(-1);setError('');};
 const detect=()=>{
   lookup.current?.abort();
   const token=++request.current;
   setError('');setExpanded(false);setActive(-1);
   if(!navigator.geolocation){setError('This browser cannot detect your location. Search for an area instead.');return;}
   setLocating(true);
   navigator.geolocation.getCurrentPosition(async position=>{
     if(token!==request.current)return;
     const point=coordinates({lat:position.coords.latitude,lng:position.coords.longitude});
     if(!point){setLocating(false);setError('Location could not be detected. Search for an area or try again.');return;}
     const controller=new AbortController();lookup.current=controller;
     const timer=setTimeout(()=>controller.abort(),8000);
     let label=`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
     let failed=false;
     try {label=await reverseCurrentLocation(point,{language,signal:controller.signal});} catch {failed=true;} finally {clearTimeout(timer);}
     if(token!==request.current)return;
     setLocating(false);
     onChange({...point,kind:'gps',key:'gps',label,areaLookupFailed:failed,accuracy:position.coords.accuracy});
   },failure=>{
     if(token!==request.current)return;
     setLocating(false);
     setError(failure.code===1?'Location permission was denied. Allow it in your browser or search for an area.':failure.code===3?'Location detection timed out. Try again or search for an area.':'Location could not be detected. Search for an area or try again.');
   },{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 };
 const clear=()=>{lookup.current?.abort();request.current++;setLocating(false);onChange(null);setQuery('');setExpanded(false);setError('');};
 const submit=event=>{event.preventDefault();if(origin?.kind==='gps'&&query===tr(origin.label)){setExpanded(false);return;}if(options.length===1)choose(options[0]);else{setExpanded(true);setActive(-1);}};
 return <div className="location-search" ref={container} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setExpanded(false);setActive(-1);}}}>
  <label htmlFor={id} className="location-search-label">{tr('Search location')}</label>
  <div className="location-search-row">
   <form onSubmit={submit} className="location-search-form"><div className="location-input-wrap"><MapPin size={22} aria-hidden="true" />
    <input id={id} type="text" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={id+'-results'} aria-activedescendant={expanded&&active>=0?id+'-option-'+active:undefined} autoComplete="off" value={query} placeholder={tr('Search area or listed shop address')} onFocus={()=>{if(!(origin?.kind==='gps'&&query===tr(origin.label)))setExpanded(true);}} onChange={event=>{lookup.current?.abort();request.current++;setLocating(false);setQuery(event.target.value);setExpanded(true);setActive(-1);setError('');}} onKeyDown={event=>{
     if(event.key==='ArrowDown'){event.preventDefault();setExpanded(true);setActive(value=>Math.min(value+1,options.length-1));}
     if(event.key==='ArrowUp'){event.preventDefault();setActive(value=>options.length?Math.max(value-1,0):-1);}
     if(event.key==='Escape'){setExpanded(false);setActive(-1);}
     if(event.key==='Enter'&&expanded&&active>=0&&options[active]){event.preventDefault();choose(options[active]);}
    }} />
    {(query||origin)&&<button type="button" className="location-clear" onClick={clear} aria-label={tr('Clear location')}><X size={20}/></button>}
   </div><button type="submit" className="location-search-submit" aria-label={tr('Search location')}><Search size={22}/></button></form>
   <button type="button" className="location-detect" onClick={detect} disabled={locating}>{locating?<LoaderCircle size={22} className="location-spinner"/>:<Navigation size={22}/>}<span>{tr(locating?'Detecting location...':'Use my location')}</span></button>
  </div>
  {expanded&&<div id={id+'-results'} className="location-suggestions" role="listbox" aria-label={tr('Matching locations')}>
   {options.map((option,index)=><button key={option.key} type="button" role="option" id={id+'-option-'+index} aria-selected={index===active} className={index===active?'active':''} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(option)}><MapPin size={20}/><span><strong>{tr(option.label)}</strong><small>{option.kind==='area'?tr('Approximate area reference point'):[option.shopName,option.address].filter(Boolean).join(' · ')}</small></span></button>)}
   {!options.length&&<p>{tr('No matching area or listed address. Try a Ghaziabad locality or use your current location.')}</p>}
  </div>}
  {origin?.areaLookupFailed&&<p role="status" className="location-search-error">{tr('GPS detected. Area name could not be loaded, so coordinates are shown. Try detecting again.')}</p>}
  {error&&<p role="alert" className="location-search-error">{tr(error)}</p>}
 </div>;
}
