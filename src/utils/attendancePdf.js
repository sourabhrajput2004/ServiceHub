// Image-backed PDF pages preserve names and notes in the browser's Unicode font.
export function jpegPagesPdf(pages){
 const chunks=[],offsets=[0];let length=0;
 const append=value=>{const bytes=typeof value==='string'?new TextEncoder().encode(value):value;chunks.push(bytes);length+=bytes.length;};
 const object=(id,body)=>{offsets[id]=length;append(id+' 0 obj\n');body();append('\nendobj\n');};
 append('%PDF-1.4\n');
 object(1,()=>append('<< /Type /Catalog /Pages 2 0 R >>'));
 object(2,()=>append('<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>'));
 pages.forEach((page,i)=>{const id=3+i*3,content='q 595 0 0 842 0 0 cm /Image Do Q';
  object(id,()=>append('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Image '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>'));
  object(id+1,()=>{append('<< /Type /XObject /Subtype /Image /Width '+page.width+' /Height '+page.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+page.bytes.length+' >>\nstream\n');append(page.bytes);append('\nendstream');});
  object(id+2,()=>append('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream'));
 });
 const xref=length;append('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)append(String(offsets[i]).padStart(10,'0')+' 00000 n \n');append('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 const result=new Uint8Array(length);let at=0;for(const chunk of chunks){result.set(chunk,at);at+=chunk.length;}return result;
}
export function previewAttendancePdf({member,period,days,completed,reportDays=days}){
 const pages=[];let canvas,ctx,y,pageNumber=0;
 const finish=()=>{ctx.fillStyle='#64748b';ctx.font='20px sans-serif';ctx.fillText('ServiceHub | Page '+pageNumber,70,1620);const raw=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);pages.push({width:1190,height:1684,bytes:Uint8Array.from(raw,c=>c.charCodeAt(0))});};
 const start=()=>{canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;ctx=canvas.getContext('2d');if(!ctx)throw Error('PDF export is unavailable.');pageNumber++;ctx.fillStyle='#fff';ctx.fillRect(0,0,1190,1684);ctx.fillStyle='#1e40af';ctx.font='bold 36px sans-serif';ctx.fillText('ServiceHub | Attendance report',70,90);ctx.fillStyle='#18334e';ctx.font='24px sans-serif';ctx.fillText(member.name,70,140);ctx.fillText(period.from+' to '+period.to,70,180);ctx.strokeStyle='#cbd5e1';ctx.beginPath();ctx.moveTo(70,205);ctx.lineTo(1120,205);ctx.stroke();y=250;};
 const line=(text,bold=false)=>{ctx.font=(bold?'bold ':'')+'23px sans-serif';let row='';const draw=()=>{if(y>1550){finish();start();ctx.font=(bold?'bold ':'')+'23px sans-serif';}ctx.fillStyle='#18334e';ctx.fillText(row,70,y);y+=35;};for(const word of String(text).split(/\s+/)){const trial=row?row+' '+word:word;if(ctx.measureText(trial).width>1040&&row){draw();row=word;}else row=trial;}if(row)draw();};
 start();line('Hours worked: '+days.reduce((n,d)=>n+Number(d.workedHours||0),0)+' | Present: '+days.filter(d=>d.status==='Present').length+' | Late: '+days.filter(d=>d.status==='Late').length+' | Absent: '+days.filter(d=>d.status==='Absent').length,true);y+=15;line('Attendance records',true);
 if(!days.length)line('No saved attendance for this period.');
 for(const d of [...reportDays].sort((a,b)=>a.date.localeCompare(b.date))){line(d.date+' | '+d.status+' | Expected: '+(d.expectedHours??d.settings?.workingHours??10)+' hours | Worked: '+(d.workedHours??'Not recorded')+' | '+(d.workDay||''),true);if(d.checkIn)line('Check in: '+d.checkIn+' | Checkout: '+(d.checkOut||'Pending'));if(d.workSummary)line(d.workSummary);if(d.note)line('Note: '+d.note);y+=15;}
 y+=15;line('Completed jobs: '+completed.length,true);for(const j of completed)line(j.id+' | '+(j.deviceBrand||'')+' | '+(j.issueType||''));finish();
 const blob=new Blob([jpegPagesPdf(pages)],{type:'application/pdf'}),url=URL.createObjectURL(blob);
 const preview=window.open(url,'_blank');
 if(!preview){URL.revokeObjectURL(url);throw Error('Allow pop-ups to preview attendance.');}
 preview.opener=null;
 setTimeout(()=>URL.revokeObjectURL(url),600000);
}
