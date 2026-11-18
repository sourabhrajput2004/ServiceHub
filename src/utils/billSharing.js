export async function pdfBase64(file){
 const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
 for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
 return btoa(binary);
}
export function billWhatsAppUrl({recipient,customerName,shopName,invoiceId,url}){
 if(!publicBillUrl(url))throw Error('Set up a public HTTPS bill address before sharing with customers. Localhost links cannot be sent.');
 const message=['Hello '+(customerName||'Customer')+',','From '+(shopName||'ServiceHub')+'.','Your bill '+invoiceId+' is ready.','','Download your bill PDF:',billDownloadUrl(url),'','Thank you.'].join('\n');
 return 'https://wa.me/'+recipient+'?text='+encodeURIComponent(message);
}
export function billDownloadUrl(value){const url=new URL(value);url.searchParams.set('download','1');return url.href;}
export function publicBillUrl(value){
 try{const url=new URL(value),host=url.hostname.toLowerCase();return url.protocol==='https:'&&!url.username&&!url.password&&!['localhost','0.0.0.0','[::1]'].includes(host)&&!host.endsWith('.localhost')&&!host.endsWith('.local')&&!/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);}catch{return false;}
}
