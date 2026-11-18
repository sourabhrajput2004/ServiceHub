import {useEffect,useState} from 'react';
import {ATTENDANCE_KEY} from '../utils/technicianAttendance';
export function readAttendanceRecords(){try{return JSON.parse(localStorage.getItem(ATTENDANCE_KEY)||'{}')||{};}catch{return {};}}
export default function useAttendanceRecords(){const [store,setStore]=useState(readAttendanceRecords);useEffect(()=>{const sync=e=>{if(!e||e.key===ATTENDANCE_KEY)setStore(readAttendanceRecords());},focus=()=>sync(),timer=setInterval(focus,15000);window.addEventListener('storage',sync);window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('storage',sync);window.removeEventListener('focus',focus);};},[]);return store;}
