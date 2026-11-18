import {distinctPhoneErrors} from '../../utils/contactFields.js';
import { QUALIFICATIONS, EXPERIENCE_OPTIONS } from './memberEducation.js';
import { INDIAN_STATES } from '../../utils/sellerVerification.js';
import { translate } from '../../i18n/translate.js';
import { memberErrors } from './model.js';
import { businessDate } from '../../utils/workshopOverview.js';
const clean = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
const person = value => {
  const name = clean(value);
  return name.length >= 2 && name.length <= 80 && /^[\p{L}\p{M} ]+$/u.test(name) && [...name.matchAll(/\p{L}/gu)].length >= 2;
};
const phone = value => /^[6-9]\d{9}$/.test(value) && !/^(\d)\1{9}$/.test(value);
const address = (value, min, max) => {
  const text = clean(value);
  return text.length >= min && text.length <= max && /[\p{L}\p{N}]/u.test(text) && !/[<>\x00-\x1f\x7f]/.test(value);
};
const place = value => {
  const text = clean(value);
  return text.length >= 2 && text.length <= 80 && /^[\p{L}\p{M}\s.&()'-]+$/u.test(text) && /[\p{L}]/u.test(text);
};
export function validMemberEmail(value) {
  const email = clean(value);
  if (email.length > 254 || email.includes(' ')) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && /^[A-Za-z]{2,63}$/.test(labels.at(-1)) && labels.every(label => label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
}
const stateKey = value => clean(value).toLowerCase().replace(/[.\s]/g, '');
const states = new Map(INDIAN_STATES.flatMap(state => [[stateKey(state), state], [stateKey(translate(state, 'hi')), state]]));
const stateAliases = {
  up: 'Uttar Pradesh',
  uk: 'Uttarakhand',
  dl: 'Delhi',
  nctofdelhi: 'Delhi',
  uttaranchal: 'Uttarakhand',
  orissa: 'Odisha',
  pondicherry: 'Puducherry'
};
export function memberState(value) {
  return states.get(stateKey(value)) || stateAliases[stateKey(value)] || null;
}
export function normalizeMemberDetails(form) {
  const next = {
    ...form
  };
  for (const key of ['name', 'phone', 'email', 'alternatePhone', 'guardianName', 'guardianPhone', 'emergencyName', 'emergencyPhone', 'house', 'street', 'locality', 'city', 'state', 'pincode', 'experience', 'skills', 'aadhaarNumber', 'panNumber']) if (typeof next[key] === 'string') next[key] = clean(next[key]);
  next.salary = form.salary === '' || form.salary == null ? '' : Number(form.salary);
  next.state = memberState(next.state) || next.state;
  next.email = (next.email || '').toLowerCase();
  next.panNumber = (next.panNumber || '').toUpperCase();
  return next;
}
export function memberDetailsErrors(input, now = new Date()) {
  const form = normalizeMemberDetails(input),
    errors = memberErrors(form),
    today = businessDate(now);
  if (person(form.name)) delete errors.name;else errors.name = 'Enter a name with 2–80 letters and spaces.';
  if (!phone(form.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (!validMemberEmail(form.email || '')) errors.email = 'Enter a valid email address.';
  for (const key of ['alternatePhone', 'guardianPhone', 'emergencyPhone']) if (form[key] && !phone(form[key])) errors[key] = 'Enter a valid 10-digit Indian mobile number.';
  if (form.alternatePhone && form.alternatePhone === form.phone) errors.alternatePhone = 'Alternate phone must differ from the main phone.';
  if (!phone(form.guardianPhone)) errors.guardianPhone = 'Enter a valid parent or guardian phone number.';
  if (form.guardianPhone === form.phone) errors.guardianPhone = 'Parent phone must differ from the member phone.';
  if (form.emergencyPhone && form.emergencyPhone === form.phone) errors.emergencyPhone = 'Use another person’s phone for emergencies.';
  for (const key of ['guardianName', 'emergencyName']) if (!person(form[key] || '')) errors[key] = 'Enter a name with 2–80 letters and spaces.';
  const dob = typeof form.dateOfBirth === 'string' ? form.dateOfBirth : '';
  let age = null;
  if (!dob) errors.dateOfBirth = 'Date of birth is required.';
  if (dob) {
    const earliest = String(Number(today.slice(0, 4)) - 120) + today.slice(4);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !businessDate(dob) || dob >= today || dob < earliest) errors.dateOfBirth = 'Enter a realistic date of birth in the past.';else {
      age = Number(today.slice(0, 4)) - Number(dob.slice(0, 4)) - (today.slice(5) < dob.slice(5) ? 1 : 0);
    }
  }
  if (!['Male', 'Female', 'Other', 'Prefer not to say'].includes(form.gender)) errors.gender = 'Choose a valid gender option.';
  if (!address(input.house || '', 1, 80)) errors.house = 'Enter a valid house or building number (up to 80 characters).';
  if (!address(input.street || '', 2, 120)) errors.street = 'Enter a valid street or road (2–120 characters).';
  if (!address(input.locality || '', 2, 100)) errors.locality = 'Enter a valid locality (2–100 characters).';
  if (!place(form.city)) errors.city = 'Enter a valid city name using letters.';
  if (!memberState(form.state)) errors.state = 'Choose a valid Indian state or union territory.';
  if (!/^[1-9]\d{5}$/.test(form.pincode || '')) errors.pincode = 'Enter a valid 6-digit pincode.';
  if (typeof form.joiningDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(form.joiningDate) || !businessDate(form.joiningDate)) errors.joiningDate = 'Choose a valid joining date.';else if (dob && !errors.dateOfBirth && form.joiningDate < dob) errors.joiningDate = 'Joining date cannot be before the date of birth.';
  if (form.salary !== '' && (!Number.isFinite(form.salary) || form.salary < 0 || form.salary > 1000000000 || !/^\d+(?:\.\d{1,2})?$/.test(String(input.salary).trim()))) errors.salary = 'Enter a valid monthly salary (zero or more, up to 2 decimal places).';
  if (!['Full-time', 'Part-time', 'Contract'].includes(form.employmentType)) errors.employmentType = 'Choose a valid employment type.';
  if (!EXPERIENCE_OPTIONS.some(([value]) => value === form.experience)) errors.experience = 'Choose your work experience.';else if (age !== null && Number.parseInt(form.experience, 10) > age) errors.experience = 'Experience cannot exceed the member’s age.';
  if (!Array.isArray(form.qualifications) || !form.qualifications.length || form.qualifications.some(value => !QUALIFICATIONS.some(q => q.value === value))) errors.qualifications = 'Select at least one qualification.';
  if (form.emergencyPhone && !form.emergencyName) errors.emergencyName = 'Enter the emergency contact name.';
  if (form.emergencyName && !form.emergencyPhone) errors.emergencyPhone = 'Enter the emergency contact phone.';
  if (!form.aadhaarNumber && !form.identity?.aadhaarLast4) errors.aadhaarNumber = 'Aadhaar number is required.';
  if (!form.panNumber && !form.identity?.panMasked) errors.panNumber = 'PAN number is required.';
  if (!phone(form.emergencyPhone)) errors.emergencyPhone = 'Enter a valid emergency contact phone number.';
  if (form.aadhaarNumber && !/^[2-9]\d{11}$/.test(form.aadhaarNumber)) errors.aadhaarNumber = 'Enter 12 Aadhaar digits starting with 2–9.';
  if (form.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.panNumber)) errors.panNumber = 'Enter a valid PAN, e.g. ABCDE1234F.';
  if (form.skills && !address(form.skills, 2, 2000)) errors.skills = 'Enter valid skills or responsibilities (2–200 characters).';
  Object.assign(errors,distinctPhoneErrors(form,['phone','alternatePhone','guardianPhone','emergencyPhone']));
  return errors;
}
export function safeMemberDetails(form) {
  const {
    aadhaarNumber,
    panNumber,
    ...details
  } = form;
  return {
    ...details,
    ...(aadhaarNumber || panNumber ? {
      identity: {
        ...details.identity,
        aadhaarLast4: aadhaarNumber?.slice(-4) || details.identity?.aadhaarLast4 || '',
        panMasked: panNumber ? panNumber.slice(0, 2) + '••••••' + panNumber.slice(-2) : details.identity?.panMasked || ''
      }
    } : {})
  };
}
