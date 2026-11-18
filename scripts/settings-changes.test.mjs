import assert from 'node:assert/strict';
import {settingsChanges,changedAddressError} from '../src/utils/settingsChanges.js';
const baseline={name:'Sourabh',avatar:'',phone:'',email:'',pending:null,notifications:{},addresses:[{id:'old',houseNumber:'',street:'Raj Nagar',city:'Ghaziabad',state:'Uttar Pradesh',pincode:'',isDefault:true}]};
const draft=()=>structuredClone(baseline);
assert.equal(settingsChanges(baseline,draft()).any,false);
for(const [key,value] of [['name','New name'],['avatar','data:image/png;base64,test'],['phone','9876543210'],['email','new@example.com']]){
 const next=draft();next[key]=value;assert.equal(settingsChanges(baseline,next)[key],true);assert.equal(settingsChanges(baseline,next).any,true);next[key]=baseline[key];assert.equal(settingsChanges(baseline,next).any,false);
}
const notify=draft();notify.notifications.push=true;assert.equal(settingsChanges(baseline,notify).notifications,true);notify.notifications.push=false;assert.equal(settingsChanges(baseline,notify).any,false);
const address=draft();address.addresses[0].houseNumber='42';assert.equal(settingsChanges(baseline,address).addresses,true);assert.equal(changedAddressError(baseline.addresses,address.addresses),null);
address.addresses[0].pincode='abc';assert.equal(changedAddressError(baseline.addresses,address.addresses),'Enter a valid 6-digit PIN code.');
address.addresses[0].pincode='201002';assert.equal(changedAddressError(baseline.addresses,address.addresses),null);
assert.equal(changedAddressError(baseline.addresses,baseline.addresses),null);
const removed=draft();removed.addresses=[];assert.equal(settingsChanges(baseline,removed).addresses,true);
console.log('Settings checks passed: unchanged, single-field edits, revert, photo, notifications and partial legacy-address updates.');
