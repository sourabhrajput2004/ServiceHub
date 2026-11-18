import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
export const secretEqual=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
export const signature=(secret,value)=>createHmac('sha256',secret).update(value).digest('hex');
export const hash=value=>signature('servicehub-session-hash',value);
export class PaymentError extends Error{constructor(status,message){super(message);this.status=status;}}
export function rupeesToPaise(value){if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(String(value)))throw new PaymentError(400,'Enter a positive amount with at most two decimals.');const amount=Math.round(Number(value)*100);if(!Number.isSafeInteger(amount)||amount<100||amount>100000000)throw new PaymentError(400,'Payment must be between INR 1 and INR 10,00,000.');return amount;}
export function createPaymentService({database=':memory:',keyId='',keySecret='',webhookSecret='',providerFetch=fetch,now=()=>Date.now()}){
 const db=new DatabaseSync(database);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS intents(id TEXT PRIMARY KEY,shop_id TEXT NOT NULL,booking_id TEXT NOT NULL,guest_token TEXT NOT NULL UNIQUE,amount INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'INR',shop_name TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',order_id TEXT UNIQUE,payment_id TEXT UNIQUE,method TEXT,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,paid_at INTEGER,UNIQUE(shop_id,booking_id));
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,shop_id TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS payment_audit(id INTEGER PRIMARY KEY,intent_id TEXT NOT NULL,action TEXT NOT NULL,at INTEGER NOT NULL,reference TEXT);
 `);
 const cashCollector=row=>{if(row.method!=='cash')return {};try{const a=db.prepare("SELECT reference FROM payment_audit WHERE intent_id=? AND action='CASH_COLLECTED' ORDER BY id DESC LIMIT 1").get(row.id);const v=JSON.parse(a?.reference||'{}');return {collectorName:v.collector,collectorId:v.collectorId,collectorRole:v.role};}catch{return {};}};
 const ready=Boolean(/^rzp_test_/.test(keyId)&&keySecret),get=id=>db.prepare('SELECT * FROM intents WHERE id=?').get(id),publicRecord=row=>({id:row.id,bookingId:row.booking_id,shopId:row.shop_id,shopName:row.shop_name,title:row.title,amount:row.amount,currency:row.currency,status:row.status,expiresAt:row.expires_at,paidAt:row.paid_at,paymentId:row.payment_id,method:row.method,...cashCollector(row),mode:'test',configured:ready}),audit=(id,action,reference='')=>db.prepare('INSERT INTO payment_audit(intent_id,action,at,reference) VALUES(?,?,?,?)').run(id,action,now(),reference);
 const provider=async(path,options={})=>{
  if(!ready)throw new PaymentError(503,'Razorpay test keys are not configured on the server.');
  const response=await providerFetch('https://api.razorpay.com/v1/'+path,{...options,signal:AbortSignal.timeout(15000),headers:{Authorization:'Basic '+Buffer.from(keyId+':'+keySecret).toString('base64'),'Content-Type':'application/json',...options.headers}});
  if(!response.ok)throw new PaymentError(502,'Razorpay could not process this request. Retry or contact the shop.');return response.json();
 };
 const byToken=token=>{if(!/^[a-f0-9]{64}$/.test(token))throw new PaymentError(404,'Payment link not found.');const row=db.prepare('SELECT * FROM intents WHERE guest_token=?').get(token);if(!row)throw new PaymentError(404,'Payment link not found.');return row;};
 const usable=row=>{if(row.status==='paid')throw new PaymentError(409,'This booking is already paid.');if(row.status==='cancelled')throw new PaymentError(410,'This payment link has been cancelled.');if(now()>row.expires_at)throw new PaymentError(410,'Payment link expired. Contact the shop.');};
 const locks=new Map();
 const serial=async(key,task)=>{const before=locks.get(key)||Promise.resolve();let release;const current=new Promise(resolve=>release=resolve);locks.set(key,current);await before;try{return await task();}finally{release();if(locks.get(key)===current)locks.delete(key);}};
 const captured=async(row,paymentId)=>{
  if(!/^pay_[A-Za-z0-9]+$/.test(paymentId))throw new PaymentError(400,'Invalid payment reference.');
  const payment=await provider('payments/'+encodeURIComponent(paymentId));
  if(payment.id!==paymentId||payment.order_id!==row.order_id||payment.amount!==row.amount||payment.currency!=='INR')throw new PaymentError(409,'Payment does not match this booking amount or order.');
  if(payment.status!=='captured'||payment.captured!==true)return {...publicRecord(get(row.id)),verificationPending:true};
  // Ignore duplicate browser callbacks/webhook deliveries; settle one immutable ledger row.
  db.exec('BEGIN IMMEDIATE');try{const latest=get(row.id);if(latest.status!=='paid'){
   if(latest.status==='cancelled')throw new PaymentError(409,'Payment requires shop review.');
   db.prepare("UPDATE intents SET status='paid',payment_id=?,method=?,paid_at=? WHERE id=? AND status='pending'").run(payment.id,payment.method||'online',now(),row.id);audit(row.id,'PAYMENT_CAPTURED',payment.id);
  }else if(latest.payment_id!==payment.id)throw new PaymentError(409,'A different payment already settled this booking.');db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  return publicRecord(get(row.id));
 };
 const lastRefresh=new Map();
 const reconcile=token=>serial(token,async()=>{const row=byToken(token);if(row.status==='paid'||!row.order_id)return publicRecord(row);const result=await provider('orders/'+encodeURIComponent(row.order_id)+'/payments');const payment=result.items?.find(p=>p.status==='captured');return payment?captured(row,payment.id):publicRecord(row);});
 const refreshIfDue=async token=>{const row=byToken(token);if(row.status!=='pending'||!row.order_id||(lastRefresh.get(row.id)||0)>now()-20000)return;lastRefresh.set(row.id,now());try{await reconcile(token);}catch{/* Keep payment pending when the gateway is unavailable. */}};
 return {ready,db,close:()=>db.close(),
  session(shopId){const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),shopId,now()+8*3600000);return token;},
  authorize(token){const row=db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(token),now());if(!row)throw new PaymentError(401,'Connect the shop payment desk first.');return row.shop_id;},
  logout(token){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));},
  create(shopId,input){
   const bookingId=String(input.bookingId||'').trim();if(!/^[A-Za-z0-9_-]{1,80}$/.test(bookingId))throw new PaymentError(400,'Invalid booking reference.');
   const amount=rupeesToPaise(input.amount),existing=db.prepare('SELECT * FROM intents WHERE shop_id=? AND booking_id=?').get(shopId,bookingId);
   if(existing){if(existing.amount!==amount)throw new PaymentError(409,'A payment link already exists with a different amount. Cancel/reconcile it before changing charges.');if(existing.status==='cancelled')throw new PaymentError(409,'This booking payment was cancelled. Contact the shop.');return {...publicRecord(existing),token:existing.guest_token};}
   const id='pi_'+randomBytes(12).toString('hex'),token=randomBytes(32).toString('hex'),at=now(),title=String(input.title||'Repair service').trim().slice(0,160),shopName=String(input.shopName||'ServiceHub shop').trim().slice(0,120);
   db.prepare('INSERT INTO intents(id,shop_id,booking_id,guest_token,amount,shop_name,title,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,shopId,bookingId,token,amount,shopName,title,at,at+7*86400000);audit(id,'LINK_CREATED');return {...publicRecord(get(id)),token};
  },
  list(shopId){return db.prepare('SELECT * FROM intents WHERE shop_id=? ORDER BY created_at DESC LIMIT 500').all(shopId).map(row=>({...publicRecord(row),token:row.guest_token}));},
  status(token){return publicRecord(byToken(token));},
  cash(shopId,input){
   const row=db.prepare('SELECT * FROM intents WHERE id=? AND shop_id=?').get(input.intentId,shopId);
   if(!row)throw new PaymentError(404,'Payment link not found.');
   return serial(row.guest_token,async()=>{
    const latest=get(row.id);if(latest.status==='paid')throw new PaymentError(409,'This booking is already paid. Refresh its payment status.');
    if(latest.status!=='pending')throw new PaymentError(409,'This payment link is not open.');
    if(latest.order_id){const result=await provider('orders/'+encodeURIComponent(latest.order_id)+'/payments');const payment=result.items?.find(p=>p.status==='captured');if(payment)await captured(latest,payment.id);throw new PaymentError(409,'Online checkout has already started. Check its payment status before accepting cash.');}
    if(rupeesToPaise(input.amount)!==latest.amount)throw new PaymentError(409,'Cash must match the full final amount.');
    const collector=String(input.collectorName||'').trim().slice(0,120),collectorId=String(input.collectorId||'').trim().slice(0,100),role=String(input.collectorRole||'');
    if(!collector||!collectorId||!['technician','shop_owner','staff'].includes(role))throw new PaymentError(400,'Cash collector details are required.');
    const reference='cash_'+randomBytes(12).toString('hex');
    db.prepare("UPDATE intents SET status='paid',payment_id=?,method='cash',paid_at=? WHERE id=? AND status='pending'").run(reference,now(),latest.id);
    audit(latest.id,'CASH_COLLECTED',JSON.stringify({collector,collectorId,role}));return {...publicRecord(get(latest.id)),collectorName:collector,collectorId,collectorRole:role};
   });
  },
  checkout(token){return serial(token,async()=>{const row=byToken(token);usable(row);if(!row.order_id){const order=await provider('orders',{method:'POST',body:JSON.stringify({amount:row.amount,currency:'INR',receipt:row.id,notes:{servicehub_intent_id:row.id,booking_id:row.booking_id}})});if(!/^order_[A-Za-z0-9]+$/.test(order.id)||order.amount!==row.amount||order.currency!=='INR')throw new PaymentError(502,'Gateway order validation failed.');db.prepare('UPDATE intents SET order_id=? WHERE id=?').run(order.id,row.id);audit(row.id,'ORDER_CREATED',order.id);}const updated=get(row.id);return {...publicRecord(updated),keyId,orderId:updated.order_id};});},
  verify(token,input){return serial(token,async()=>{const row=byToken(token);if(!row.order_id||input.razorpay_order_id!==row.order_id||!secretEqual(signature(keySecret,row.order_id+'|'+input.razorpay_payment_id),input.razorpay_signature))throw new PaymentError(400,'Payment signature verification failed.');return captured(row,input.razorpay_payment_id);});},
  async webhook(raw,provided){
   if(!webhookSecret||!secretEqual(signature(webhookSecret,raw),provided))throw new PaymentError(400,'Webhook signature verification failed.');
   let event;try{event=JSON.parse(raw.toString('utf8'));}catch{throw new PaymentError(400,'Invalid webhook.');}
   if(event.event!=='payment.captured')return {received:true};const payment=event.payload?.payment?.entity;if(!payment?.order_id||!payment?.id)throw new PaymentError(400,'Missing payment information.');
   const row=db.prepare('SELECT * FROM intents WHERE order_id=?').get(payment.order_id);if(!row)return {received:true};
   return serial(row.guest_token,()=>captured(row,payment.id));
  },
  reconcile,refreshIfDue,
  async refreshPending(shopId){const rows=db.prepare("SELECT guest_token FROM intents WHERE shop_id=? AND status='pending' AND order_id IS NOT NULL ORDER BY created_at DESC LIMIT 20").all(shopId);await Promise.all(rows.map(row=>refreshIfDue(row.guest_token)));}
 };
}
