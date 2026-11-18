import { isPdfDocument } from './documentType';
import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import React, { useEffect, useState } from 'react';
import {Upload, FileImage, FileText, X} from 'lucide-react';
import { useWorkforce } from '../../context/WorkforceContext';
import { loadMemberDocument } from './memberDocuments';
export default function MemberDocumentUpload({
  kind,
  label,
  reference,
  value,
  onChange,
  onRemove,
  error,
  disabled,
  allowPdf = false,
  required = false
}) {
  const {
      shopId
    } = useWorkforce(),
    [saved, setSaved] = useState(null);
  useEffect(() => {
    let active = true;
    if (reference && value === undefined) loadMemberDocument(reference, shopId).then(doc => {
      if (active) setSaved(doc);
    }).catch(() => {});else setSaved(null);
    return () => {
      active = false;
    };
  }, [reference?.id, value, shopId]);
  const errorId = React.useId();
  const doc = value === undefined?  saved : value;
  return <WorkforceCopy><div className="md-upload"><strong>{label}{required && <span className="md-required"> *</span>}</strong><div className="md-upload-preview">{doc?.dataUrl && isPdfDocument(doc) ? <div><FileText size={35} /><span>PDF document</span></div> : doc?.dataUrl ? <img src={doc.dataUrl} alt={label + ' preview'} /> : <div><FileImage size={30} /><span>{reference && value === undefined ? 'Saved document' : 'No image selected'}</span></div>}</div><label className="wf-upload-button"><Upload size={17} />{doc ? 'Change image' : 'Upload image'}<input type="file" accept={allowPdf ? 'application/pdf,image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp'} aria-required={required} aria-label={'Upload ' + label} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={e => onChange(kind, e.target.files?.[0])} /></label><p>{allowPdf ? 'PDF, JPG, PNG or WebP · Max 5 MB' : 'JPG, PNG or WebP · Max 2 MB'}</p>{(doc || reference && value === undefined) && <button className="md-document-remove" type="button" onClick={() => onRemove(kind)}><X size={14} />Remove image</button>}{doc?.name && <small>{doc.name}</small>}{error && <p id={errorId} className="wf-error" role="alert">{error}</p>}</div></WorkforceCopy>;
}
