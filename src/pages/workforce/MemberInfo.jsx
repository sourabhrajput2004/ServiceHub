import {workerLabel} from '../../utils/workforceAccess';
import React, { useEffect, useState } from 'react';
import {UserRound, FileImage, FileText, LoaderCircle} from 'lucide-react';
import { Modal } from '../../components/workforce/WorkerShell';
import { useWorkforce } from '../../context/WorkforceContext';
import { loadMemberDocument } from './memberDocuments';
import { educationRequirements, experienceLabel, QUALIFICATIONS } from './memberEducation';
import MemberDocumentContent from './MemberDocumentContent';
import { isPdfDocument } from './documentType';
export default function MemberInfo({
  member,month,store,jobs,
  onClose
}) {
  const {
      shopId
    } = useWorkforce(),
    [documents, setDocuments] = useState({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [zoom, setZoom] = useState(null);
  const education = educationRequirements(member.qualifications),
    entries = [['aadhaar', 'Aadhaar card'], ['pan', 'PAN card'], ...education],
    signature = entries.map(([key]) => member.documents?.[key]?.id || '').join('|');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all(entries.map(async ([kind]) => [kind, await loadMemberDocument(member.documents?.[kind], shopId)])).then(values => {
      if (active) setDocuments(Object.fromEntries(values));
    }).catch(() => {
      if (active) setError('Document preview could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [member.id, shopId, signature]);
  const groups = [['Personal details', [['Full name', member.name], ['Role', member.role], ['Phone', member.phone], ['Email', member.email], ['Alternate phone', member.alternatePhone], ['Date of birth', member.dateOfBirth], ['Gender', member.gender], ['Parent / guardian', member.guardianName], ['Parent / guardian phone', member.guardianPhone]]], ['Address', [['House / building number', member.house], ['Street / road', member.street], ['Area / locality', member.locality], ['City', member.city], ['State', member.state], ['Pincode', member.pincode]]], ['Work details', [['Responsibility',workerLabel(member)],['Skills', member.skills], ['Joining date', member.joiningDate], ['Employment type', member.employmentType], ['Monthly salary (INR)', member.salary !== '' && member.salary != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(member.salary)) : null], ['Experience', experienceLabel(member.experience)], ['Highest qualification', QUALIFICATIONS.filter(q => member.qualifications?.includes(q.value)).map(q => q.label).join(', ')]]], ['Emergency contact', [['Contact name', member.emergencyName], ['Contact phone', member.emergencyPhone]]], ['Identity details', [['Aadhaar', member.identity?.aadhaarLast4 ? '•••• •••• ' + member.identity.aadhaarLast4 : null], ['PAN', member.identity?.panMasked]]]];
  const documentGroup = (title, items) => <section className="md-documents"><h3>{title}</h3>{loading ? <div className="md-doc-loading" role="status"><LoaderCircle size={20} />Loading documents…</div> : <div className="md-doc-grid">{items.map(([kind, label]) => <figure key={kind}><figcaption>{label}</figcaption>{documents[kind]?.dataUrl ? <><button className="md-document-open" type="button" onClick={() => setZoom({
            label,
            document: documents[kind]
          })} aria-label={'Open ' + label + (isPdfDocument(documents[kind]) ? ' document' : ' image')}>{isPdfDocument(documents[kind]) ? <span className="md-pdf-card"><FileText size={35} />PDF document</span> : <MemberDocumentContent document={documents[kind]} label={label} />}</button><small>{documents[kind].name}</small></> : <div className="md-doc-empty"><FileImage size={25} /><span>{member.documents?.[kind] ? 'Document image is unavailable on this device.' : 'No image uploaded'}</span></div>}</figure>)}</div>}</section>;
  return <Modal wide showClose title="Member information" onClose={onClose}><div className="md-info-person">{member.photo ? <img src={member.photo} alt={member.name} /> : <span><UserRound size={34} /></span>}<div><h3>{member.name}</h3><span className={'wf-role-tag ' + member.role}>{member.role}</span></div></div><div className="md-info-sections">{groups.map(([title, rows]) => <section key={title}><h3>{title}</h3><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === 0 ? '0' : value || '—'}</dd></div>)}</dl></section>)}</div>{documentGroup('Identity documents' , [['aadhaar', 'Aadhaar card'], ['pan', 'PAN card']])}{education.length ? documentGroup('Educational documents', education) : null}{error && <p className="wf-error" role="alert">{error}</p>}{zoom && <Modal wide showClose title={zoom.label} onClose={() => setZoom(null)}><MemberDocumentContent full document={zoom.document} label={zoom.label} /></Modal>}</Modal>;
}
