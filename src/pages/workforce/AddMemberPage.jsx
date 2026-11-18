import {personNameInput} from '../../utils/contactFields';
import {STAFF_DUTIES,staffDuty} from '../../utils/workforceAccess';
import { QUALIFICATIONS, EXPERIENCE_OPTIONS, educationRequirements, requiredMemberDocuments } from './memberEducation';
import { INDIAN_STATES } from '../../utils/sellerVerification';
import MemberDocumentUpload from './MemberDocumentUpload';
import { readMemberDocument, saveMemberDocument } from './memberDocuments';
import { readMemberPhoto } from './memberPhoto';
import React, { useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {Check, UserRound, Wrench, ClipboardList, Upload, CheckCircle2} from 'lucide-react';
import { useWorkforce } from '../../context/WorkforceContext';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import { Field } from '../../components/workforce/WorkerShell';
import { memberDetailsErrors, normalizeMemberDetails } from './memberDetails';
import { businessDate } from '../../utils/workshopOverview';
const SKILL_GROUPS={
 'Mobile':['Screen Replacement','Screen Repair','Battery Replacement','Charging Port Repair','Charging Port Replacement','Mobile Cleaning','Thermal Paste Replacement','Motherboard Repair','Software & Flashing','Speaker Repair','Microphone Repair','Camera Repair','Back Glass Replacement','Water Damage Repair','Network Repair','Fingerprint Repair'],
 'Home Appliances':['TV','LCD / LED TV','AC','Air Cooler','Fan','Fridge','Washing Machine','Mixer Grinder','Microwave Oven','OTG / Electric Oven','Induction Cooktop','Gas Stove / Hob','Kitchen Chimney','Geyser / Water Heater','Water Purifier / RO','Water Dispenser','Dishwasher','Deep Freezer','Air Purifier','Vacuum Cleaner','Electric Iron','Room Heater','Electric Kettle','Toaster','Inverter / UPS','Water Pump','Sewing Machine','Other']
};
const MEMBER_SKILLS={technician:[...Object.values(SKILL_GROUPS).flat(),'Phone','Motherboard','Screen','Battery','Charging Port'],staff:STAFF_DUTIES};
export default function AddMemberPage({
  initialMember,
  embedded = false,
  onClose,
  onSaved
}) {
  const w = useWorkforce(),
    [params] = useSearchParams();
  const formRef = useRef(null),
    submitLock = useRef(false);
  const navigate = useNavigate();
  const cancel = () => onClose?  onClose() : navigate('/dashboard/members');
  const initialRole = initialMember?.role || (params.get('role') === 'staff' ? 'staff' : 'technician'),
    existingSkills = initialRole==='staff'?[staffDuty(initialMember)].filter(Boolean):(initialMember?.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    customSkills = existingSkills.filter(s => !MEMBER_SKILLS[initialRole].includes(s));
  const [form, setForm] = useState({
      name: '',
      phone: '',
      photo: '',
      email: '',
      alternatePhone: '',
      dateOfBirth: '',
      gender: '',
      guardianName: '',
      guardianPhone: '',
      emergencyName: '',
      emergencyPhone: '',
      house: '',
      street: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
      joiningDate: businessDate(new Date()),
      employmentType: 'Full-time',
      salary: '',
      ...initialMember,
      role: initialRole,
      qualifications: Array.isArray(initialMember?.qualifications) ? initialMember.qualifications : [],
      experience: initialMember?.experience !== undefined && initialMember?.experience !== '' ? Number.parseInt(initialMember.experience, 10) >= 5 ? '5+' : String(initialMember.experience) : '',
      aadhaarNumber: '',
      panNumber: '',
      skills: [...existingSkills.filter(s => MEMBER_SKILLS[initialRole].includes(s)), ...(initialRole==='technician'&&customSkills.length ? ['Other'] : [])]
    }),
    [skillGroups,setSkillGroups]=useState(()=>Object.keys(SKILL_GROUPS).filter(group=>SKILL_GROUPS[group].some(skill=>existingSkills.includes(skill)))),
    [other, setOther] = useState(customSkills.join(', ')),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState(null),
    [documents, setDocuments] = useState({}),
    [documentBusy, setDocumentBusy] = useState(0),
    [saving, setSaving] = useState(false);
  const choices = form.role === 'technician' ? [...new Set([...skillGroups.flatMap(group=>SKILL_GROUPS[group]),...form.skills.filter(skill=>!Object.values(SKILL_GROUPS).flat().includes(skill))])] : STAFF_DUTIES;
  const count = w.members.filter(m => m.shopId === w.shopId && m.status !== 'REMOVED' && !m.legacy && !m.isDemo && !m.demo).length;
  const change = (key, value) => {
    if(['name','guardianName','emergencyName'].includes(key))value=personNameInput(value);
    setForm(f => ({
      ...f,
      [key]: value
    }));
    setErrors(e => ({
      ...e,
      [key]: null,
      submit: null
    }));
  };
  const photo = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 2 * 1024 * 1024) {
      setForm(old => ({
        ...old,
        photo: ''
      }));
      setErrors(old => ({
        ...old,
        photo: 'Choose a JPG, PNG or WebP photo under 2 MB.'
      }));
      return;
    }
    setBusy(true);
    readMemberPhoto(file).then(value => change('photo', value)).catch(error => setErrors(old => ({
      ...old,
      photo: error.message
    }))).finally(() => setBusy(false));
  };
  const uploadDocument = (kind, file) => {
    if (!file) return;
    const key = kind + 'Image',
      education = kind.startsWith('education_'),
      types = education ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] : ['image/jpeg', 'image/png', 'image/webp'];
    if (!types.includes(file.type) || file.size <= 0 || file.size > (education ? 5 : 2) * 1024 * 1024) {
      setErrors(old => ({
        ...old,
        [key]: education ? 'Choose a PDF or image under 5 MB.' : 'Choose an image under 2 MB (JPG, PNG or WebP).'
      }));
      return;
    }
    setDocumentBusy(count => count + 1);
    readMemberDocument(file, education).then(dataUrl => {
      setDocuments(old => ({
        ...old,
        [kind]: {
          dataUrl,
          name: file.name,
          type: file.type
        }
      }));
      setErrors(old => ({
        ...old,
        [key]: null
      }));
    }).catch(error => setErrors(old => ({
      ...old,
      [key]: error.message
    }))).finally(() => setDocumentBusy(count => count - 1));
  };
  const submit = async e => {
    e.preventDefault();
    if (submitLock.current || busy || documentBusy || saving) return;
    const payload = normalizeMemberDetails({
      ...form,
      skills: form.skills.map(s => s === 'Other' ? other.trim() : s).join(', '),
      staffDuty: form.role==='staff'?form.skills[0]:undefined
    });
    const issues = memberDetailsErrors(payload);
    if(form.role==='staff'&&(form.skills.length!==1||!STAFF_DUTIES.includes(form.skills[0])))issues.skills='Choose one staff responsibility.';
    if (!form.skills.length) issues.skills = 'Select at least one skill or responsibility.';
    if (form.skills.includes('Other') && (other.trim().length < 2 || other.trim().length > 100 || !/[\p{L}\p{N}]/u.test(other) || /[<>\x00-\x1f]/.test(other))) issues.other = 'Describe the other skill in 2–100 characters.';
    if (issues.skills && form.skills.includes('Other')) issues.other = issues.skills;
    if (!form.photo) issues.photo = 'Add a passport-style photo.';else if (errors.photo) issues.photo = errors.photo;
    if (!initialMember && count >= 10) issues.submit = 'Maximum 10 members per shop.';
    if (w.members.some(m => m.id !== initialMember?.id && m.phone === payload.phone && m.status !== 'REMOVED')) issues.phone = 'This phone number already belongs to a member.';
    if (payload.email && w.members.some(m => m.id !== initialMember?.id && m.status !== 'REMOVED' && (m.email || '').trim().toLowerCase() === payload.email)) issues.email = 'This email address already belongs to a member.';
    Object.assign(issues, requiredMemberDocuments(payload, documents, initialMember?.documents));
    const neededKinds = ['aadhaar', 'pan', ...educationRequirements(form.qualifications).map(([key]) => key)];
    for (const kind of neededKinds) if (errors[kind + 'Image']) issues[kind + 'Image'] = errors[kind + 'Image'];
    setErrors(issues);
    if (Object.keys(issues).length) {
      const focus = () => {
        const node = formRef.current?.querySelector?.('[aria-invalid="true"]');
        const target = node?.matches?.('fieldset')?  node.querySelector('input,select,textarea') : node;
        target?.scrollIntoView?.({
          block: 'center',
          behavior: 'smooth'
        });
        target?.focus?.({
          preventScroll: true
        });
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focus);else setTimeout(focus, 0);
      return;
    }
    submitLock.current = true;
    const finish = final => {
      const result = initialMember?  w.updateMember(initialMember.id, final) : (() => {
        const member = w.add(final);
        return {
          success: Boolean(member),
          member
        };
      })();
      if (result.success) {
        setInvite(result.member);
        onSaved?.(result.member);
        return true;
      }
      submitLock.current = false;
      setErrors(old => ({
        ...old,
        submit: result.error || 'Member could not be saved. Please try again.'
      }));
      return false;
    };
    const requiredEducation = educationRequirements(form.qualifications).map(([key]) => key);
    const kinds = Object.keys(documents).filter(key => !key.startsWith('education_') || requiredEducation.includes(key));
    if (!kinds.length) {
      finish({
        ...payload,
        documents: Object.fromEntries(Object.entries(initialMember?.documents || {}).filter(([key]) => !key.startsWith('education_') || requiredEducation.includes(key)))
      });
      return;
    }
    setSaving(true);
    try {
      const references = Object.fromEntries(Object.entries(initialMember?.documents || {}).filter(([key]) => !key.startsWith('education_') || requiredEducation.includes(key)));
      for (const kind of kinds) {
        if (documents[kind]) references[kind] = await saveMemberDocument({
          ...documents[kind],
          kind,
          shopId: w.shopId
        });else delete references[kind];
      }
      finish({
        ...payload,
        documents: references
      });
    } catch (error) {
      submitLock.current = false;
      setErrors(old => ({
        ...old,
        submit: error.message || 'Documents could not be saved. Please try again.'
      }));
    } finally {
      setSaving(false);
    }
  };
  const detailField = (key, label, type = 'text', maxLength = 100) => <Field key={key} label={label} error={errors[key]}><input type={type} value={form[key]} placeholder={key === 'aadhaarNumber' && initialMember?.identity?.aadhaarLast4 ? 'Saved Aadhaar ending ' + initialMember.identity.aadhaarLast4 : key === 'panNumber' && initialMember?.identity?.panMasked ? 'Saved PAN: ' + initialMember.identity.panMasked : undefined} list={key === 'state' ? 'member-state-options' : undefined} maxLength={{
      email: 254,
      house: 80,
      street: 120,
      city: 80,
      state: 80,
      guardianName: 80,
      emergencyName: 80
    }[key] || maxLength} required={['email', 'dateOfBirth', 'guardianName', 'guardianPhone', 'locality', 'aadhaarNumber', 'panNumber', 'emergencyName', 'emergencyPhone', 'house', 'street', 'city', 'state', 'pincode', 'joiningDate'].includes(key)} max={key === 'dateOfBirth' ? businessDate(new Date()) : undefined} inputMode={['aadhaarNumber', 'pincode', 'alternatePhone', 'guardianPhone', 'emergencyPhone', 'experience'].includes(key) ? 'numeric' : undefined} onChange={e => change(key, key === 'panNumber' ? e.target.value.toUpperCase() : ['aadhaarNumber', 'pincode', 'alternatePhone', 'guardianPhone', 'emergencyPhone'].includes(key) ? e.target.value.replace(/\D/g, '') : e.target.value)} /></Field>;
  return <WorkforceCopy><div className={'wf-page wf-add-page' + (embedded ? ' md-embedded-form' : '')}><header className="wf-add-heading"><div><h1>{initialMember ? 'Edit member details' : 'Add a team member'}</h1><p>{initialMember ? 'Update this member’s details and documents.' : 'Keep your team details together. Add members directly.'}</p></div></header>{invite ? <section className="wf-invite-success"><span className="wf-success-icon"><CheckCircle2 size={36} /></span><h2>{initialMember ? 'Member details updated' : 'Member added successfully'}</h2><p>{initialMember ? 'Saved member information has been updated.' : 'No invitation or verification is required.'}</p><div className="wf-invite-person"><img src={invite.photo} alt="" /><div><strong>{invite.name}</strong><span>{invite.role} · {invite.phone}</span></div><span className="wf-badge ACTIVE">Active</span></div><Link className="wf-primary" to="/dashboard/members">View members </Link></section> : <div className="wf-add-layout"><form ref={formRef} id="member-details-form" className="wf-add-form" onSubmit={submit} noValidate><section className="wf-add-section"><header><span>01</span><div><h2>Personal details</h2><p>How should this person appear in your team?</p></div></header><div className="wf-add-grid"><Field label="Full name" error={errors.name}><input required autoComplete="name" placeholder="e.g. Ramesh Kumar" maxLength={80} value={form.name} onChange={e => change('name', e.target.value)} /></Field><Field label="Phone number" error={errors.phone}><div className="wf-phone-input"><span>+91</span><input required type="tel" autoComplete="tel-national" placeholder="10-digit mobile number" maxLength={10} value={form.phone} onChange={e => change('phone', e.target.value.replace(/\D/g, ''))} /></div></Field>{detailField('email', 'Email address', 'email')}{detailField('alternatePhone', 'Alternate phone (optional)', 'tel', 10)}{detailField('dateOfBirth', 'Date of birth', 'date')}<Field label="Gender" error={errors.gender}><select required value={form.gender} onChange={e => change('gender', e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></Field>{detailField('guardianName', 'Parent / guardian name')}{detailField('guardianPhone', 'Parent / guardian phone', 'tel', 10)}</div></section><section className="wf-add-section"><header><span>02</span><div><h2>Address</h2><p>Current residential address of the member.</p></div></header><div className="wf-add-grid">{detailField('house', 'House / building number')}{detailField('street', 'Street / road')}{detailField('locality', 'Area / locality')}{detailField('city', 'City')}{detailField('state', 'State')}{detailField('pincode', 'Pincode', 'text', 6)}<datalist id="member-state-options">{INDIAN_STATES.map(state => <option key={state} value={state} />)}</datalist></div></section><section className="wf-add-section"><header><span>03</span><div><h2>Role & skills</h2><p>Choose the work they will handle.</p></div></header><fieldset className="wf-role-options" aria-invalid={Boolean(errors.role)}><legend className="sr-only">Role</legend>{[['technician', 'Technician', 'Repairs at customer locations', Wrench], ['staff', 'Staff', 'Counter, inventory, helper or delivery', ClipboardList]].map(([value, label, description, Icon]) => <label key={value} className={form.role === value ? 'selected' : ''}><input type="radio" name="member-role" value={value} checked={form.role === value} onChange={() => {
                  setForm(f => ({
                    ...f,
                    role: value,
                    skills: []
                  }));
                  setErrors(old => ({
                    ...old,
                    role: null,
                    skills: null,
                    other: null
                  }));
                  setOther('');
                }} /><Icon size={24} /><strong>{label}</strong><span>{description}</span></label>)}</fieldset>{errors.role && <p className="wf-error" role="alert">{errors.role}</p>}<fieldset className="wf-skill-picker" aria-invalid={Boolean(errors.skills)}><legend>{form.role === 'technician' ? 'Repair skills' : 'Responsibilities'} <small>{form.role==='technician'?'Select all that apply':'Choose one responsibility'}</small></legend>{form.role==='technician'&&<div className="wf-skill-groups">{Object.keys(SKILL_GROUPS).map(group=><label key={group} className={skillGroups.includes(group)?'selected':''}><input type="checkbox" checked={skillGroups.includes(group)} onChange={e=>{setSkillGroups(prev=>e.target.checked?[...prev,group]:prev.filter(v=>v!==group));if(!e.target.checked)change('skills',form.skills.filter(v=>!SKILL_GROUPS[group].includes(v)));}}/><span>{group}</span></label>)}</div>}{form.role==='technician'&&<p className="wf-skill-help">Choose Mobile, Home Appliances or both, then select all matching skills below.</p>}<div className="wf-skill-options">{choices.map(skill => <label key={skill} className={form.skills.includes(skill) ? 'selected' : ''}><input type={form.role==='staff'?'radio':'checkbox'} name={form.role==='staff'?'staff-duty':undefined} checked={form.skills.includes(skill)} onChange={e => change('skills', form.role==='staff'?[skill]:e.target.checked ? [...form.skills, skill] : form.skills.filter(s => s !== skill))} />{form.skills.includes(skill) && <Check size={15} />}<span>{skill}</span></label>)}</div>{errors.skills && <p className="wf-error" role="alert">{errors.skills}</p>}</fieldset>{form.role==='technician'&&form.skills.includes('Other') && <Field label="Other skill / responsibility" error={errors.other}><input maxLength={100} value={other} onChange={e => {
                setOther(e.target.value);
                setErrors(old => ({
                  ...old,
                  other: null
                }));
              }} /></Field>}</section><section className="wf-add-section"><header><span>04</span><div><h2>Work details</h2><p>Joining date and employment information.</p></div></header><div className="wf-add-grid">{detailField('joiningDate', 'Joining date', 'date')}<Field label="Monthly salary (INR)" error={errors.salary}><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 15000" value={form.salary??  ''} onChange={e => change('salary', e.target.value)} /></Field><Field label="Employment type" error={errors.employmentType}><select required value={form.employmentType} onChange={e => change('employmentType', e.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></Field><Field label="Experience" error={errors.experience}><select required value={form.experience} onChange={e => change('experience', e.target.value)}><option value="">Select experience</option>{EXPERIENCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div><fieldset className="wf-qualification-picker" aria-invalid={Boolean(errors.qualifications)}><legend>Highest qualification <span className="md-required">*</span></legend><p>Select completed qualifications. Required certificates appear below automatically.</p><div>{QUALIFICATIONS.map(q => <label key={q.value}><input type="checkbox" checked={form.qualifications.includes(q.value)} onChange={e => {
                    setForm(f => ({
                      ...f,
                      qualifications: e.target.checked ? [...new Set([...f.qualifications, q.value])] : f.qualifications.filter(value => value !== q.value)
                    }));
                    setErrors(old => Object.fromEntries(Object.entries(old).map(([key, value]) => [key, key === 'qualifications' || key.startsWith('education_') ? null : value])));
                  }} />{q.label}</label>)}</div>{errors.qualifications && <p className="wf-error" role="alert">{errors.qualifications}</p>}</fieldset></section><section className="wf-add-section"><header><span>05</span><div><h2>Identity details</h2><p>Aadhaar number, PAN number and both card images are required.</p></div></header><div className="wf-add-grid">{detailField('aadhaarNumber', 'Aadhaar number', 'text', 12)}{detailField('panNumber', 'PAN number', 'text', 10)}</div><p className="wf-subtle">Saved ID numbers are masked in member details.</p><div className="md-document-uploads">{[['aadhaar', 'Aadhaar card'], ['pan', 'PAN card']].map(([kind, label]) => <MemberDocumentUpload key={kind} kind={kind} label={label} required reference={initialMember?.documents?.[kind]} value={documents[kind]} error={errors[kind + 'Image']} disabled={saving || documentBusy > 0} onChange={uploadDocument} onRemove={kind => {
                setDocuments(old => ({
                  ...old,
                  [kind]: null
                }));
                setErrors(old => ({
                  ...old,
                  [kind + 'Image']: null
                }));
              }} />)}</div></section><section className="wf-add-section"><header><span>06</span><div><h2>Emergency contact</h2><p>A person to contact if needed.</p></div></header><div className="wf-add-grid">{detailField('emergencyName', 'Emergency contact name')}{detailField('emergencyPhone', 'Emergency contact phone', 'tel', 10)}</div></section><section className="wf-add-section"><header><span>07</span><div><h2>Profile photo <span className="md-required">*</span></h2><p>A clear passport-style photo for their profile.</p></div></header><div className="wf-photo-upload"><span className="wf-photo-preview">{form.photo ? <img src={form.photo} alt="Member photo preview" /> : <UserRound size={32} />}</span><div><label className="wf-upload-button"><Upload size={18} />{form.photo ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo} disabled={busy} aria-required="true" aria-invalid={Boolean(errors.photo)} aria-describedby={errors.photo ? 'member-profile-photo-error' : undefined} /></label><p>JPG, PNG or WebP · Max 2 MB</p>{form.photo && <button type="button" className="wf-photo-remove" onClick={() => change('photo', '')}>Remove photo</button>}</div></div>{errors.photo && <p id="member-profile-photo-error" className="wf-error" role="alert">{errors.photo}</p>}</section><section className="wf-add-section"><header><span>08</span><div><h2>Educational documents <span className="md-required">*</span></h2><p>Upload every certificate shown for your selected qualifications.</p></div></header>{educationRequirements(form.qualifications).length ? <div className="md-document-uploads">{educationRequirements(form.qualifications).map(([kind, label]) => <MemberDocumentUpload key={kind} kind={kind} label={label} required allowPdf reference={initialMember?.documents?.[kind]} value={documents[kind]} error={errors[kind + 'Image']} disabled={saving || documentBusy > 0} onChange={uploadDocument} onRemove={kind => {
                setDocuments(old => ({
                  ...old,
                  [kind]: null
                }));
                setErrors(old => ({
                  ...old,
                  [kind + 'Image']: null
                }));
              }} />)}</div> : <p className="wf-subtle">Choose your qualification in Work details to see required uploads.</p>}</section><footer className="wf-add-footer"><p>{initialMember ? 'Changes update this member’s saved information.' : count >= 10 ? 'Maximum 10 members per shop.' : 'The member is added directly to your team.'}</p>{errors.submit && <p className="wf-error" role="alert">{errors.submit}</p>}<div className="md-form-footer-actions"><button type="submit" form="member-details-form" className="wf-primary" disabled={Boolean(invite) || busy || documentBusy > 0 || saving || !initialMember && count >= 10}>{busy || documentBusy > 0 || saving ? <span className="wf-spinner" aria-label="Saving member" role="status" /> : 'Save'}</button><button type="button" onClick={cancel} disabled={saving}>Cancel</button></div></footer></form><aside className="wf-add-guide"><section><span className="wf-guide-kicker">MEMBER RECORD</span><h2>All the basics, in one place.</h2><ol><li><span>1</span><div><strong>Personal & contact</strong><p>Name, phone, address and emergency contact.</p></div></li><li><span>2</span><div><strong>Work & identity</strong><p>Role, skills, joining date and identity and educational documents.</p></div></li><li><span>3</span><div><strong>Add directly</strong><p>No OTP, invite or verification step.</p></div></li></ol></section></aside></div>}</div></WorkforceCopy>;
}
