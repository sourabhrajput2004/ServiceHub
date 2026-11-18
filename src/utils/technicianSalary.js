import {businessDate} from './workshopOverview.js';
import {attendanceSettings,settingsErrors} from './technicianAttendance.js';
export const payrollKey=(shopId,memberId,month)=>shopId+':'+month+':'+memberId;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function validSalaryMonth(month){return /^\d{4}-(0[1-9]|1[0-2])$/.test(month||'');}
export function salaryMonthEnd(month){if(!validSalaryMonth(month))return '';const [y,m]=month.split('-').map(Number);return month+'-'+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0');}
export function monthlySalary(store,member,month,now=new Date()){
 const config=store.settings?.[member.shopId+':'+member.id]||attendanceSettings(member),record=store.payroll?.[payrollKey(member.shopId,member.id,month)];
 if(record?.snapshot&&['FINALIZED','PAID'].includes(record.status))return {...record.snapshot,status:record.status,record};
 const today=businessDate(now),joiningDate=businessDate(member.joiningDate||member.joinedAt)||'';
 const days=Object.values(store.entries||{}).filter(e=>e.shopId===member.shopId&&e.memberId===member.id&&e.date?.startsWith(month+'-')&&e.date<=today&&(!joiningDate||e.date>=joiningDate)&&['Present','Late','Absent'].includes(e.status)).sort((a,b)=>a.date.localeCompare(b.date));
 const hours=round(days.reduce((n,d)=>n+Number(d.workedHours||0),0)),lateHours=round(days.reduce((n,d)=>n+(d.status==='Late'?Number(d.lateHours||0):0),0)),valid=!Object.keys(settingsErrors(config)).length;
 const settingsFor=d=>({...config,...d.settings}),rateFor=d=>{const c=settingsFor(d);return Number(c.salary)/(Number(c.workingDays)*Number(c.workingHours));};
 const rates=[...new Set(days.map(rateFor))];
 const earned=round(days.reduce((n,d)=>n+(d.attendanceMode==='clock'&&Number.isFinite(d.paidMinutes)?d.paidMinutes/60:Math.min(Number(d.workedHours||0),Number(settingsFor(d).workingHours)))*rateFor(d),0));
 const absenceDeduction=round(days.filter(d=>d.status==='Absent').reduce((n,d)=>n+Number(settingsFor(d).workingHours)*rateFor(d),0));
 const lateDeduction=round(days.filter(d=>d.status!=='Absent').reduce((n,d)=>n+(d.attendanceMode==='clock'?(Number.isFinite(d.shortMinutes)?d.shortMinutes/60:Math.max(0,Number(settingsFor(d).workingHours)-Number(d.workedHours||0))):d.status==='Late'?Math.max(0,Math.min(Number(d.lateHours||0),Number(settingsFor(d).workingHours))):0)*rateFor(d),0));
 const adjustments=record?.adjustments||[],bonus=round(adjustments.filter(a=>a.type==='Bonus').reduce((n,a)=>n+a.amount,0)),penalty=round(adjustments.filter(a=>a.type==='Penalty').reduce((n,a)=>n+a.amount,0));
 return {month,memberName:member.name,memberId:member.id,workingDays:Number(config.workingDays),hoursPerDay:Number(config.workingHours),possibleHours:valid?Number(config.workingDays)*Number(config.workingHours):0,expected:valid?Number(config.salary):0,hourRate:rates.length===1?rates[0]:valid?Number(config.salary)/(Number(config.workingDays)*Number(config.workingHours)):0,mixedRates:rates.length>1,hours,lateHours,earned,bonus,penalty,net:round(earned+bonus-penalty),absenceDeduction,lateDeduction,deduction:valid?round(absenceDeduction+lateDeduction):0,present:days.filter(d=>d.status==='Present').length,late:days.filter(d=>d.status==='Late').length,absent:days.filter(d=>d.status==='Absent').length,days,adjustments,valid:valid&&Number.isFinite(earned),status:'DRAFT',record};
}
export function salaryAction({store,members,user,memberId,month,action,input={},now=new Date()}){
 const shopId=user?.shopId||user?.id,member=members.find(m=>m.id===memberId&&m.shopId===shopId&&m.role==='technician'&&!m.legacy);
 if(user?.role!=='shop_owner'||!member)return {success:false,error:'Only the shop owner can manage this salary.'};
 if(!validSalaryMonth(month)||month>businessDate(now).slice(0,7))return {success:false,error:'Choose a valid current or previous month.'};
 const key=payrollKey(shopId,memberId,month),old=store.payroll?.[key],summary=monthlySalary(store,member,month,now),at=now.toISOString(),audit={action,at,by:user.id,byName:user.name};let next;
 if(old?.status==='PAID')return {success:false,error:'Paid salary is a permanent record.'};
 if(action==='adjust'){
  if(old?.status==='FINALIZED')return {success:false,error:'Finalized salary cannot be adjusted.'};
  const amount=Number(input.amount),reason=String(input.reason||'').trim();
  if(!['Bonus','Penalty'].includes(input.type)||input.amount===''||!Number.isFinite(amount)||amount<=0||amount>1e9||!/^\d+(?:\.\d{1,2})?$/.test(String(input.amount)))return {success:false,error:'Enter a positive adjustment amount with up to 2 decimals.'};
  if(reason.length<5||reason.length>500)return {success:false,error:'Enter an adjustment reason (5–500 characters).'};
  if(input.type==='Penalty'&&amount>summary.net)return {success:false,error:'Penalty cannot make net salary negative.'};
  next={...old,shopId,memberId,month,status:'DRAFT',adjustments:[...(old?.adjustments||[]),{id:crypto.randomUUID(),type:input.type,amount,reason,at,by:user.id,byName:user.name}],audit:[...(old?.audit||[]),{...audit,type:input.type,amount,reason}]};
 }else if(action==='finalize'){
  if(old?.status==='FINALIZED')return {success:false,error:'This salary is already finalized.'};
  if(businessDate(now)<salaryMonthEnd(month))return {success:false,error:'Finalize is available from the last day of the month.'};
  if(!summary.valid||!summary.days.length||summary.net<0)return {success:false,error:'Add valid salary settings and attendance before finalizing.'};
  const {record,...snapshot}=summary;
  next={...old,shopId,memberId,month,status:'FINALIZED',snapshot,finalizedAt:at,finalizedBy:user.id,finalizedByName:user.name,audit:[...(old?.audit||[]),audit]};
 }else if(action==='paid'){
  if(old?.status!=='FINALIZED')return {success:false,error:'Finalize salary before marking it paid.'};
  if(!['Cash','UPI','Bank Transfer'].includes(input.method))return {success:false,error:'Choose a payment method.'};
  if(String(input.reference||'').length>120)return {success:false,error:'Payment reference must be under 120 characters.'};
  next={...old,status:'PAID',paidAt:at,paidBy:user.id,paidByName:user.name,paymentMethod:input.method,paymentReference:String(input.reference||'').trim(),audit:[...(old.audit||[]),{...audit,method:input.method,reference:String(input.reference||'').trim()}]};
 }else return {success:false,error:'Unknown salary action.'};
 return {success:true,store:{...store,payroll:{...store.payroll,[key]:next}}};
}
export function technicianWorkedHours(store,user,member,month){if(user?.role!=='technician'||member?.role!=='technician'||member?.id!==user.id||member?.shopId!==user.shopId||member?.status!=='ACTIVE')return null;return round(Object.values(store.entries||{}).filter(e=>e.shopId===member.shopId&&e.memberId===member.id&&e.date?.startsWith(month+'-')).reduce((n,e)=>n+Number(e.workedHours||0),0));}
