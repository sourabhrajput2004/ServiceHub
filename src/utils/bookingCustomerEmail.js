export function bookingCustomerEmail(job) {
  if (job.customerEmail) return job.customerEmail;
  if (!job.customerId) return '';
  try {
    const accounts = Object.values(JSON.parse(localStorage.getItem('servicehub_accounts') || '{}'));
    return accounts.find(account => account.role === 'customer' && account.id === job.customerId)?.email || '';
  } catch {
    return '';
  }
}
