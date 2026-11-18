const fallback = new Map();
let database;
function open() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('servicehub_member_documents', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents', {
      keyPath: 'id'
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(new Error('Could not save the document. Please try again.'));
    };
  });
  return database;
}
export async function saveMemberDocument({
  kind,
  dataUrl,
  name,
  shopId,
  type
}) {
  const id = crypto.randomUUID(),
    record = {
      id,
      kind,
      dataUrl,
      name,
      shopId,
      type: type || (dataUrl?.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg')
    };
  const db = await open();
  if (!db) {
    fallback.set(id, record);
    return {
      id,
      name,
      type: record.type
    };
  }
  await new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readwrite');
    tx.objectStore('documents').put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(new Error('Could not save the document. Please try again.'));
  });
  return {
    id,
    name,
    type: record.type
  };
}
export async function loadMemberDocument(reference, shopId) {
  if (!reference?.id) return null;
  const db = await open();
  const record = db ? await new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readonly');
    const request = tx.objectStore('documents').get(reference.id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  }) : fallback.get(reference.id);
  return record?.shopId === shopId ? record : null;
}
export function readDocumentImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this image. Try another file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Choose a valid image file.'));
      img.onload = () => {
        if (!img.width || !img.height) reject(new Error('Choose a valid image file.'));else resolve(reader.result);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
export async function readMemberDocument(file, allowPdf = false) {
  if (file.type !== 'application/pdf') return readDocumentImage(file);
  if (!allowPdf) throw new Error('Choose an image file for identity documents.');
  if (typeof file.slice !== 'function' || (await file.slice(0, 5).text()) !== '%PDF-') throw new Error('Choose a valid PDF document.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this document.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
