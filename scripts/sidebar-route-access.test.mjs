import assert from 'node:assert/strict';
import {CUSTOMER_NAVIGATION, usesCustomerSidebar} from '../src/utils/customerNavigation.js';
import {SELLER_NAVIGATION, usesSellerSidebar} from '../src/utils/sellerNavigation.js';

const publicRoutes = ['/', '/about', '/contact', '/privacy-policy', '/terms-and-conditions', '/login', '/login/customer', '/register', '/register-shop', '/member-login', '/pay/test', '/member-invite/test'];
for (const [role, check, navigation] of [['customer', usesCustomerSidebar, CUSTOMER_NAVIGATION], ['shop_owner', usesSellerSidebar, SELLER_NAVIGATION]]) {
 const user = {id:'test-user', role};
 for (const route of publicRoutes) assert.equal(check(user, route), false, `${role} sidebar leaked onto ${route}`);
 for (const [route] of navigation.flatMap(group => group.items)) {
  assert.equal(check(user, route), true, `${role} workspace missing on ${route}`);
  assert.equal(check(null, route), false, `Guest sidebar leaked onto ${route}`);
  assert.equal(check({role:'technician'}, route), false);
  assert.equal(check(user, route + '-other'), false, 'Route boundary must match');
 }
 assert.equal(check(user, '/technician/dashboard'), false);
 assert.equal(check(user, '/staff/orders'), false);
}
assert.equal(usesSellerSidebar({role:'shop_owner'}, '/shop/billing/new'), true);
assert.equal(usesSellerSidebar({role:'shop_owner'}, '/dashboard/members/member-1/edit'), true);
assert.equal(usesCustomerSidebar(null, '/find-shop'), false);
console.log('Passed public-page isolation, guest sidebar exclusion, role scoping and workspace subroutes.');
