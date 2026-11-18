import {ATTENDANCE_KEY} from './technicianAttendance';
import {businessDate} from './workshopOverview';
export function readCheckInRecords(){try{return JSON.parse(localStorage.getItem(ATTENDANCE_KEY)||'{}')||{};}catch{return {};}}
export function technicianCheckIn(member,store=readCheckInRecords(),now=new Date()){
 if(!member||member.role!=='technician'||member.status!=='ACTIVE'||member.availability==='Off')return {allowed:false,reason:'Technician is unavailable.'};
 const date=businessDate(now),entry=store.entries?.[member.shopId+':'+date+':'+member.id];
 if(!entry||entry.memberId!==member.id||entry.shopId!==member.shopId||entry.date!==date||!entry.checkIn||entry.attendanceMode!=='clock'||!['Checked in','Present','Late'].includes(entry.status))return {allowed:false,reason:'Check-in required today before assigning a job.'};
 if(entry.checkOut)return {allowed:false,reason:'Technician has checked out today.'};
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.checkIn)||entry.checkIn>time)return {allowed:false,reason:'Technician check-in time has not been reached.'};
 return {allowed:true,reason:'Checked in'};
}
