import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};globalThis.document={documentElement:{lang:'',dataset:{},style:{}},body:{style:{}},querySelector:()=>null};
const tech={id:'tech_jobs',shopId:'shop_1',role:'technician',status:'ACTIVE',name:'Test Technician'},now=new Date().toISOString();
store.set('servicehub_user',JSON.stringify(tech));store.set('servicehub_workforce_v1',JSON.stringify({members:[tech],events:[]}));
store.set('servicehub_bookings',JSON.stringify([
 {id:'ASSIGNED',shopId:'shop_1',assignedTechId:tech.id,assignedAt:now,workPhase:'Assigned',customerName:'Customer A'},
 {id:'PAID',shopId:'shop_1',assignedTechId:tech.id,assignedAt:now,paymentCompletedAt:now,isPaid:true,status:'Delivered',workPhase:'Done',customerName:'Customer B'},
 {id:'CANCELLED',shopId:'shop_1',assignedTechId:tech.id,cancelledAt:now,status:'Cancelled',customerName:'Customer C'},
 {id:'OLDER',shopId:'shop_1',assignedTechId:tech.id,paymentCompletedAt:'2020-01-01T10:00:00Z',isPaid:true,status:'Delivered',workPhase:'Done'},
 {id:'OTHER-TECH',shopId:'shop_1',assignedTechId:'other',assignedAt:now,workPhase:'Assigned'},
 ]));
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {ThemeProvider}=await server.ssrLoadModule('/src/context/ThemeContext.jsx'),{LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider}=await server.ssrLoadModule('/src/context/ShopContext.jsx'),{WorkforceProvider}=await server.ssrLoadModule('/src/context/WorkforceContext.jsx'),{default:Jobs}=await server.ssrLoadModule('/src/components/workforce/TechnicianJobs.jsx');
 const element=[MemoryRouter,ThemeProvider,LanguageProvider,AuthProvider,ShopProvider,WorkforceProvider].reduceRight((c,P)=>React.createElement(P,P===MemoryRouter?{initialEntries:['/technician/jobs'],future:{v7_startTransition:true,v7_relativeSplatPath:true}}:null,c),React.createElement(Jobs,{actor:tech}));
 await act(async()=>{tree=Renderer.create(element);});
 const cards=()=>tree.root.findAllByType('article'),choose=status=>tree.root.findByProps({'aria-label':'Job status filters'}).findAllByType('button').find(b=>b.children[0]===status);
 assert.equal(cards().length,3,'Today shows assigned, paid and cancelled jobs together');
 act(()=>choose('Completed').props.onClick());assert.equal(cards().length,1);assert.ok(cards()[0].findByType('header').children.some(c=>typeof c!=='string'&&c.children?.includes('PAID')));
 act(()=>choose('All time').props.onClick());assert.equal(cards().length,4,'All time includes every saved date');act(()=>choose('Completed').props.onClick());assert.equal(cards().length,2,'Older completed jobs are retained');
 act(()=>choose('Cancelled').props.onClick());assert.equal(cards().length,1);
 act(()=>choose('Assigned').props.onClick());assert.equal(cards().length,1);
 act(()=>tree.root.findByProps({'aria-label':'Job period'}).props.onChange({target:{value:'Weekly'}}));assert.equal(tree.root.findAllByProps({type:'week'}).length,1);
 act(()=>tree.root.findByProps({'aria-label':'Job period'}).props.onChange({target:{value:'Monthly'}}));assert.equal(tree.root.findAllByProps({type:'month'}).length,1);
 act(()=>tree.root.findByProps({'aria-label':'Job period'}).props.onChange({target:{value:'Yearly'}}));assert.equal(tree.root.findByProps({'aria-label':'Choose year'}).props.type,'number');
 console.log('Passed compact Jobs page, all status views, old completed records, technician scoping and relative calendar inputs.');
}finally{await act(async()=>tree?.unmount());await server.close();}
