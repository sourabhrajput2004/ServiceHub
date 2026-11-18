import {randomBytes,createHash} from 'node:crypto';
import {PaymentError} from './core.mjs';
export function createBillDocuments(db,{now=()=>Date.now(),readOnly=false}={}){
 if(!readOnly)db.exec(`CREATE TABLE IF NOT EXISTS bill_documents(token TEXT PRIMARY KEY,shop_id TEXT NOT NULL,invoice_id TEXT NOT NULL,digest TEXT NOT NULL,pdf BLOB NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,UNIQUE(shop_id,invoice_id,digest));`);
 return {
  publish(shopId,input){
   if(readOnly)throw new PaymentError(403,'This endpoint is read only.');
   const invoiceId=String(input.invoiceId||'');if(!/^[A-Za-z0-9_-]{1,80}$/.test(invoiceId))throw new PaymentError(400,'Invalid invoice reference.');
   const encoded=String(input.pdf||'');if(!encoded||encoded.length>1400000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new PaymentError(400,'Send a valid customer PDF up to 1 MB.');
   const pdf=Buffer.from(encoded,'base64');if(pdf.length>1048576||pdf.subarray(0,5).toString()!=='%PDF-')throw new PaymentError(400,'Invalid PDF document.');
   const digest=createHash('sha256').update(pdf).digest('hex'),existing=db.prepare('SELECT token,expires_at FROM bill_documents WHERE shop_id=? AND invoice_id=? AND digest=?').get(shopId,invoiceId,digest);
   if(existing&&existing.expires_at>now())return {token:existing.token,invoiceId,expiresAt:existing.expires_at};
   const token=randomBytes(32).toString('hex'),at=now(),expires=at+365*86400000;
   if(existing)db.prepare('UPDATE bill_documents SET token=?,created_at=?,expires_at=? WHERE token=?').run(token,at,expires,existing.token);
   else db.prepare('INSERT INTO bill_documents VALUES(?,?,?,?,?,?,?)').run(token,shopId,invoiceId,digest,pdf,at,expires);
   return {token,invoiceId,expiresAt:expires};
  },
  read(token){
   if(!/^[a-f0-9]{64}$/.test(token))throw new PaymentError(404,'Bill link not found.');
   const row=db.prepare('SELECT invoice_id,pdf,expires_at FROM bill_documents WHERE token=?').get(token);
   if(!row||row.expires_at<=now())throw new PaymentError(404,'Bill link is unavailable or expired.');
   return {filename:row.invoice_id+'.pdf',pdf:Buffer.from(row.pdf)};
  }
 };
}
