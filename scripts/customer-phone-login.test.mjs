import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const customer={id:'cust_phone',role:'customer',email:'customer@example.com',phone:'9876543210',name:'Existing customer',avatar:'saved-photo'};
storage.set('servicehub_accounts',JSON.stringify({'customer:customer@example.com':customer,'shop_owner:owner@example.com':{id:'shop_1',role:'shop_owner',email:'owner@example.com',phone:'9876543211'}}));
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree,auth;
try{
 const {AuthProvider,useAuth}=await server.ssrLoadModule('/src/context/AuthContext.jsx');function Probe(){auth=useAuth();return null;}
 await act(async()=>{tree=Renderer.create(React.createElement(AuthProvider,null,React.createElement(Probe)));});
 for(const identifier of ['9876543210','+91 98765 43210','09876543210','CUSTOMER@example.com']){
  let result;act(()=>{result=auth.login(identifier,'test','customer');});assert.equal(result.status,'success');assert.equal(auth.user.id,customer.id);assert.equal(auth.user.email,customer.email);assert.equal(auth.user.avatar,'saved-photo');
 }
 const count=Object.keys(JSON.parse(storage.get('servicehub_accounts'))).length;
 for(const identifier of ['123','bad-email','9876543212','9876543211']){let result;act(()=>{result=auth.login(identifier,'test','customer');});assert.equal(result.status,'error');assert.equal(auth.user.id,customer.id);}
 assert.equal(Object.keys(JSON.parse(storage.get('servicehub_accounts'))).length,count,'Phone login never creates duplicate customer accounts');
 console.log('Passed email and phone login, country-code formats, preserved customer identity and rejection of unknown/other-role phones.');
}finally{await act(async()=>tree?.unmount());await server.close();}
