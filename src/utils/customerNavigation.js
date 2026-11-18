export const CUSTOMER_NAVIGATION=[
 {label:'WORKSPACE',items:[['/customer-dashboard','Dashboard','dashboard'],['/my-repairs','My Repairs','services'],['/find-shop','Find Shops','search'],['/support','Support','support']]},
 {label:'ACCOUNT',items:[['/profile','Profile','profile'],['/settings','Settings','settings']]}
];
export function usesCustomerSidebar(user, pathname) {
 if (user?.role !== 'customer') return false;
 return CUSTOMER_NAVIGATION.some(group => group.items.some(([route]) => pathname === route || pathname.startsWith(route + '/')));
}
