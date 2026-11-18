// Public-facing verification data only; technical and demo checks stay out of this view.
export function verificationState(shop,now=new Date()){
 const raw=String(shop?.verificationStatus||'').toLowerCase();
 if(raw==='pending'&&shop?.reverificationSubmission)return 'PENDING_REVIEW';
 if(raw==='expired'||(shop?.businessProofValidUntil&&String(shop.businessProofValidUntil).slice(0,10)<now.toISOString().slice(0,10)))return 'EXPIRED';
 if(['flagged','rejected'].includes(raw))return 'FLAGGED';
 return ['approved','verified'].includes(raw)?'VERIFIED':'PENDING_REVIEW';
}
export function simpleVerificationHistory(shop){
 const title=check=>{const key=String(check||'').toLowerCase();if(/pan|face|liveness|otp|device|payout|registry|score|match/.test(key))return null;if(/gstin|gst re.?check/.test(key))return 'GSTIN Re-check';if(/re.?verification/.test(key))return 'Re-verification';if(/initial verification/.test(key))return 'Initial Verification';if(/licen[cs]e/.test(key))return 'License check';if(/admin review|shop verification|business proof|document review/.test(key))return 'Shop verification';if(/shop name|address/.test(key))return 'Shop details review';return null;};
 return (shop?.verificationHistory||[]).flatMap(event=>{if(event.demo)return [];const check=title(event.check),raw=String(event.status||'').toLowerCase(),status=['passed','approved','active','verified'].includes(raw)?'Passed':raw==='flagged'?'Flagged':['failed','rejected'].includes(raw)?'Failed':null;return check&&status?[{id:event.id,at:event.at,check,status}]:[];}).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
}
export async function validateVerificationFile(file){
 if(!file)return 'Choose a PDF or JPG document.';
 if(!['application/pdf','image/jpeg'].includes(file.type)||!(/\.(pdf|jpe?g)$/i.test(file.name)))return 'Choose a PDF or JPG document.';
 if(!file.size||file.size>5*1024*1024)return 'Choose a file up to 5 MB.';
 const bytes=new Uint8Array(await file.slice(0,5).arrayBuffer());
 if(file.type==='application/pdf'&&String.fromCharCode(...bytes)!=='%PDF-')return 'This PDF could not be opened. Choose a valid document.';
 if(file.type==='image/jpeg'&&!(bytes[0]===255&&bytes[1]===216&&bytes[2]===255))return 'This JPG could not be opened. Choose a valid image.';
 if(file.type==='image/jpeg'){
  const url=URL.createObjectURL(file);try{await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth?resolve():reject();image.onerror=reject;image.src=url;});}catch{return 'This JPG could not be opened. Choose a valid image.';}finally{URL.revokeObjectURL(url);}
 }
 return null;
}
