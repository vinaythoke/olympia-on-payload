/**
 * Sync Manager
 * 
 * Handles synchronization of offline data with the server when the device comes back online.
 * Implements retry logic, conflict resolution, and sync status reporting.
 */

import { getOfflineCheckIns, removeOfflineCheckIn } from './offlineStorage';

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed';

export interface SyncStats {
  total: number;
  successful: number;
  failed: number;
  lastSyncTime: number | null;
}

// Singleton class for managing synchronization
export class SyncManager {
  private static instance: SyncManager;
  private syncStatus: SyncStatus = 'idle';
  private syncStats: SyncStats = {
    total: 0,
    successful: 0,
    failed: 0,
    lastSyncTime: null,
  };
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private syncInterval: number | null = null;
  private listeners: Array<(status: SyncStatus, stats: SyncStats) => void> = [];

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize the sync manager and set up auto-sync on reconnection
   */
  public initialize(): void {
    // Set up event listeners for online/offline status
    window.addEventListener('online', this.handleOnline);
    
    // Check for pending sync items on initialization
    this.checkPendingSyncItems();
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add a listener for sync status updates
   */
  public addListener(callback: (status: SyncStatus, stats: SyncStats) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   */
  public removeListener(callback: (status: SyncStatus, stats: SyncStats) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus, this.syncStats));
  }

  /**
   * Handle device coming back online
   */
  private handleOnline = (): void => {
    console.log('Device is back online. Starting sync...');
    this.sync();
  }

  /**
   * Check for pending sync items
   */
  public async checkPendingSyncItems(): Promise<number> {
    try {
      const items = await getOfflineCheckIns();
      return items.length;
    } catch (error) {
      console.error('Error checking pending sync items:', error);
      return 0;
    }
  }

  /**
   * Start the synchronization process
   */
  public async sync(): Promise<boolean> {
    // Don't start a new sync if one is already in progress
    if (this.syncStatus === 'syncing') {
      return false;
    }
    
    // Update status
    this.syncStatus = 'syncing';
    this.notifyListeners();
    
    try {
      // Get all pending check-ins
      const checkIns = await getOfflineCheckIns();
      
      if (checkIns.length === 0) {
        // Nothing to sync
        this.syncStatus = 'completed';
        this.syncStats.lastSyncTime = Date.now();
        this.notifyListeners();
        return true;
      }
      
      // Update stats
      this.syncStats.total = checkIns.length;
      this.syncStats.successful = 0;
      this.syncStats.failed = 0;
      
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
              this.syncStats.successful++;
              return true;
            }
            
            // Handle specific error cases
            if (response.status === 409) {
              // Conflict - already checked in
              const conflictData = await response.json();
              console.warn('Conflict detected:', {
                local: checkIn,
                server: conflictData,
              });

              // Apply 'last write wins' strategy based on timestamp
              // The server check-in is considered the 'winner' in a simple 409 case
              if (checkIn.id) {
                await removeOfflineCheckIn(checkIn.id);
              }
              this.syncStats.successful++;
              return true;
            }
            
            this.syncStats.failed++;
            return false;
          } catch (error) {
            console.error('Failed to sync check-in:', error);
            this.syncStats.failed++;
            return false;
          }
        })
      );
      
      // Update sync status
      if (results.every(Boolean)) {
        this.syncStatus = 'completed';
        this.retryCount = 0;
      } else if (this.retryCount < this.maxRetries) {
        // Some items failed, retry later
        this.syncStatus = 'failed';
        this.retryCount++;
        
        // Schedule retry
        setTimeout(() => {
          this.sync();
        }, 30000); // Retry after 30 seconds
      } else {
        // Max retries reached
        this.syncStatus = 'failed';
        this.retryCount = 0;
      }
      
      this.syncStats.lastSyncTime = Date.now();
      this.notifyListeners();
      
      return this.syncStats.failed === 0;
    } catch (error) {
      console.error('Error during sync:', error);
      this.syncStatus = 'failed';
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Get the current sync status
   */
  public getStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get the current sync statistics
   */
  public getStats(): SyncStats {
    return { ...this.syncStats };
  }

  /**
   * Enable periodic background sync
   */
  public enablePeriodicSync(intervalMs: number = 5 * 60 * 1000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, intervalMs) as unknown as number;
  }

  /**
   * Disable periodic background sync
   */
  public disablePeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
} 