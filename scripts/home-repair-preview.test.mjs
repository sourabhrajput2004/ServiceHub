import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.document={body:{style:{}},documentElement:{lang:'',dataset:{},style:{}},querySelector(){return null;}};
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{default:Preview}=await server.ssrLoadModule('/src/components/common/HomeRepairPreview.jsx');
 const text=n=>n.children.map(c=>typeof c==='string'?c:text(c)).join('');
 act(()=>tree=Renderer.create(React.createElement(LanguageProvider,null,React.createElement(Preview))));
 const stages=()=>tree.root.findAllByType('button').filter(b=>b.props.className!==undefined);
 assert.equal(stages().length,6);assert.ok(!text(tree.root).includes('On The Way'));
 act(()=>tree.root.findAllByType('button').find(b=>text(b)==='Home Service').props.onClick());assert.equal(stages().length,7);
 act(()=>stages().find(b=>text(b).includes('On The Way')).props.onClick());assert.ok(text(tree.root).includes('assigned technician is on the way'));
 act(()=>tree.root.findAllByType('button').find(b=>text(b)==='Shop Service').props.onClick());assert.equal(stages().length,6);assert.ok(!text(tree.root).includes('On The Way'));assert.ok(text(tree.root).includes('owner can also handle'));
 act(()=>stages().find(b=>text(b).includes('Completed')).props.onClick());assert.equal(tree.root.findByProps({role:'progressbar'}).props['aria-valuenow'],100);assert.ok(text(tree.root).includes('Payment is recorded'));
 assert.ok(text(tree.root).includes('not a live order'));
 console.log('Passed interactive shop/home 6/7 stages, home-only travel, mode reset, assignment explanation and payment completion preview.');
}finally{act(()=>tree?.unmount());await server.close();}
