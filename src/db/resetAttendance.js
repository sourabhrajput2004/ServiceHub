// Explicitly requested one-time attendance reset; later records must survive refreshes.
export const ATTENDANCE_RESET_KEY='servicehub_attendance_reset_20261112_clock_v2';
export function resetAttendanceOnce(storage){
 if(storage.getItem(ATTENDANCE_RESET_KEY)==='done')return;
 const key='servicehub_technician_attendance_v1';
 const saved=storage.getItem(key);
 if(saved){const data=JSON.parse(saved);storage.setItem(key,JSON.stringify({...data,entries:{}}));}
 storage.setItem(ATTENDANCE_RESET_KEY,'done');
}
