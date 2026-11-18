import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.document={documentElement:{lang:''}};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{default:Composer}=await server.ssrLoadModule('/src/components/seller/BillComposer.jsx');
 const part={id:'part-lock',shopId:'shop_1',name:'Screen',sellingPrice:4500,stockQty:10},invoice={shopId:'shop_1',customerName:'Customer',customerPhone:'9876543210',paidAmount:0,items:[{name:'Repair service',qty:1,rate:500},{name:part.name,inventoryItemId:part.id,isInventoryPart:true,qty:1,rate:4000}]};
 for(const role of ['shop_owner','staff'])for(const correction of [false,true]){storage.set('servicehub_user',JSON.stringify({id:role==='shop_owner'?'shop_1':'counter',shopId:'shop_1',role,name:'Test',email:'test@example.in'}));const element=[LanguageProvider,AuthProvider,ShopProvider].reduceRight((c,P)=>React.createElement(P,null,c),React.createElement(Composer,{invoice,correction,inventory:[part],onSave(){},onCancel(){}}));act(()=>tree=Renderer.create(element));const rates=tree.root.findAllByType('input').filter(n=>n.props.step==='0.01'&&[500,4000,4500].includes(n.props.value));assert.ok(rates.some(n=>n.props.value===500&&!n.props.disabled));const locked=rates.find(n=>n.props.value===(correction?4500:4000));assert.ok(locked?.props.disabled);assert.ok(locked.props.readOnly);assert.equal(locked.props.onChange,undefined);act(()=>tree.unmount());}
 console.log('Passed owner/counter disabled spare-part inputs, no rate change handler, preserved pending prices and current inventory price on replacement.');
}finally{act(()=>tree?.unmount());await server.close();}
