export function attendanceReportDays({period,entries,workingHours=10,today,joiningDate}){
 if(!period.from||!period.to||period.from>period.to)return [];
 const rows=[],byDate=new Map(entries.map(d=>[d.date,d]));
 for(let date=joiningDate&&joiningDate>period.from?joiningDate:period.from;date<=period.to&&rows.length<3660;){
  const entry=byDate.get(date),expected=Number(entry?.settings?.workingHours??workingHours),worked=entry?Number(entry.workedHours||0):null;
  rows.push({date,checkIn:entry?.checkIn||'',checkOut:entry?.checkOut||'',paidHours:entry?.paidHours??(worked===null?null:Math.min(worked,expected)),workSummary:entry?.workSummary||'',status:entry?.status||(date>today?'Upcoming':'Not marked'),workedHours:worked,expectedHours:expected,lateHours:entry?Number(entry.lateHours||0):null,shortHours:worked===null?null:Math.max(0,Math.round((expected-worked)*100)/100),workDay:worked===null?'Not recorded':entry.status==='Absent'?'Absent':worked>=expected?'Full day':'Partial day',note:entry?.note||''});
  const next=new Date(date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);date=next.toISOString().slice(0,10);
 }
 return rows;
}
