export function proofStatus(shop, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) {
  const expires = shop.businessProofValidUntil;
  if (expires && /^\d{4}-\d{2}-\d{2}$/.test(expires) && expires < today) return { label: 'Document expired', tone: 'expired' };
  if (shop.verificationStatus === 'rejected') return {label:'Rejected',tone:'rejected'};
  if (shop.verificationStatus !== 'approved') return { label: 'Review pending', tone: 'pending' };
  if (!shop.businessProofType || !shop.businessProofNumber) return { label: 'View document details', tone: 'pending' };
  return { label: /license|licence/i.test(shop.businessProofType) ? 'License verified' : 'Business proof reviewed', tone: 'approved' };
}
export function isDemoProof(shop) {
  return shop.isDemo === true || shop.sellerVerificationPreview?.demo === true || ['UDYAM-UP-28-0045812', 'GZB-DL-2023-8991'].includes(shop.businessProofNumber);
}
