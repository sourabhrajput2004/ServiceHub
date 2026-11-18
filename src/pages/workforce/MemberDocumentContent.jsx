import WorkforceCopy from '../../components/workforce/WorkforceCopy';
import React from 'react';
import { isPdfDocument } from './documentType';
export default function MemberDocumentContent({
  document,
  label,
  full = false
}) {
  return <WorkforceCopy>{isPdfDocument(document) ? <object className={full ? 'md-pdf-full' : 'md-pdf-preview'} type="application/pdf" data={document.dataUrl} aria-label={label}><p>PDF preview unavailable. <a href={document.dataUrl} download={document.name || 'document.pdf'}>Download document</a></p></object> : <img className={full ? 'md-document-full' : undefined} src={document.dataUrl} alt={label} />}</WorkforceCopy>;
}
