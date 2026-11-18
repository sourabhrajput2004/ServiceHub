import { coordinates } from './nearbyShops.js';

// Google Maps computes the actual road route, distance and travel time after opening.
export function googleDirectionsUrl(shop, origin) {
 const destination=coordinates(shop.coordinates);
 const address=[shop.shopName,shop.address,shop.locality].filter(Boolean).join(', ');
 if(!destination&&!address)return null;
 const params=new URLSearchParams({api:'1',destination:destination?`${destination.lat},${destination.lng}`:address,travelmode:'driving'});
 // A selected neighbourhood is not the user's physical starting position.
 const start=origin?.kind==='gps'?coordinates(origin):null;
 if(start)params.set('origin',`${start.lat},${start.lng}`);
 if(shop.googlePlaceId)params.set('destination_place_id',shop.googlePlaceId);
 return `https://www.google.com/maps/dir/?${params}`;
}
