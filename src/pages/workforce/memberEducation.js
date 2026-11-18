export const QUALIFICATIONS = [{
  value: '10th',
  label: '10th',
  documents: ['education_10th']
}, {
  value: '12th',
  label: '12th',
  documents: ['education_10th', 'education_12th']
}, {
  value: 'diploma',
  label: 'Diploma',
  documents: ['education_10th', 'education_12th', 'education_diploma']
}, {
  value: 'graduation',
  label: 'Graduation',
  documents: ['education_10th', 'education_12th', 'education_graduation']
}, {
  value: 'postgraduation',
  label: 'Postgraduation',
  documents: ['education_10th', 'education_12th', 'education_graduation', 'education_postgraduation']
}];
export const EDUCATION_DOCUMENTS = [['education_10th', '10th certificate'], ['education_12th', '12th certificate'], ['education_diploma', 'Diploma certificate'], ['education_graduation', 'Graduation certificate'], ['education_postgraduation', 'Postgraduation certificate']];
export const EXPERIENCE_OPTIONS = [['0', 'Fresher'], ['1', '1 year'], ['2', '2 years'], ['3', '3 years'], ['4', '4 years'], ['5+', '5+ years']];
export function educationRequirements(values) {
  const selected = new Set(Array.isArray(values) ? values : []),
    needed = new Set(QUALIFICATIONS.filter(q => selected.has(q.value)).flatMap(q => q.documents));
  return EDUCATION_DOCUMENTS.filter(([key]) => needed.has(key));
}
export function experienceLabel(value) {
  return EXPERIENCE_OPTIONS.find(([key]) => key === String(value))?.[1] || '—';
}
export function requiredMemberDocuments(form, documents = {}, saved = {}) {
  const issues = {};
  for (const [kind, label] of [['aadhaar', 'Aadhaar card'], ['pan', 'PAN card'], ...educationRequirements(form.qualifications)]) {
    const present = Object.hasOwn(documents, kind) ? Boolean(documents[kind]?.dataUrl) : Boolean(saved[kind]?.id);
    if (!present) issues[kind + 'Image'] = 'Upload ' + label + '.';
  }
  return issues;
}
