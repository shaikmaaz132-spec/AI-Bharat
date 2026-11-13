/**
 * Client-Side IndexedDB Offline Cache for AI for Bharat (जन एआई)
 * Persists accessed schemes, eligibility evaluations, petitions, and audio blobs.
 */

const DB_NAME = 'AI_FOR_BHARAT_OFFLINE_DB';
const DB_VERSION = 1;

export interface CachedScheme {
  id: string;
  slug: string;
  title: string;
  title_translations: Record<string, string>;
  description: string;
  description_translations: Record<string, string>;
  category: string;
  ministry: string;
  level: string;
  state: string | null;
  financial_benefit: string;
  financial_benefit_amount: number;
  eligibility_criteria: Record<string, any>;
  required_documents: string[];
  application_process: string;
  official_url: string;
  cachedAt?: number;
}

export interface CachedPetition {
  id: string;
  petitionType: string;
  department: string;
  targetAuthority: string;
  subject: string;
  statutoryReference: string;
  englishDraft: string;
  vernacularDraft: string;
  citizenLanguage: string;
  dateFormatted: string;
  savedAt: number;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only accessible in browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Schemes Store
      if (!db.objectStoreNames.contains('schemes')) {
        const schemesStore = db.createObjectStore('schemes', { keyPath: 'slug' });
        schemesStore.createIndex('category', 'category', { unique: false });
        schemesStore.createIndex('level', 'level', { unique: false });
      }

      // 2. Eligibility History Store
      if (!db.objectStoreNames.contains('eligibility_history')) {
        const eligibilityStore = db.createObjectStore('eligibility_history', { keyPath: 'id', autoIncrement: true });
        eligibilityStore.createIndex('evaluatedAt', 'evaluatedAt', { unique: false });
      }

      // 3. Grievances / Petitions Store
      if (!db.objectStoreNames.contains('petitions')) {
        const petitionsStore = db.createObjectStore('petitions', { keyPath: 'id' });
        petitionsStore.createIndex('savedAt', 'savedAt', { unique: false });
      }

      // 4. Audio Blobs Cache Store
      if (!db.objectStoreNames.contains('audio_cache')) {
        db.createObjectStore('audio_cache', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache schemes into IndexedDB for offline access
 */
export async function cacheSchemes(schemes: CachedScheme[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('schemes', 'readwrite');
    const store = tx.objectStore('schemes');

    for (const scheme of schemes) {
      store.put({
        ...scheme,
        cachedAt: Date.now(),
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache schemes into IndexedDB:', err);
  }
}

/**
 * Retrieve all cached schemes or by category from IndexedDB
 */
export async function getCachedSchemes(category?: string): Promise<CachedScheme[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('schemes', 'readonly');
    const store = tx.objectStore('schemes');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let items: CachedScheme[] = request.result || [];
        if (category && category !== 'all') {
          items = items.filter((s) => s.category === category);
        }
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to fetch schemes from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieve a specific cached scheme by slug
 */
export async function getCachedSchemeBySlug(slug: string): Promise<CachedScheme | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('schemes', 'readonly');
    const store = tx.objectStore('schemes');

    return new Promise((resolve, reject) => {
      const request = store.get(slug);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Failed to fetch scheme ${slug} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Save petition draft to IndexedDB
 */
export async function savePetitionToIdb(petition: CachedPetition): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('petitions', 'readwrite');
    const store = tx.objectStore('petitions');
    store.put(petition);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save petition into IndexedDB:', err);
  }
}

/**
 * Retrieve all locally saved petitions
 */
export async function getSavedPetitions(): Promise<CachedPetition[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('petitions', 'readonly');
    const store = tx.objectStore('petitions');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to fetch petitions from IndexedDB:', err);
    return [];
  }
}

/**
 * Save eligibility evaluation result
 */
export async function saveEligibilityToIdb(result: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('eligibility_history', 'readwrite');
    const store = tx.objectStore('eligibility_history');
    store.add({
      ...result,
      savedAt: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save eligibility to IndexedDB:', err);
  }
}

/**
 * Cache TTS audio blob
 */
export async function cacheAudioBlob(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('audio_cache', 'readwrite');
    const store = tx.objectStore('audio_cache');
    store.put({ key, blob, cachedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to cache audio blob:', err);
  }
}

/**
 * Retrieve TTS audio blob
 */
export async function getCachedAudioBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('audio_cache', 'readonly');
    const store = tx.objectStore('audio_cache');

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
