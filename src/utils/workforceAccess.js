export const STAFF_DUTIES=['Counter & Billing','Inventory Management','Helper','Delivery'];
export function staffDuty(member){
 if(member?.role!=='staff')return null;
 if(STAFF_DUTIES.includes(member.staffDuty))return member.staffDuty;
 const skills=String(member?.skills||'').toLowerCase();
 if(/helper|apprentice|\bother\b/.test(skills))return 'Helper';
 if(/inventory/.test(skills))return 'Inventory Management';
 if(/counter|billing/.test(skills))return 'Counter & Billing';
 if(/delivery|pickup/.test(skills))return 'Delivery';
 return null;
}
export function workerScreens(member){
 if(member?.role==='technician')return ['dashboard','jobs','support','profile','settings'];
 const duty=staffDuty(member);return duty==='Counter & Billing'?['orders','billing']:duty==='Inventory Management'?['inventory']:[];
}
export function workerHome(member){const screens=workerScreens(member);return screens.length?'/'+member.role+'/'+screens[0]:'/member-login';}
export function workerLabel(member){return member?.role==='technician'?'Technician':staffDuty(member)||'Staff';}
