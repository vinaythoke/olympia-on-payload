/**
 * Utility for offline data storage and synchronization
 */

// Types for offline data
export interface OfflineCheckIn {
  id?: number;
  ticketId: string;
  photoData: string;
  timestamp: number;
  userId: string;
  eventId: string;
}

export interface CachedTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  ticketType: string;
  qrCode: string;
  isCheckedIn: boolean;
  timestamp: number;
}

export interface CachedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  timestamp: number;
}

// Open the IndexedDB database
export async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('olympia-offline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offline-check-ins')) {
        db.createObjectStore('offline-check-ins', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cached-tickets')) {
        db.createObjectStore('cached-tickets', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cached-events')) {
        db.createObjectStore('cached-events', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store an offline check-in
export async function storeOfflineCheckIn(checkIn: OfflineCheckIn): Promise<number> {
  const db = await openDB();
  
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(['offline-check-ins'], 'readwrite');
    const store = transaction.objectStore('offline-check-ins');
    
    const request = store.add({
      ...checkIn,
      timestamp: Date.now(),
    });
    
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get all offline check-ins
export async function getOfflineCheckIns(): Promise<OfflineCheckIn[]> {
  const db = await openDB();
  
  return new Promise<OfflineCheckIn[]>((resolve, reject) => {
    const transaction = db.transaction(['offline-check-ins'], 'readonly');
    const store = transaction.objectStore('offline-check-ins');
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Remove an offline check-in
export async function removeOfflineCheckIn(id: number): Promise<void> {
  const db = await openDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['offline-check-ins'], 'readwrite');
    const store = transaction.objectStore('offline-check-ins');
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Cache a ticket for offline use
export async function cacheTicket(ticket: CachedTicket): Promise<void> {
  const db = await openDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['cached-tickets'], 'readwrite');
    const store = transaction.objectStore('cached-tickets');
    
    const request = store.put({
      ...ticket,
      timestamp: Date.now(),
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get all cached tickets
export async function getCachedTickets(): Promise<CachedTicket[]> {
  const db = await openDB();
  
  return new Promise<CachedTicket[]>((resolve, reject) => {
    const transaction = db.transaction(['cached-tickets'], 'readonly');
    const store = transaction.objectStore('cached-tickets');
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Cache an event for offline use
export async function cacheEvent(event: CachedEvent): Promise<void> {
  const db = await openDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['cached-events'], 'readwrite');
    const store = transaction.objectStore('cached-events');
    
    const request = store.put({
      ...event,
      timestamp: Date.now(),
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Get all cached events
export async function getCachedEvents(): Promise<CachedEvent[]> {
  const db = await openDB();
  
  return new Promise<CachedEvent[]>((resolve, reject) => {
    const transaction = db.transaction(['cached-events'], 'readonly');
    const store = transaction.objectStore('cached-events');
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

// Sync all offline check-ins with the server
export async function syncOfflineCheckIns(): Promise<boolean> {
  try {
    const checkIns = await getOfflineCheckIns();
    
    if (checkIns.length === 0) {
      return true;
    }
    
    // Process each check-in
    const results = await Promise.all(
      checkIns.map(async (checkIn) => {
        try {
          const response = await fetch('/api/check-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketId: checkIn.ticketId,
              photoData: checkIn.photoData,
              userId: checkIn.userId,
              eventId: checkIn.eventId,
              offlineTimestamp: checkIn.timestamp,
            }),
          });
          
          if (response.ok) {
            // Remove from IndexedDB if successful
            if (checkIn.id) {
              await removeOfflineCheckIn(checkIn.id);
            }
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Failed to sync check-in:', error);
          return false;
        }
      })
    );
    
    // Return true if all syncs were successful
    return results.every(Boolean);
  } catch (error) {
    console.error('Error syncing offline check-ins:', error);
    return false;
  }
} 