import http from 'node:http';
import {mkdirSync,existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPaymentService,PaymentError,secretEqual} from './core.mjs';
import {createBillDocuments} from './billDocuments.mjs';
export function createPaymentServer(config={}){
 const appUrl=new URL(config.appUrl||'http://localhost:3000'),local=['localhost','127.0.0.1','[::1]'].includes(appUrl.hostname),password=config.operatorPassword||'',shopId=config.shopId||'shop_1',attempts=new Map(),requests=new Map();
 if(config.keyId&&!config.keyId.startsWith('rzp_test_'))throw new Error('Only Razorpay TEST keys are supported by this integration.');
 if(!local&&password.length<16)throw new Error('Set a strong PAYMENT_OPERATOR_PASSWORD before exposing this backend.');
 const service=createPaymentService(config);
 const bills=createBillDocuments(service.db,{now:config.now});
 const billBase=()=>{
  let value=config.billPublicUrl;
  if(!value&&config.billPublicUrlFile&&existsSync(config.billPublicUrlFile))value=readFileSync(config.billPublicUrlFile,'utf8').trim();
  if(value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw new PaymentError(503,'Invalid public bill address.');return url;}
  return appUrl;
 };
 const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),path=url.pathname,ip=req.socket.remoteAddress,origin=req.headers.origin;
  if(path!=='/api/payments/webhook'){let rate=requests.get(ip);if(!rate||rate.until<Date.now()){rate={count:0,until:Date.now()+60000};requests.set(ip,rate);}if(++rate.count>240)throw new PaymentError(429,'Too many payment requests. Please wait a minute.');}
  if(req.method==='POST'&&path!=='/api/payments/webhook'&&origin&&origin!==appUrl.origin)throw new PaymentError(403,'Request origin is not allowed.');
  if(req.method==='POST'&&path!=='/api/payments/webhook'&&!String(req.headers['content-type']||'').startsWith('application/json'))throw new PaymentError(415,'Use application/json.');
  let raw=Buffer.alloc(0);for await(const chunk of req){raw=Buffer.concat([raw,chunk]);if(raw.length>(path==='/api/payments/bills'?1500000:65536))throw new PaymentError(413,'Request too large.');}
  let body={};if(raw.length&&path!=='/api/payments/webhook'){try{body=JSON.parse(raw.toString());}catch{throw new PaymentError(400,'Invalid JSON.');}}
  const cookie=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('sh_payment_session='))?.split('=')[1]||'';
  const operator=()=>service.authorize(cookie);
  if(req.method==='POST'&&path==='/api/payments/bills'){const bill=bills.publish(operator(),body);return send(res,200,{...bill,url:new URL('/api/payments/bills/'+bill.token+'.pdf',billBase()).href});}
  const billMatch=path.match(/^\/api\/payments\/bills\/([a-f0-9]{64})\.pdf$/);
  if(billMatch&&req.method==='GET'){
   const bill=bills.read(billMatch[1]);res.writeHead(200,{'Content-Type':'application/pdf','Content-Length':bill.pdf.length,'Content-Disposition':(url.searchParams.get('download')==='1'?'attachment':'inline')+'; filename="'+bill.filename+'"','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive'});res.end(bill.pdf);return;
  }
  if(req.method==='GET'&&path==='/api/payments/config')return send(res,200,{provider:'razorpay',mode:'test',configured:service.ready,shopId,localOperatorLogin:local&&!password});
  if(req.method==='POST'&&path==='/api/payments/operator/login'){
   const record=attempts.get(ip)||{count:0,until:Date.now()+900000};if(record.until<Date.now()){record.count=0;record.until=Date.now()+900000;}record.count++;attempts.set(ip,record);if(record.count>10)throw new PaymentError(429,'Too many attempts. Try again in 15 minutes.');
   const loopback=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip);
   if(!(local&&!password&&loopback)&&(!password||!secretEqual(password,body.password)))throw new PaymentError(401,'Incorrect payment desk password.');
   const token=service.session(shopId);res.setHeader('Set-Cookie','sh_payment_session='+token+'; HttpOnly; SameSite=Strict; Path=/api/payments; Max-Age=28800'+(appUrl.protocol==='https:'?'; Secure':''));attempts.delete(ip);return send(res,200,{shopId,mode:'test'});
  }
  if(req.method==='POST'&&path==='/api/payments/operator/logout'){service.logout(cookie);res.setHeader('Set-Cookie','sh_payment_session=; HttpOnly; SameSite=Strict; Path=/api/payments; Max-Age=0');return send(res,200,{success:true});}
  if(path==='/api/payments/cash'&&req.method==='POST')return send(res,200,await service.cash(operator(),body));
  if(path==='/api/payments/intents'&&req.method==='POST'){const intent=service.create(operator(),body);return send(res,200,{...intent,url:new URL('/pay/'+intent.token,appUrl).href});}
  if(path==='/api/payments/intents'&&req.method==='GET'){const shop=operator();await service.refreshPending(shop);return send(res,200,{intents:service.list(shop).map(i=>({...i,url:new URL('/pay/'+i.token,appUrl).href}))});}
  if(path==='/api/payments/webhook'&&req.method==='POST')return send(res,200,await service.webhook(raw,req.headers['x-razorpay-signature']));
  const match=path.match(/^\/api\/payments\/guest\/([a-f0-9]{64})(?:\/(checkout|verify|refresh))?$/);
  if(match){const token=match[1],action=match[2];if(req.method==='GET'&&!action){await service.refreshIfDue(token);return send(res,200,service.status(token));}if(req.method==='POST'&&action==='checkout')return send(res,200,await service.checkout(token));if(req.method==='POST'&&action==='verify')return send(res,200,await service.verify(token,body));if(req.method==='POST'&&action==='refresh')return send(res,200,await service.reconcile(token));}
  send(res,404,{error:'Payment endpoint not found.'});
 }catch(error){send(res,error.status||500,{error:error instanceof PaymentError?error.message:'Payment service error. Please retry.'});}});
 server.on('close',()=>service.close());return {server,service};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(existsSync('.env'))process.loadEnvFile('.env');mkdirSync('.data',{recursive:true});
 const {server,service}=createPaymentServer({database:resolve('.data/payments.sqlite'),appUrl:process.env.PUBLIC_APP_URL||'http://localhost:3000',billPublicUrl:process.env.BILL_PUBLIC_URL,billPublicUrlFile:resolve('.data/bill-public-url.txt'),shopId:process.env.PAYMENT_SHOP_ID||'shop_1',operatorPassword:process.env.PAYMENT_OPERATOR_PASSWORD,keyId:process.env.RAZORPAY_KEY_ID,keySecret:process.env.RAZORPAY_KEY_SECRET,webhookSecret:process.env.RAZORPAY_WEBHOOK_SECRET});
 server.listen(Number(process.env.PAYMENT_API_PORT||3001),process.env.PAYMENT_API_HOST||'127.0.0.1',()=>console.log('ServiceHub payment API ready on port '+(process.env.PAYMENT_API_PORT||3001)+' | Razorpay TEST '+(service.ready?'configured':'keys required')));
}
