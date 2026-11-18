import {businessDate} from './workshopOverview.js';
export const ATTENDANCE_KEY='servicehub_technician_attendance_v1';
export function sameAttendance(a,b){return Boolean(a&&b&&a.status===b.status&&Number(a.status==='Late'?a.lateHours||0:0)===Number(b.status==='Late'?b.lateHours||0:0)&&String(a.note||'').trim()===String(b.note||'').trim()&&String(a.checkIn||'')===String(b.checkIn||'')&&String(a.checkOut||'')===String(b.checkOut||'')&&Boolean(a.checkoutNextDay)===Boolean(b.checkoutNextDay));}
export const attendanceSettings=member=>({salary:member?.salary??'',workingDays:26,workingHours:10,shiftStart:'09:00'});
const timeMinutes=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value||'')?Number(value.slice(0,2))*60+Number(value.slice(3)):null;
const rounded=value=>Math.round(value*100)/100;
export function clockAttendance(settings,row){
 const expected=10,dayRate=Number(settings.salary)/Number(settings.workingDays),hourRate=dayRate/expected;
 if(row.status==='Absent')return {status:'Absent',checkIn:'',checkOut:'',checkoutNextDay:false,workedHours:0,paidHours:0,shortHours:expected,lateHours:0,earnedAmount:0,dayRate,hourRate,workSummary:'Absent'};
 const start=timeMinutes(row.checkIn),end=timeMinutes(row.checkOut),shift=540;
 if(start===null)return {error:'Enter a valid check-in time.'};
 const lateMinutes=Math.max(0,start-(shift??start)),lateHours=rounded(lateMinutes/60);
 if(!row.checkOut)return {status:'Checked in',checkIn:row.checkIn,checkOut:'',checkoutNextDay:false,workedHours:0,paidHours:0,shortHours:0,lateHours,earnedAmount:0,dayRate,hourRate,workSummary:'Checked in - awaiting checkout. Salary will be added after checkout.'};
 if(end===null)return {error:'Enter a valid checkout time.'};
 const duration=end+(row.checkoutNextDay?1440:0)-start;
 if(duration<=0||duration>1440)return {error:'Checkout must be after check-in and within 24 hours. Select next day for overnight work.'};
 const paidMinutes=Math.max(0,Math.min(end+(row.checkoutNextDay?1440:0),shift+expected*60)-Math.max(start,shift)),shortMinutes=expected*60-paidMinutes,earlyMinutes=Math.max(0,(shift??start)+expected*60-(end+(row.checkoutNextDay?1440:0)));
 return {status:lateMinutes?'Late':'Present',checkIn:row.checkIn,checkOut:row.checkOut,checkoutNextDay:Boolean(row.checkoutNextDay),workedMinutes:duration,paidMinutes,shortMinutes,workedHours:rounded(duration/60),paidHours:rounded(paidMinutes/60),shortHours:rounded(shortMinutes/60),lateHours,earnedAmount:rounded(paidMinutes/60*hourRate),dayRate,hourRate,workSummary:[lateMinutes?'Late by '+lateMinutes+' minutes':null,earlyMinutes?'Checkout '+rounded(earlyMinutes/60)+' hours early':null,paidMinutes>=expected*60?expected+' hours completed':rounded(paidMinutes/60)+' paid hours completed; '+rounded(shortMinutes/60)+' hours short',duration>expected*60?'Daily salary capped at '+expected+' hours':null].filter(Boolean).join(' | ')};
}
export function settingsErrors(s){const e={};if(s.salary===''||s.salary==null||!Number.isFinite(Number(s.salary))||Number(s.salary)<0||Number(s.salary)>1e9)e.salary='Enter a valid monthly salary.';if(!Number.isInteger(Number(s.workingDays))||Number(s.workingDays)<1||Number(s.workingDays)>31)e.workingDays='Enter working days from 1 to 31.';if(!Number.isFinite(Number(s.workingHours))||Number(s.workingHours)<=0||Number(s.workingHours)>24)e.workingHours='Enter working hours above 0 and up to 24.';if(s.shiftStart!==undefined&&timeMinutes(s.shiftStart)===null)e.shiftStart='Enter a valid shift start time.';return e;}
export function attendanceAmounts(settings,status,lateHours=0){
 const dayRate=Number(settings.salary)/Number(settings.workingDays),hourRate=dayRate/Number(settings.workingHours),workedHours=status==='Present'?Number(settings.workingHours):status==='Late'?Number(settings.workingHours)-Number(lateHours):0;
 return {dayRate,hourRate,workedHours,earnedAmount:Math.round(workedHours*hourRate*100)/100};
}
export function attendanceDateError(date,now=new Date()){const today=businessDate(now);return !/^\d{4}-\d{2}-\d{2}$/.test(date)||businessDate(date)!==date||date>today?'Choose today or a previous valid attendance date.':'';}
export function saveAttendanceBatch({store,date,rows,members,user,now=new Date()}){
 const shopId=user?.shopId||user?.id,error=attendanceDateError(date,now);
 if(user?.role!=='shop_owner')return {success:false,error:'Only the shop owner can mark attendance.'};
 if(error)return {success:false,error};if(!rows.length)return {success:false,error:'Mark at least one technician.'};
 const errors={},changes=[],at=now.toISOString(),locked=date<businessDate(now),seen=new Set();
 for(let row of rows){const member=members.find(m=>m.id===row.memberId&&m.shopId===shopId&&m.role==='technician'&&m.status==='ACTIVE'&&!m.legacy),key=shopId+':'+date+':'+row.memberId,old=store.entries?.[key];
  if(!member||seen.has(key))return {success:false,error:'Technician is unavailable.'};seen.add(key);
  const joined=businessDate(member.joiningDate||member.joinedAt);if(joined&&date<joined)return {success:false,error:'Attendance cannot start before joining date.'};
  const timed=row.attendanceMode==='clock'||Boolean(row.checkIn||row.checkOut),baseConfig=old?.settings||store.settings?.[shopId+':'+member.id]||attendanceSettings(member),config=timed?{...baseConfig,workingHours:10,shiftStart:'09:00'}:baseConfig,clock=timed?clockAttendance(config,row):null;
  if(old?.attendanceMode==='clock'&&old.checkIn&&(row.checkIn!==old.checkIn||row.status==='Absent')){errors[member.id]={time:'Saved check-in time is locked.'};continue;}
  if(old?.attendanceMode==='clock'&&old.checkOut&&(row.checkOut!==old.checkOut||Boolean(row.checkoutNextDay)!==Boolean(old.checkoutNextDay))){errors[member.id]={time:'Saved checkout time is locked.'};continue;}
  if(timed&&row.checkOut&&!old?.checkIn){errors[member.id]={time:'Save check-in first, then record checkout.'};continue;}
  if(clock?.error){errors[member.id]={time:clock.error};continue;}
  if(clock)row={...row,...clock};
  if(sameAttendance(old,row)&&(old?.revision||0)===(row.revision||0))continue;
  if(['FINALIZED','PAID'].includes(store.payroll?.[shopId+':'+date.slice(0,7)+':'+member.id]?.status)){errors[member.id]={status:'Salary finalized. Attendance is locked.'};continue;}
  const e={},settings=config;
  if(Object.keys(settingsErrors(settings)).length)e.settings='Set salary and working hours first.';
  if(!['Present','Late','Absent',...(timed?['Checked in']:[])].includes(row.status))e.status='Choose Present, Late or Absent.';
  if(!timed&&row.status==='Late'&&(row.lateHours===''||!Number.isFinite(Number(row.lateHours))||Number(row.lateHours)<=0||Number(row.lateHours)>=Number(settings.workingHours)))e.lateHours='Late hours must be above 0 and below daily working hours.';
  if(String(row.note||'').length>500)e.note='Use up to 500 characters.';
  if(locked&&String(row.reason||'').trim().length<5)e.reason='Enter a reason (at least 5 characters) to change a locked date.';
  if((old?.revision||0)!==(row.revision||0))e.status='This entry changed in another tab. Reload the date before saving.';
  if(Object.keys(e).length){errors[member.id]=e;continue;}
  const value={status:row.status,lateHours:row.status==='Late'||row.status==='Checked in'?Number(row.lateHours):0,note:String(row.note||'').trim(),...(timed?{attendanceMode:'clock',checkIn:row.checkIn,checkOut:row.checkOut,checkoutNextDay:Boolean(row.checkoutNextDay)}:{})},audit={at,by:user.id,byName:user.name,reason:locked?row.reason.trim():'',before:old?{status:old.status,lateHours:old.lateHours,note:old.note,checkIn:old.checkIn,checkOut:old.checkOut,checkoutNextDay:old.checkoutNextDay}:null,after:value};
  changes.push([key,{...old,...value,shopId,date,memberId:member.id,settings:{salary:Number(settings.salary),workingDays:Number(settings.workingDays),workingHours:Number(settings.workingHours),shiftStart:settings.shiftStart||'09:00'},...(clock||attendanceAmounts(settings,value.status,value.lateHours)),...(timed?{memberName:member.name,checkInSavedAt:old?.checkInSavedAt||(row.checkIn?at:null),checkOutSavedAt:old?.checkOutSavedAt||(row.checkOut?at:null)}:{}),revision:(old?.revision||0)+1,updatedAt:at,updatedBy:user.id,audit:[...(old?.audit||[]),audit]}]);
 }
 if(Object.keys(errors).length)return {success:false,errors,error:'Check the highlighted attendance fields.'};
 return {success:true,store:{...store,entries:{...store.entries,...Object.fromEntries(changes)}}};
}
