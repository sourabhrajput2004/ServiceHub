import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
await import('jspdf');
const store=new Map();let downloads=0,opened=[],publications=0;
const billUrl='https://servicehub.example/api/payments/bills/'+'b'.repeat(64)+'.pdf';
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
globalThis.window={addEventListener(){},removeEventListener(){},open:()=>({opener:null,location:{replace:url=>opened.push(url)},close(){}})};
globalThis.document={documentElement:{lang:'',dataset:{},style:{}},body:{style:{},appendChild(){}},createElement:()=>({style:{},click(){downloads++;},remove(){}})};
globalThis.fetch=async(path,options={})=>{
 let value;if(path.endsWith('/config'))value={shopId:'shop_1',localOperatorLogin:true};else if(path.endsWith('/operator/login'))value={shopId:'shop_1'};
 else if(path.endsWith('/bills')){const body=JSON.parse(options.body);assert.equal(body.invoiceId,'INV-SHARE');assert.ok(Buffer.from(body.pdf,'base64').toString().startsWith('%PDF-'));publications++;value={url:billUrl,token:'b'.repeat(64)};}else throw Error('Unexpected request '+path);
 return {ok:true,json:async()=>value};
};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{default:Actions}=await server.ssrLoadModule('/src/components/seller/CustomerInvoiceActions.jsx');
 const invoice={id:'INV-SHARE',shopId:'shop_1',customerName:'Pankaj Sharma',customerPhone:'9876543210',items:[{name:'Screen repair',qty:1,rate:250}],grandTotal:250,paymentStatus:'Fully Paid'};
 await act(async()=>{tree=Renderer.create(React.createElement(LanguageProvider,null,React.createElement(Actions,{invoice,shop:{id:'shop_1',shopName:'Rajan Mobile & Laptop Care'},job:{customerPhone:'9876543210'},showWhatsapp:true})));});
 const send=()=>tree.root.findAllByType('button').find(b=>b.props.className.includes('invoice-action-whatsapp'));
 for(let n=0;n<100&&send().props.disabled;n++)await act(async()=>{await new Promise(r=>setTimeout(r,20));});
 assert.equal(send().props.disabled,false);
 await act(async()=>{await send().props.onClick();});assert.equal(downloads,0,'Sender does not download the PDF');assert.equal(publications,1);
 const url=new URL(opened[0]);assert.equal(url.pathname,'/919876543210');const message=url.searchParams.get('text');assert.ok(message.includes('Hello Pankaj Sharma'));assert.ok(message.includes('From Rajan Mobile & Laptop Care'));assert.ok(message.includes(billUrl+'?download=1'));
 assert.equal(tree.root.findByProps({'aria-label':'Customer bill PDF link'}).type,'a');assert.equal(tree.root.findByProps({'aria-label':'Customer bill PDF link'}).props.href,billUrl+'?download=1');
 await act(async()=>{await send().props.onClick();});assert.equal(publications,1,'Repeat clicks reuse the published PDF');assert.equal(send().props.disabled,false);
 window.open=()=>null;await act(async()=>{await send().props.onClick();});assert.equal(send().props.disabled,false);assert.ok(tree.root.findAllByType('a').some(a=>a.props.href===billUrl+'?download=1'),'Download option remains available if popup is blocked');
 console.log('Passed greeting/shop/PDF WhatsApp message, no sender download, stable repeat sharing and popup-block fallback.');
}finally{await act(async()=>tree?.unmount());await server.close();}
