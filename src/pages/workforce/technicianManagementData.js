import {activeRepair} from '../../utils/jobAssignment';
import {serviceMode} from '../../utils/repairService';
import { businessDate } from '../../utils/workshopOverview';
import { orderState } from './model';
export const TECH_STATES = ['Available', 'In Shop (Working)', 'On Visit (Home)', 'Busy', 'Off'];
export const techColors = {
  'Available': '#10B981',
  'In Shop (Working)': '#3B82F6',
  'On Visit (Home)': '#F59E0B', 'Busy':'#EF4444',
  'Off': '#EF4444'
};
export function realPoint(value) {
  if (!value || value.lat === null || value.lng === null || value.lat === '' || value.lng === '') return null;
  const lat = Number(value.lat),
    lng = Number(value.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180 ? {
    lat,
    lng
  } : null;
}
export const timestamp = value => {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};
export function duration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  return mins >= 60 ? Math.floor(mins / 60) + 'h ' + mins % 60 + 'm' : mins + 'm';
}
export function clock(value) {
  const ms = timestamp(value);
  return ms === null ? '—' : new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(ms);
}
export const amount = value => Math.max(0, Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0);
export function technicianSummary(members, orders, shopId, now = Date.now()) {
  orders=orders.filter(o=>!o.archivedAt);
  const today = businessDate(now);
  const team = members.filter(m => m.shopId === shopId && m.role === 'technician' && m.status !== 'REMOVED' && !m.legacy && !m.isDemo && !m.demo);
  const rows = team.map(member => {
    const jobs = orders.filter(o => o.shopId === shopId && o.assignedTechId === member.id && !o.isDemo);
    const current = jobs.find(activeRepair) || null;
    const location = member.telemetry?.location || member.location;
    const point = realPoint(location),
      reportedAt = location?.reportedAt || member.telemetry?.reportedAt;
    const lastPing = timestamp(member.lastSeenAt || reportedAt);
    const offline = lastPing !== null && now - lastPing > 30 * 60000;
    const state = member.status !== 'ACTIVE' || member.availability === 'Off' ? 'Off' : jobs.filter(activeRepair).length>1?'Busy':current?serviceMode(current)==='home'?'On Visit (Home)':'In Shop (Working)':'Available';
    const started = timestamp(current?.startedAt),
      expected = timestamp(current?.expectedEndAt) ?? (started !== null && Number(current?.expectedMinutes) > 0 ? started + Number(current.expectedMinutes) * 60000 : null);
    const todays = jobs.filter(o => businessDate(o.scheduledDate || o.bookingDate) === today || businessDate(o.completedAt) === today);
    const done = todays.filter(o => ['COMPLETED', 'PAID'].includes(orderState(o))).length;
    const cash = jobs.filter(o => o.cashConfirmed && businessDate(o.cashConfirmedAt) === today).reduce((n, o) => n + amount(o.cashAmount), 0);
    return {
      member,
      jobs,
      current,
      state,
      point: point && timestamp(reportedAt) !== null ? point : null,
      reportedAt,
      lastPing,
      offline,
      started,
      expected,
      delayed: Boolean(current) && expected !== null && now > expected,
      todays,
      done,
      cash
    };
  });
  const rank = {
    'Available': 0,
    'On Visit (Home)': 1,
    'In Shop (Working)':2, 'Busy':3,
    'Off': 4
  };
  rows.sort((a, b) => rank[a.state] - rank[b.state] || a.member.name.localeCompare(b.member.name));
  const jobs = orders.filter(o => team.some(m => m.id === o.assignedTechId) && o.shopId === shopId && (businessDate(o.scheduledDate || o.bookingDate) === today || businessDate(o.completedAt) === today));
  return {
    rows,
    counts: Object.fromEntries(TECH_STATES.map(state => [state, rows.filter(r => r.state === state).length])),
    total: jobs.length,
    done: jobs.filter(o => ['COMPLETED', 'PAID'].includes(orderState(o))).length,
    progress: jobs.filter(o => orderState(o) === 'IN_PROGRESS').length,
    pending: jobs.filter(o => ['NEW', 'EN_ROUTE'].includes(orderState(o))).length,
    cash: rows.reduce((n, r) => n + r.cash, 0)
  };
}
export function assignmentErrors(form) {
  const e = {};
  if (!(form.service || '').trim()) e.service = 'Enter the repair service.';
  if (!/^[\p{L} ]{2,80}$/u.test((form.customer || '').trim())) e.customer = 'Enter a valid customer name.';
  if (!/^[6-9]\d{9}$/.test(form.phone || '')) e.phone = 'Enter a valid 10-digit phone number.';
  if ((form.address || '').trim().length < 5) e.address = 'Enter a complete customer address.';
  if (!/^\d+(\.\d{1,2})?$/.test(form.amount || '') || Number(form.amount) <= 0) e.amount = 'Enter a positive amount.';
  if (![30, 60, 120, 180, 240].includes(Number(form.expectedMinutes))) e.expectedMinutes = 'Choose an expected duration.';
  if (!['Cash', 'Digital'].includes(form.payment)) e.payment = 'Choose a payment method.';
  return e;
}
