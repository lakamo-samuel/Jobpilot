// Files stay in this browser. No upload or document parsing service is connected.
function openDocuments(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pursio-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeDocument(id: string, file: File) {
  const db = await openDocuments();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(file, id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
export async function removeDocument(id?: string) {
  const db = await openDocuments();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); if (id) tx.objectStore("files").delete(id); else tx.objectStore("files").clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
export async function downloadDocument(id: string, name: string) {
  const db = await openDocuments();
  try {
    const file = await new Promise<Blob | undefined>((resolve, reject) => { const req = db.transaction("files").objectStore("files").get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    if (!file) throw new Error("The file is not stored in this browser.");
    const url = URL.createObjectURL(file); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally { db.close(); }
}
