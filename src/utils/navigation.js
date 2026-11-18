import {workerHome} from './workforceAccess';
﻿export function dashboardPath(user) {return ['technician','staff'].includes(user?.role)?workerHome(user):user?.role==='shop_owner'?'/shop/dashboard':user?.role==='admin'?'/super-admin-portal/dashboard':'/customer-dashboard';}
export function supportPath() {return '/support';}
export function mainNavigation(user) {
 if(!user)return [['/','Home'],['/about','About'],['/contact','Contact'],['/find-shop','Find Shops']];
 if(user.role==='customer')return [];
 if(user.role==='shop_owner')return [];
 return [[dashboardPath(user),'Dashboard'],['/support','Support'],['/settings','Settings']];
}
export function accountNavigation(user) {
 if(!user)return [['/my-repairs','My repairs'],['/register-shop','List your shop'],['/login','Sign in'],['/register','Create an account']];
 return [[dashboardPath(user),'Dashboard'],[user.role==='customer'?'/my-repairs':user.role==='shop_owner'?'/my-shop':'/profile',user.role==='customer'?'My repairs':user.role==='shop_owner'?'My Shop':'Profile'],[user.role==='shop_owner'?'/shop/profile':'/profile','Profile'],['/settings','Settings'],['/support','Support']].filter(([path],index,array)=>array.findIndex(([other])=>other===path)===index);
}
export function navigationActive(target,pathname,hash='') {const [path,anchor]=target.split('#');return pathname===path&&(anchor?hash==='#'+anchor:!hash);}
