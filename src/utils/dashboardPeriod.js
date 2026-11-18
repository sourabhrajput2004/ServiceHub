import {businessDate} from './workshopOverview.js';
export function dashboardRange(period,custom={},now=new Date()){
 const today=businessDate(now),shift=n=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 let selectedWeek=null,selectedMonth=null,selectedYear=null;
 if(period==='yearly'){const year=String(custom.year??today.slice(0,4));selectedYear=/^\d{4}$/.test(year)&&Number(year)>=1900&&year<=today.slice(0,4)?{from:year+'-01-01',to:year===today.slice(0,4)?today:year+'-12-31'}:{from:'',to:''};}
 if(period==='weekly'){const anchor=custom.weekDate===undefined?today:custom.weekDate;if(/^\d{4}-\d{2}-\d{2}$/.test(anchor)&&businessDate(anchor)===anchor&&anchor<=today){const d=new Date(anchor+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const from=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);selectedWeek={from,to:[d.toISOString().slice(0,10),today].sort()[0]};}else selectedWeek={from:'',to:''};}
 if(period==='monthly'){const m=custom.month===undefined?today.slice(0,7):custom.month;if(/^\d{4}-(0[1-9]|1[0-2])$/.test(m)&&m<=today.slice(0,7)){const [year,n]=m.split('-').map(Number),last=new Date(Date.UTC(year,n,0)).toISOString().slice(0,10);selectedMonth={from:m+'-01',to:[last,today].sort()[0]};}else selectedMonth={from:'',to:''};}
 const range=selectedWeek||selectedMonth||selectedYear||(period==='all'?{from:'',to:''}:period==='today'?{from:today,to:today}:period==='yesterday'?{from:shift(-1),to:shift(-1)}:period==='week'?{from:shift(-6),to:today}:period==='day'?{from:custom.from||'',to:custom.from||''}:period==='custom'?{from:custom.from||'',to:custom.to||''}:{from:today.slice(0,7)+'-01',to:today});
 const valid=period==='all'||Boolean(range.from&&range.to&&businessDate(range.from)===range.from&&businessDate(range.to)===range.to&&range.from<=range.to&&range.to<=today);
 return {...range,valid,today};
}
export function inDashboardRange(value,range){const day=businessDate(value);return range.valid&&(!range.from&&!range.to||Boolean(day))&&(!range.from||day>=range.from)&&(!range.to||day<=range.to);}
export const filterDashboardOrders=(rows,range)=>rows.filter(r=>!r.archivedAt&&inDashboardRange(r.createdAt||r.bookingDate,range));
export const filterDashboardInvoices=(rows,range)=>rows.filter(r=>inDashboardRange(r.date||r.createdAt,range));
export function dashboardCollections(invoices,range){
 let total=0;
 for(const invoice of invoices){if(invoice.paymentStatus==='Pending Approval')continue;const payments=(invoice.audit||[]).filter(a=>['PAYMENT_RECORDED','CASH_COLLECTED'].includes(a.action)&&Number(a.amount)>0),logged=payments.reduce((n,a)=>n+Number(a.amount),0);
  total+=payments.filter(p=>inDashboardRange(p.at,range)).reduce((n,p)=>n+Number(p.amount),0);
  const opening=Math.max(0,Number(invoice.paidAmount||0)-logged-Number(invoice.transferredPayment||0));
  if(inDashboardRange(invoice.createdAt||invoice.date,range))total+=opening;
 }
 return Math.round(total*100)/100;
}
