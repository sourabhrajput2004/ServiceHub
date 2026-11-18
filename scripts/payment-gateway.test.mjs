import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createPaymentService,signature,rupeesToPaise} from '../server/payments/core.mjs';
import {createPaymentServer} from '../server/payments/server.mjs';
import {applyVerifiedPayment} from '../src/utils/paymentApi.js';
const temp=mkdtempSync(join(tmpdir(),'servicehub-payments-test-')),database=join(temp,'payments.sqlite'),orders=new Map(),payments=new Map();let orderNumber=0,clock=Date.UTC(2026,10,13,10);
const keySecret='test_secret_for_automated_tests_only',webhookSecret='test_webhook_secret_only';
const providerFetch=async(url,options={})=>{
 assert.equal(options.headers.Authorization,'Basic '+Buffer.from('rzp_test_AUTOMATED:'+keySecret).toString('base64'));
 const path=new URL(url).pathname.replace('/v1/','');let value;
 if(path==='orders'&&options.method==='POST'){const body=JSON.parse(options.body);value={...body,id:'order_'+(++orderNumber)};orders.set(value.id,value);}
 else if(path.startsWith('payments/'))value=payments.get(path.slice(9));
 else if(/^orders\/order_\d+\/payments$/.test(path))value={items:[...payments.values()].filter(p=>p.order_id===path.split('/')[1])};
 return {ok:Boolean(value),json:async()=>value};
};
const config={database,keyId:'rzp_test_AUTOMATED',keySecret,webhookSecret,providerFetch,now:()=>clock,appUrl:'http://localhost:3000',operatorPassword:'automated-test-password',shopId:'shop_1'};
let server,service;
try{
 ({server,service}=createPaymentServer(config));server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;let cookie='';
 const request=async(path,body,{auth=true,origin='http://localhost:3000',raw,signature:provided}={})=>{const response=await fetch(base+'/api/payments'+path,{method:body===undefined&&raw===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(origin?{Origin:origin}:{}),...(auth&&cookie?{Cookie:cookie}:{}),...(provided?{'x-razorpay-signature':provided}:{})},...(raw!==undefined?{body:raw}:body!==undefined?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};};
 assert.equal(rupeesToPaise('123.45'),12345);for(const amount of ['0','-1','1.234','1e3','Infinity'])assert.throws(()=>rupeesToPaise(amount));
 assert.equal((await request('/intents',{bookingId:'BK-1',amount:'500'})).status,401);
 assert.equal((await request('/operator/login',{password:'wrong'})).status,401);
 assert.equal((await request('/operator/login',{password:'automated-test-password'},{origin:'https://evil.example'})).status,403);
 const login=await request('/operator/login',{password:'automated-test-password'});assert.equal(login.status,200);assert.match(login.cookie,/HttpOnly/);cookie=login.cookie.split(';')[0];
 const made=await request('/intents',{bookingId:'BK-1',amount:'500.25',shopName:'Test Shop',title:'Screen repair',shopId:'attacker-shop'});assert.equal(made.status,200);const intent=made.data,token=intent.token;assert.equal(intent.shopId,'shop_1');assert.equal(intent.amount,50025);assert.ok(intent.url.endsWith('/pay/'+token));
 assert.equal((await request('/intents',{bookingId:'BK-1',amount:'500.25'})).data.id,intent.id);
 assert.equal((await request('/intents',{bookingId:'BK-1',amount:'1'})).status,409,'Locked amount cannot change');
 const publicDetails=await request('/guest/'+token,undefined,{auth:false});assert.equal(publicDetails.status,200);assert.equal(publicDetails.data.token,undefined);assert.equal(publicDetails.data.keySecret,undefined);assert.equal(publicDetails.data.customerPhone,undefined);
 assert.equal((await request('/guest/'+'a'.repeat(64),undefined,{auth:false})).status,404);
 const [first,second]=await Promise.all([request('/guest/'+token+'/checkout',{}, {auth:false}),request('/guest/'+token+'/checkout',{}, {auth:false})]);assert.equal(first.status,200);assert.equal(first.data.orderId,second.data.orderId);assert.equal(orderNumber,1,'Concurrent clicks reuse one Razorpay order');const orderId=first.data.orderId;
 const payment={id:'pay_TEST1',order_id:orderId,amount:50025,currency:'INR',status:'authorized',captured:false,method:'upi'};payments.set(payment.id,payment);
 const callback={razorpay_order_id:orderId,razorpay_payment_id:payment.id,razorpay_signature:signature(keySecret,orderId+'|'+payment.id)};
 assert.equal((await request('/guest/'+token+'/verify',{...callback,razorpay_signature:'wrong'})).status,400);
 assert.equal((await request('/guest/'+token+'/verify',{...callback,razorpay_order_id:'order_WRONG'})).status,400);
 const authorized=await request('/guest/'+token+'/verify',callback);assert.equal(authorized.data.status,'pending','Authorized is not captured');
 payments.set(payment.id,{...payment,status:'captured',captured:true,amount:1});assert.equal((await request('/guest/'+token+'/verify',callback)).status,409,'Provider amount must match');
 payments.set(payment.id,{...payment,status:'captured',captured:true,currency:'USD'});assert.equal((await request('/guest/'+token+'/verify',callback)).status,409,'Currency must match');
 payments.set(payment.id,{...payment,status:'captured',captured:true});const paid=await request('/guest/'+token+'/verify',callback);assert.equal(paid.data.status,'paid');assert.equal(paid.data.paymentId,payment.id);
 assert.equal((await request('/guest/'+token+'/verify',callback)).data.paymentId,payment.id,'Callback retry is idempotent');
 const raw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:payment.id,order_id:orderId}}}});assert.equal((await request('/webhook',undefined,{raw,signature:'bad'})).status,400);
 assert.equal((await request('/webhook',undefined,{raw,signature:signature(webhookSecret,raw)})).status,200);
 assert.equal(service.db.prepare("SELECT count(*) AS n FROM payment_audit WHERE intent_id=? AND action='PAYMENT_CAPTURED'").get(intent.id).n,1,'Webhook retries do not duplicate settlement');
 assert.equal((await request('/guest/'+token+'/checkout',{})).status,409,'Paid booking cannot collect again');
 const patch=applyVerifiedPayment({id:'BK-1',shopId:'shop_1'},paid.data);assert.equal(patch.isPaid,true);assert.equal(patch.paymentAmount,500.25);assert.equal(applyVerifiedPayment({id:'different',shopId:'shop_1'},paid.data),null);assert.equal(applyVerifiedPayment({id:'BK-1',shopId:'wrong'},paid.data),null);assert.equal(applyVerifiedPayment({id:'BK-1',shopId:'shop_1'},{...paid.data,status:'pending'}),null);
 const webhookIntent=(await request('/intents',{bookingId:'BK-WEBHOOK',amount:'200'})).data;const webhookOrder=(await request('/guest/'+webhookIntent.token+'/checkout',{})).data;payments.set('pay_WEBHOOK',{id:'pay_WEBHOOK',order_id:webhookOrder.orderId,amount:20000,currency:'INR',captured:true,status:'captured',method:'card'});const webhookRaw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_WEBHOOK',order_id:webhookOrder.orderId}}}});await request('/webhook',undefined,{raw:webhookRaw,signature:signature(webhookSecret,webhookRaw)});assert.equal((await request('/guest/'+webhookIntent.token)).data.status,'paid','Webhook settles even with browser closed');
 const recovered=(await request('/intents',{bookingId:'BK-RECOVER',amount:'75'})).data;const recoveredOrder=(await request('/guest/'+recovered.token+'/checkout',{})).data;payments.set('pay_RECOVER',{id:'pay_RECOVER',order_id:recoveredOrder.orderId,amount:7500,currency:'INR',captured:true,status:'captured',method:'upi'});assert.equal((await request('/guest/'+recovered.token)).data.status,'paid','Status polling reconciles a captured payment after callback loss');
 const expired=(await request('/intents',{bookingId:'BK-EXPIRED',amount:'100'})).data;clock+=8*86400000;assert.equal((await request('/guest/'+expired.token+'/checkout',{})).status,410);
 // A second shop cannot be selected by caller-controlled request fields.
 service.create('shop_other',{bookingId:'PRIVATE',amount:'100'});const again=await request('/operator/login',{password:'automated-test-password'});cookie=again.cookie.split(';')[0];assert.ok((await request('/intents')).data.intents.every(row=>row.shopId==='shop_1'));
 const cashIntent=(await request('/intents',{bookingId:'BK-CASH',amount:'250'})).data;
 const cashBody={intentId:cashIntent.id,amount:'250',collectorId:'tech_cash',collectorName:'Pawan Sharma',collectorRole:'technician'};
 assert.equal((await request('/cash',cashBody,{auth:false})).status,401);
 assert.equal((await request('/cash',{...cashBody,amount:'249'})).status,409);
 const cash=await request('/cash',cashBody);assert.equal(cash.status,200);assert.equal(cash.data.method,'cash');
 const cashStatus=(await request('/guest/'+cashIntent.token)).data;assert.equal(cashStatus.status,'paid');assert.equal(cashStatus.collectorName,'Pawan Sharma');assert.equal(cashStatus.collectorRole,'technician');
 assert.equal((await request('/guest/'+cashIntent.token+'/checkout',{})).status,409,'Cash prevents further online checkout');
 assert.equal((await request('/cash',cashBody)).status,409,'Cash cannot be recorded twice');
 const cashPatch=applyVerifiedPayment({id:'BK-CASH',shopId:'shop_1'},cashStatus);assert.equal(cashPatch.paymentMethod,'Cash');assert.equal(cashPatch.cashCollectedBy,'Pawan Sharma');
 const activeIntent=(await request('/intents',{bookingId:'BK-ACTIVE',amount:'50'})).data;await request('/guest/'+activeIntent.token+'/checkout',{});
 assert.equal((await request('/cash',{...cashBody,intentId:activeIntent.id,amount:'50'})).status,409,'An already opened gateway checkout needs reconciliation before cash');
 await new Promise(resolve=>server.close(resolve));server=null;
 const reopened=createPaymentService({...config,database});assert.equal(reopened.status(token).status,'paid');reopened.close();
 assert.throws(()=>createPaymentServer({appUrl:'https://public.example',operatorPassword:''}),/strong/);
 assert.throws(()=>createPaymentServer({keyId:'rzp_live_BLOCKED'}),/TEST/);
 console.log('Passed Razorpay test API auth, server-owned amounts, guest capabilities, capture verification, tamper rejection, idempotency, webhook recovery, expiry, SQLite persistence, shop isolation and UI payment mapping.');
}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 // Only remove the verified temporary directory owned by this test.
 assert.ok(resolve(temp).startsWith(resolve(tmpdir())+String.raw`\servicehub-payments-test-`)||resolve(temp).startsWith(resolve(tmpdir())+'/servicehub-payments-test-'));
 if(existsSync(temp))rmSync(temp,{recursive:true,force:true});
}
