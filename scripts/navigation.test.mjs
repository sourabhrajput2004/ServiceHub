import {SELLER_NAVIGATION,usesSellerSidebar} from '../src/utils/sellerNavigation.js';
﻿import assert from 'node:assert/strict';
import { mainNavigation,accountNavigation,dashboardPath,supportPath,navigationActive } from '../src/utils/navigation.js';
assert.deepEqual(mainNavigation(null).map(([,label])=>label),['Home','About','Contact','Find Shops']);
for(const role of ['customer','shop_owner','admin']) {
 const user={role};const main=mainNavigation(user),account=accountNavigation(user);
 assert.ok(!main.some(([,label])=>['Home','About','Contact'].includes(label)));
 assert.ok(!account.some(([path])=>['/login','/register'].includes(path)));
 if(role==='shop_owner'){assert.deepEqual(main,[]);const items=SELLER_NAVIGATION.flatMap(group=>group.items);assert.equal(items[0][0],dashboardPath(user));assert.equal(items.at(-1)[0],'/settings');assert.equal(new Set(items.map(([path])=>path)).size,items.length);assert.equal(usesSellerSidebar(user,'/support'),true);assert.equal(usesSellerSidebar(user,'/register-shop'),false);}else{assert.equal(main[0][0],dashboardPath(user));assert.deepEqual(main.at(-1),['/settings','Settings']);}
 assert.ok(main.every(([path])=>!path.includes('#')));
 assert.equal(new Set(main.map(([path])=>path)).size,main.length);
 assert.ok(account.some(([path])=>path===(role==='shop_owner'?'/shop/profile':'/profile')));
}
assert.equal(supportPath({role:'customer'}),'/support');
assert.equal(supportPath({role:'shop_owner'}),'/support');
assert.equal(navigationActive('/my-repairs','/my-repairs'),true);
assert.equal(navigationActive('/my-repairs','/customer-dashboard'),false);
console.log('Passed separate route, last Settings link, role navigation and profile/footer checks.');

