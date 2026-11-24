/**
 * PHASE 6: CATALOG SYNCHRONIZATION BUS
 *
 * Provides real-time synchronization between Super Admin package management
 * and Customer Catalog browsing across components, routes, and browser tabs.
 * Uses BroadcastChannel with localStorage storage-event fallback.
 */

const SYNC_STORAGE_KEY = 'smarthome_catalog_sync_timestamp';
const CHANNEL_NAME = 'smarthome_catalog_sync_channel';

class CatalogSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'CATALOG_MUTATED') {
            this.notifyListeners();
          }
        };
      } catch {
        // Fallback to storage event
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SYNC_STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  /**
   * Broadcasts a mutation event when Super Admin modifies packages
   * (create, update, activate, deactivate, archive, delete).
   */
  public notifyCatalogUpdated(): void {
    if (typeof window !== 'undefined') {
      const now = Date.now().toString();
      try {
        localStorage.setItem(SYNC_STORAGE_KEY, now);
      } catch {
        // Ignore localStorage quota errors
      }

      if (this.channel) {
        try {
          this.channel.postMessage({ type: 'CATALOG_MUTATED', timestamp: now });
        } catch {
          // Ignore broadcast errors
        }
      }

      // Notify local listeners in the current window/tab
      this.notifyListeners();
    }
  }

  /**
   * Subscribes to catalog mutation events
   * @param callback Function to execute upon catalog mutation
   * @returns Cleanup function to unsubscribe
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('[CatalogSync] Error notifying listener:', err);
      }
    });
  }
}

export const catalogSync = new CatalogSyncService();
