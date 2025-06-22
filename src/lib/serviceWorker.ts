import { Workbox } from 'workbox-window';

// Add window.workbox type declaration
declare global {
  interface Window {
    workbox: any;
  }
}

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    const wb = new Workbox('/sw.js');
    
    // Add event listeners for service worker lifecycle
    wb.addEventListener('installed', (event) => {
      console.log('Service Worker installed:', event);
      
      if (!event.isUpdate) {
        console.log('Service Worker installed for the first time');
      }
    });

    wb.addEventListener('controlling', () => {
      console.log('Service Worker controlling the page');
    });

    wb.addEventListener('activated', (event) => {
      console.log('Service Worker activated:', event);
    });

    wb.addEventListener('waiting', (event) => {
      console.log('Service Worker waiting:', event);
      
      // Optional: Show a notification to the user that there's an update available
      if (confirm('A new version is available. Update now?')) {
        wb.messageSkipWaiting();
      }
    });

    // Register the service worker
    wb.register()
      .then((registration) => {
        if (registration) {
          console.log('Service Worker registered with scope:', registration.scope);
        }
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    return wb;
  }
  
  return null;
}

// Network status detection
export function setupNetworkStatusMonitoring(callback: (isOnline: boolean) => void) {
  if (typeof window !== 'undefined') {
    // Initial status
    callback(navigator.onLine);
    
    // Listen for changes
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

// IndexedDB helper for offline storage
export async function setupIndexedDB() {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    const dbPromise = window.indexedDB.open('olympia-offline', 1);
    
    dbPromise.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores for offline data
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
    
    return new Promise<IDBDatabase>((resolve, reject) => {
      dbPromise.onsuccess = () => resolve(dbPromise.result);
      dbPromise.onerror = () => reject(dbPromise.error);
    });
  }
  
  return null;
} 