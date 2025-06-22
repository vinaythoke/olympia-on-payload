'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, AlertTriangle, WifiOff } from 'lucide-react'
import { SyncManager, SyncStatus, SyncStats } from '@/lib/syncManager'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    successful: 0,
    failed: 0,
    lastSyncTime: null,
  })
  const [isOnline, setIsOnline] = useState(true)
  const [pendingItems, setPendingItems] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Initial check
    updateOnlineStatus()

    // Listen for changes
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initialize sync manager
    const syncManager = SyncManager.getInstance()
    syncManager.initialize()

    // Check for pending items
    syncManager.checkPendingSyncItems().then((count) => {
      setPendingItems(count)
    })

    // Add listener for sync status changes
    const syncStatusListener = (status: SyncStatus, stats: SyncStats) => {
      setSyncStatus(status)
      setSyncStats(stats)

      // Update pending items count
      syncManager.checkPendingSyncItems().then((count) => {
        setPendingItems(count)
      })

      // Show toast notification when sync completes
      if (status === 'completed' && stats.total > 0) {
        toast.success(`Successfully synced ${stats.successful} items`)
      } else if (status === 'failed') {
        toast.error(`Failed to sync ${stats.failed} items. Will retry later.`)
      }
    }

    syncManager.addListener(syncStatusListener)

    // Enable periodic sync
    syncManager.enablePeriodicSync()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      syncManager.removeListener(syncStatusListener)
      syncManager.destroy()
    }
  }, [])

  // Handle manual sync button click
  const handleManualSync = () => {
    const syncManager = SyncManager.getInstance()
    syncManager.sync()
  }

  // If no pending items and online, don't show anything
  if (pendingItems === 0 && isOnline && syncStatus !== 'syncing') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {/* Status Badge */}
        <Badge
          variant={
            !isOnline
              ? 'outline'
              : syncStatus === 'syncing'
                ? 'secondary'
                : syncStatus === 'completed'
                  ? 'default'
                  : syncStatus === 'failed'
                    ? 'destructive'
                    : 'outline'
          }
          className="cursor-pointer px-3 py-1 flex items-center gap-2"
          onClick={() => setShowDetails(!showDetails)}
        >
          {!isOnline && (
            <>
              <WifiOff size={14} />
              <span>Offline</span>
            </>
          )}

          {isOnline && syncStatus === 'syncing' && (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Syncing...</span>
            </>
          )}

          {isOnline && syncStatus === 'completed' && pendingItems === 0 && (
            <>
              <Check size={14} />
              <span>Synced</span>
            </>
          )}

          {isOnline && syncStatus === 'failed' && (
            <>
              <AlertTriangle size={14} />
              <span>Sync Failed</span>
            </>
          )}

          {isOnline && pendingItems > 0 && syncStatus !== 'syncing' && (
            <>
              <span>{pendingItems} pending</span>
            </>
          )}
        </Badge>

        {/* Details Panel */}
        {showDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 w-64 border">
            <h4 className="font-medium mb-2">Sync Status</h4>

            <div className="space-y-2 text-sm mb-3">
              <p>
                <span className="font-medium">Status:</span>{' '}
                {!isOnline
                  ? 'Offline'
                  : syncStatus === 'idle'
                    ? 'Idle'
                    : syncStatus === 'syncing'
                      ? 'Syncing'
                      : syncStatus === 'completed'
                        ? 'Completed'
                        : 'Failed'}
              </p>

              {pendingItems > 0 && (
                <p>
                  <span className="font-medium">Pending items:</span> {pendingItems}
                </p>
              )}

              {syncStats.lastSyncTime && (
                <p>
                  <span className="font-medium">Last sync:</span>{' '}
                  {new Date(syncStats.lastSyncTime).toLocaleTimeString()}
                </p>
              )}

              {syncStats.total > 0 && (
                <p>
                  <span className="font-medium">Last sync results:</span> {syncStats.successful}/
                  {syncStats.total} successful
                </p>
              )}
            </div>

            {isOnline && pendingItems > 0 && syncStatus !== 'syncing' && (
              <Button size="sm" className="w-full" onClick={handleManualSync}>
                Sync Now
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
