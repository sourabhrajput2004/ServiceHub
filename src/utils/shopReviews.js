export const SHOP_REVIEWS_KEY='servicehub_shop_reviews_v1';
export function readShopReviews(){try{const value=JSON.parse(localStorage.getItem(SHOP_REVIEWS_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
export function reviewErrors(rating,comment){const errors={};if(!Number.isInteger(Number(rating))||Number(rating)<1||Number(rating)>5)errors.rating='Select a rating from 1 to 5 stars.';if(String(comment||'').trim().length<3||String(comment||'').trim().length>1000)errors.comment='Write a comment of 3–1000 characters.';return errors;}
export function saveShopReview(user,shop,rating,comment){
 if(user?.role!=='customer')return {success:false,error:'Sign in as a customer to leave a rating.'};
 if(!shop?.id||shop.verificationStatus!=='approved')return {success:false,error:'This shop is unavailable for reviews.'};
 const errors=reviewErrors(rating,comment);if(Object.keys(errors).length)return {success:false,errors};
 const rows=readShopReviews(),old=rows.find(r=>r.shopId===shop.id&&r.customerId===user.id),now=new Date().toISOString(),review={id:old?.id||crypto.randomUUID(),shopId:shop.id,customerId:user.id,customerName:user.name||'Customer',rating:Number(rating),comment:String(comment).trim(),createdAt:old?.createdAt||now,updatedAt:now};
 const next=[review,...rows.filter(r=>r.id!==old?.id)];try{localStorage.setItem(SHOP_REVIEWS_KEY,JSON.stringify(next));return {success:true,rows:next};}catch{return {success:false,error:'Unable to save your review. Please try again.'};}
}
