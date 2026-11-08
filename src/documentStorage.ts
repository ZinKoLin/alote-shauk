import { DRAFT_TTL } from "./model";
import type { Documents } from "./documents";

export const DOCUMENT_SESSION_KEY = "patama.cv.documents.session.v1";
const STORE = "drafts";
type RecordData = { id: string; updatedAt: number; documents: Documents };
let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("patama-cv-documents", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Document storage is blocked"));
    });
  return database;
}

export async function loadDocuments(
  id: string,
): Promise<RecordData | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    let found: RecordData | undefined;
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const record = cursor.value as RecordData;
      if (
        !Number.isFinite(record.updatedAt) ||
        Date.now() - record.updatedAt >= DRAFT_TTL
      )
        cursor.delete();
      else if (record.id === id) found = record;
      cursor.continue();
    };
    transaction.oncomplete = () => resolve(found);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function saveDocuments(
  id: string,
  documents: Documents,
  updatedAt: number,
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction
      .objectStore(STORE)
      .put({ id, documents, updatedAt } satisfies RecordData);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function touchDocuments(
  id: string,
  updatedAt: number,
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result as RecordData | undefined;
      if (record)
        store.put({
          ...record,
          updatedAt: Math.max(record.updatedAt, updatedAt),
        });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function clearDocuments(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
