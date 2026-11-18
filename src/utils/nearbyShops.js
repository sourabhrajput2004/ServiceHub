// Approximate neighbourhood reference points, not building-level geocoding.
// Existing seeded workshop coordinates supply the Raj Nagar and Indirapuram anchors.
export const SERVICE_AREAS = [
 { id:'ghaziabad', label:'Ghaziabad', aliases:['gzb','गाजियाबाद','गाज़ियाबाद'], lat:28.6692, lng:77.4538 },
 { id:'raj-nagar', label:'RDC, Raj Nagar', aliases:['rdc','raj nagar','राज नगर','आरडीसी'], lat:28.6756, lng:77.4421 },
 { id:'indirapuram', label:'Indirapuram', aliases:['indrapuram','इंदिरापुरम'], lat:28.6415, lng:77.3712 },
 { id:'vaishali', label:'Vaishali', aliases:['201019','वैशाली'], lat:28.6438, lng:77.3409 },
 { id:'kavi-nagar', label:'Kavi Nagar', aliases:['कवि नगर'], lat:28.6650, lng:77.4530 },
 { id:'crossings', label:'Crossings Republik', aliases:['crossing republik','crossing republic','crossings republic','क्रॉसिंग्स रिपब्लिक'], lat:28.62855, lng:77.43436 },
 { id:'vasundhara', label:'Vasundhara', aliases:['वसुंधरा'], lat:28.65485, lng:77.35791 }
].map(area => ({...area, address:'Ghaziabad, Uttar Pradesh', kind:'area', key:'area:'+area.id}));

export function coordinates(value) {
 if (!value || value.lat === '' || value.lng === '' || value.lat == null || value.lng == null) return null;
 const lat=Number(value.lat), lng=Number(value.lng);
 return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180 ? {lat,lng} : null;
}
export function distanceKm(from,to) {
 const a=coordinates(from),b=coordinates(to);if(!a||!b)return null;
 const rad=value=>value*Math.PI/180;
 const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
export function nearestShops(shops,origin) {
 if(!coordinates(origin)) return shops.map(shop=>({...shop,distanceKm:null}));
 return shops.map((shop,index)=>({...shop,distanceKm:distanceKm(origin,shop.coordinates),sortIndex:index})).sort((a,b)=>((a.distanceKm??Infinity)-(b.distanceKm??Infinity))||a.sortIndex-b.sortIndex);
}
export function locationOptions(shops) {
 return [...SERVICE_AREAS,...shops.filter(shop=>coordinates(shop.coordinates)).map(shop=>({key:'shop:'+shop.id,kind:'shop',label:shop.locality||shop.shopName,address:shop.address||'',shopName:shop.shopName,...coordinates(shop.coordinates)}))];
}
export function findLocations(query,options,translate=value=>value) {
 const normalise=value=>String(value||'').toLocaleLowerCase().replace(/[,\-]+/g,' ').replace(/\s+/g,' ').trim();
 const words=normalise(query).split(' ').filter(Boolean);
 return options.filter(option=>{const text=normalise([option.label,translate(option.label),option.address,option.shopName,translate('Ghaziabad, Uttar Pradesh'),...(option.aliases||[])].join(' '));return words.every(word=>text.includes(word));}).slice(0,8);
}
