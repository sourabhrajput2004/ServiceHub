import assert from 'node:assert/strict';
import React,{useState} from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.document={body:{style:{}},documentElement:{lang:''}};
let success,failure;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{getCurrentPosition(ok,bad){success=ok;failure=bad;}}}});
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let tree;
try{
 const {repairDeviceType,repairDetailsPayload,repairDetailsErrors}=await server.ssrLoadModule('/src/utils/repairDetails.js');
 const {LanguageProvider}=await server.ssrLoadModule('/src/context/LanguageContext.jsx'),{AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx'),{ShopProvider,useShop}=await server.ssrLoadModule('/src/context/ShopContext.jsx');
 const {default:AddRepair}=await server.ssrLoadModule('/src/components/seller/AddRepairButton.jsx'),{default:Location}=await server.ssrLoadModule('/src/components/seller/ServiceLocationFields.jsx');
 const mobile={id:'shop_1',shopTypes:['mobile'],services:[{id:'service-test',name:'Battery replacement',appliesTo:['Phone']}]};
 assert.equal(repairDeviceType(mobile),'Smartphone');assert.equal(repairDeviceType({...mobile,shopTypes:['appliances']}),'Home Appliances');assert.equal(repairDeviceType({...mobile,shopTypes:['mobile','appliances']},mobile.services[0]),'Smartphone');assert.ok(repairDetailsErrors({brand:'Samsung',model:'A54',serviceId:'fake'},mobile).serviceId);
 store.set('servicehub_shops',JSON.stringify([mobile]));store.set('servicehub_user',JSON.stringify({id:'shop_1',shopId:'shop_1',role:'shop_owner',name:'Owner',email:'test@example.in'}));let ctx;
 function Host(){ctx=useShop();return React.createElement(AddRepair,{shop:ctx.shops[0]});}
 const wrap=el=>React.createElement(LanguageProvider,null,React.createElement(AuthProvider,null,React.createElement(ShopProvider,null,el)));
 const text=n=>n.children.map(c=>typeof c==='string'?c:text(c)).join('');
 const click=label=>act(()=>tree.root.findAllByType('button').find(b=>text(b).trim()===label).props.onClick());
 const field=(label,value)=>{const l=tree.root.findAllByType('label').find(n=>text(n).startsWith(label));assert.ok(l,label);const control=l.findAll(n=>['input','select','textarea'].includes(n.type))[0];act(()=>control.props.onChange({target:{value}}));};
 act(()=>tree=Renderer.create(wrap(React.createElement(Host)),{createNodeMock:()=>({showModal(){},close(){},focus(){}})}));click('Add Repair');
 assert.ok(!text(tree.root).includes('IMEI'));assert.ok(!text(tree.root).includes('Repair needed'));assert.ok(!text(tree.root).includes('Custom repair'));assert.ok(tree.root.findAllByType('input').some(n=>n.props.disabled&&n.props.value==='Smartphone'));
 field('Customer name','Test Customer');field('Mobile number','9876543210');field('Brand *','Samsung');field('Model *','Galaxy A54');field('Select service','service-test');field('Customer address','42 Raj Nagar Ghaziabad');act(()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));
 const job=ctx.bookings[0];assert.equal(job.brand,'Samsung');assert.equal(job.model,'Galaxy A54');assert.equal(job.deviceBrand,'Samsung Galaxy A54');assert.equal(job.issueType,'Battery replacement');assert.equal(job.deviceType,'Smartphone');
 act(()=>tree.unmount());let locationForm;
 function LocationHost(){const [form,setForm]=useState({serviceMode:'home',customerAddress:'42 Test Road',googleMapsUrl:'',latitude:'',longitude:''});locationForm=form;return React.createElement(Location,{form,onChange:setForm});}
 act(()=>tree=Renderer.create(React.createElement(LanguageProvider,null,React.createElement(LocationHost))));assert.ok(!text(tree.root).includes('Latitude'));assert.ok(!text(tree.root).includes('Longitude'));click('Detect location');act(()=>success({coords:{latitude:28.7,longitude:77.4}}));assert.ok(locationForm.googleMapsUrl.includes('28.7,77.4'));assert.equal(locationForm.latitude,'28.7');
 field('Customer Google Maps location','https://maps.app.goo.gl/shared');assert.equal(locationForm.latitude,'','New pasted link must clear old detected pin');click('Detect location');act(()=>failure({code:1}));assert.ok(text(tree.root).includes('permission was denied'));
 console.log('Passed owner form save, separate brand/model, shop-derived locked device, service-only selection, hidden IMEI/repair/coordinates, geolocation success, stale-pin clearing and denied permission.');
}finally{act(()=>tree?.unmount());await server.close();}

