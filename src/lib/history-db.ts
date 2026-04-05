import type {
  PlaygroundType,
  HistoryEntry,
  HistoryImageRecord,
} from "@/types/history";

const DB_NAME = "gen-smith-history";
const DB_VERSION = 1;
const ENTRIES_STORE = "entries";
const IMAGES_STORE = "images";
const MAX_ENTRIES_PER_PLAYGROUND = 50;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const entries = db.createObjectStore(ENTRIES_STORE, { keyPath: "id" });
        entries.createIndex("playground", "playground", { unique: false });
        entries.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        const images = db.createObjectStore(IMAGES_STORE, {
          autoIncrement: true,
        });
        images.createIndex("historyId", "historyId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getAllEntries(
  playground: PlaygroundType
): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ENTRIES_STORE, "readonly");
    const store = tx.objectStore(ENTRIES_STORE);
    const index = store.index("playground");
    const request = index.getAll(playground);

    request.onsuccess = () => {
      const entries = request.result as HistoryEntry[];
      entries.sort((a, b) => b.createdAt - a.createdAt);
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addEntry(entry: HistoryEntry): Promise<void> {
  const db = await openDB();

  // Check count and prune oldest if over limit
  const existing = await getAllEntries(entry.playground);
  if (existing.length >= MAX_ENTRIES_PER_PLAYGROUND) {
    const toDelete = existing
      .slice(MAX_ENTRIES_PER_PLAYGROUND - 1)
      .map((e) => e.id);
    for (const id of toDelete) {
      await deleteEntry(id);
    }
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ENTRIES_STORE, "readwrite");
    const store = tx.objectStore(ENTRIES_STORE);
    const request = store.add(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();

  // Delete associated images first
  await deleteImagesByHistoryId(id);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ENTRIES_STORE, "readwrite");
    const store = tx.objectStore(ENTRIES_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearEntries(
  playground: PlaygroundType
): Promise<void> {
  const entries = await getAllEntries(playground);
  for (const entry of entries) {
    await deleteEntry(entry.id);
  }
}

export async function saveImages(
  historyId: string,
  images: { b64_json: string; index: number; format: string }[]
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);
    for (const img of images) {
      store.add({
        historyId,
        index: img.index,
        b64_json: img.b64_json,
        format: img.format,
      } satisfies HistoryImageRecord);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImages(
  historyId: string
): Promise<HistoryImageRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readonly");
    const store = tx.objectStore(IMAGES_STORE);
    const index = store.index("historyId");
    const request = index.getAll(historyId);
    request.onsuccess = () => {
      const records = request.result as HistoryImageRecord[];
      records.sort((a, b) => a.index - b.index);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteImagesByHistoryId(historyId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    const store = tx.objectStore(IMAGES_STORE);
    const index = store.index("historyId");
    const request = index.openCursor(historyId);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Reset the cached db promise — used in tests */
export function _resetDB(): void {
  dbPromise = null;
}
