export const isPdfDocument = document => document?.type === 'application/pdf' || document?.dataUrl?.startsWith('data:application/pdf');
