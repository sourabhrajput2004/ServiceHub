import {printInvoice} from '../../utils/invoiceDocument';
import {invoiceState} from '../../utils/invoiceLifecycle';
import {workerScreens} from '../../utils/workforceAccess';
export const memberKey = 'servicehub_workforce_v1';
export const scoped = (row, shopId) => (row.shopId || 'shop_1') === shopId;
export function orderState(order) {
  if (['Disputed', 'DISPUTED'].includes(order.status)) return 'DISPUTED';
  if (['Cancelled', 'CANCELLED', 'Rejected', 'Unpaid - Closed'].includes(order.status)) return 'REJECTED';
  if(order.status==='EN_ROUTE')return 'EN_ROUTE';
  if (['IN_PROGRESS','Diagnosing Issue','Waiting for Parts','Repaired & QC Tested'].includes(order.status))return 'IN_PROGRESS';
  if (['NEW','Request Received','Request Booked','Device Received at Shop','Booked'].includes(order.status))return 'NEW';
  if (order.status === 'PAID') return 'PAID';
  if (['COMPLETED', 'Completed', 'Ready for Pickup', 'Delivered'].includes(order.status)) return 'COMPLETED';
  if (['IN_PROGRESS', 'Diagnosing Issue', 'Waiting for Parts', 'Repaired & QC Tested'].includes(order.status)) return 'IN_PROGRESS';
  return 'NEW';
}
export function memberErrors(form) {
  const e = {};
  if (!/^[\p{L} ]{2,80}$/u.test((form.name || '').trim())) e.name = 'Enter a valid name using letters and spaces.';
  if (!/^[6-9]\d{9}$/.test(form.phone || '')) e.phone = 'Enter a valid 10-digit Indian phone number.';
  if (!['technician', 'staff'].includes(form.role)) e.role = 'Choose a role.';
  if (!(form.skills || '').trim()) e.skills = 'Enter skills or responsibilities.';
  return e;
}
export function canAccess(member, user) {
  return Boolean(member && member.status === 'ACTIVE' && member.id === user?.id && member.shopId === user?.shopId && member.role === user?.role && workerScreens(member).length>0);
}
export const money = v => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(String(v ?? 0).replace(/[^\d.]/g, '')) || 0);
export const downloadInvoice=printInvoice;
