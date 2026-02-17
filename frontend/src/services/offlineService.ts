// Offline Itinerary Caching via IndexedDB

const DB_NAME = 'trip-planner-offline';
const DB_VERSION = 1;
const STORE_NAME = 'itineraries';

interface OfflineItinerary {
    id: string;
    tripResult: any;
    savedAt: number;
    label: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveItineraryOffline(tripResult: any): Promise<string> {
    const db = await openDB();
    const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Build a human-readable label
    const cities = [...new Set((tripResult.itinerary || []).map((d: any) => d.city))] as string[];
    const label = cities.length > 0
        ? `${tripResult.itinerary.length}-Day Trip: ${cities.slice(0, 3).join(', ')}${cities.length > 3 ? '...' : ''}`
        : `Trip (${new Date().toLocaleDateString()})`;

    const entry: OfflineItinerary = {
        id,
        tripResult,
        savedAt: Date.now(),
        label,
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
    });
}

export async function getOfflineItineraries(): Promise<OfflineItinerary[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => {
            const items = (req.result as OfflineItinerary[]).sort((a, b) => b.savedAt - a.savedAt);
            resolve(items);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function deleteOfflineItinerary(id: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
