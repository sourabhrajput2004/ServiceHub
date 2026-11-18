import { coordinates } from './nearbyShops.js';
const cache = new Map();
const clean = value => typeof value === 'string' ? value.trim() : '';
const unique = values => values.map(clean).filter(Boolean).filter((value,index,array)=>array.findIndex(other=>other.toLowerCase()===value.toLowerCase())===index);

export function locationLabel(data) {
 const broad = unique([data.city,data.county,data.state,data.country]).map(value=>value.toLowerCase());
 const areas = unique([data.neighbourhood,data.suburb,data.locality,data.district]).filter(value=>!broad.includes(value.toLowerCase())&&!broad.includes(value.toLowerCase().replace(/ district$/i,'')));
 // A nearby business name is not the user's address; use only address fields.
 const road = clean(data.street) || (data.type === 'street' || data.osm_key === 'highway' ? clean(data.name) : '');
 if(!areas.length&&!road)return '';
 return unique([road,...areas,data.city || data.county]).join(', ');
}
export async function reverseCurrentLocation(point,{signal,fetcher=fetch}={}) {
 const position=coordinates(point);if(!position)throw new Error('Invalid location');
 const key=`${position.lat.toFixed(5)},${position.lng.toFixed(5)}`;
 if(fetcher===fetch&&cache.has(key))return cache.get(key);
 // One explicit user-triggered request; the API limits the search to 300 metres.
 const params=new URLSearchParams({lat:String(position.lat),lon:String(position.lng),limit:'3',radius:'0.3',lang:'en'});
 const response=await fetcher(`https://photon.komoot.io/reverse?${params}`,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw new Error('Area lookup unavailable');
 const data=await response.json();
 for(const feature of data.features||[]) {
   const label=locationLabel(feature.properties||{});
   if(!label)continue;
   if(fetcher===fetch){if(cache.size>=20)cache.delete(cache.keys().next().value);cache.set(key,label);}
   return label;
 }
 throw new Error('Street or neighbourhood unavailable');
}
