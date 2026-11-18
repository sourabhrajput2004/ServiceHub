// One-time fresh-flow reset. Shop catalogue, prices, inventory and preferences stay intact.
export const RESET_KEY='servicehub_fresh_flow_reset_20261111';
export function resetDemoActivity(storage){
 if(storage.getItem(RESET_KEY)==='done')return;
 for(const key of ['servicehub_bookings','servicehub_invoices','servicehub_technicians','servicehub_support','servicehub_db_platform_support','servicehub_shop_reviews_v1'])storage.setItem(key,'[]');
 storage.setItem('servicehub_workforce_v1',JSON.stringify({members:[],events:[]}));
 storage.removeItem('servicehub_technician_attendance_v1');
 let accounts={};try{accounts=JSON.parse(storage.getItem('servicehub_accounts')||'{}')||{};}catch{}
 storage.setItem('servicehub_accounts',JSON.stringify(Object.fromEntries(Object.entries(accounts).filter(([,account])=>['shop_owner','admin'].includes(account?.role)))));
 try{const user=JSON.parse(storage.getItem('servicehub_user')||'null');if(user&&!['shop_owner','admin'].includes(user.role))storage.removeItem('servicehub_user');}catch{storage.removeItem('servicehub_user');}
 // Per-member notification cursors refer to the removed jobs.
 for(let n=storage.length-1;n>=0;n--){const key=storage.key(n);if(key?.startsWith('wf-seen-'))storage.removeItem(key);}
 storage.setItem(RESET_KEY,'done');
}
