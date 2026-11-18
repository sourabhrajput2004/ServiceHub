export const SELLER_NAVIGATION=[
 {label:'WORKSPACE',items:[['/shop/dashboard','Dashboard','dashboard'],['/shop/orders','Orders','orders'],['/my-shop','My Shop','shop'],['/shop/inventory','Inventory','inventory'],['/dashboard/technicians','Technicians','team'],['/shop/staff','Staff','team'],['/dashboard/members','Members','team'],['/shop/services','Services','services'],['/shop/billing','Billing','billing'],['/support','Support','support']]},
 {label:'ACCOUNT',items:[['/shop/profile','Profile','profile'],['/shop/payout-account','Payout Account','payout'],['/dashboard/verification','Verification History','history'],['/settings','Settings','settings']]}
];
export function usesSellerSidebar(user, pathname) {
 if (user?.role !== 'shop_owner') return false;
 const legacyRoutes = ['/profile', '/shop/technicians', '/shop/verification-history'];
 return legacyRoutes.includes(pathname) || SELLER_NAVIGATION.some(group => group.items.some(([route]) => pathname === route || pathname.startsWith(route + '/')));
}
