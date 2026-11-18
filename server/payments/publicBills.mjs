import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBillDocuments} from './billDocuments.mjs';
export function createPublicBillServer(database){
 const db=new DatabaseSync(database,{readOnly:true}),bills=createBillDocuments(db,{readOnly:true});
 const server=http.createServer((req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),match=url.pathname.match(/^\/api\/payments\/bills\/([a-f0-9]{64})\.pdf$/);
   if(!match||!['GET','HEAD'].includes(req.method)){res.writeHead(404,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Not found');return;}
   const bill=bills.read(match[1]);res.writeHead(200,{'Content-Type':'application/pdf','Content-Length':bill.pdf.length,'Content-Disposition':(url.searchParams.get('download')==='1'?'attachment':'inline')+'; filename="'+bill.filename+'"','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive'});res.end(req.method==='HEAD'?undefined:bill.pdf);
  }catch{res.writeHead(404,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Bill link unavailable');}
 });
 server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 createPublicBillServer(resolve('.data/payments.sqlite')).listen(3002,'127.0.0.1',()=>console.log('Read-only bill PDF server ready on 127.0.0.1:3002'));
}
