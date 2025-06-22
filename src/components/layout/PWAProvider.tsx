'use client'

import React, { useEffect, useState } from 'react'
import { registerServiceWorker, setupNetworkStatusMonitoring } from '@/lib/serviceWorker'
import { Badge } from '@/components/ui/badge'
import { SyncStatusIndicator } from './SyncStatusIndicator'

interface PWAProviderProps {
  children: React.ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [showNetworkStatus, setShowNetworkStatus] = useState<boolean>(false)

  useEffect(() => {
    // Register service worker
    const wb = registerServiceWorker()

    // Setup network monitoring
    setupNetworkStatusMonitoring((online) => {
      setIsOnline(online)
      setShowNetworkStatus(true)

      // Hide the network status indicator after 5 seconds
      setTimeout(() => {
        setShowNetworkStatus(false)
      }, 5000)
    })

    return () => {
      // Cleanup if needed
    }
  }, [])

  return (
    <>
      {children}

      {/* Network status indicator */}
      {showNetworkStatus && (
        <div
          className={`fixed bottom-4 left-4 z-50 transition-opacity duration-300 ${showNetworkStatus ? 'opacity-100' : 'opacity-0'}`}
        >
          <Badge variant={isOnline ? 'default' : 'destructive'} className="px-3 py-1">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      )}

      {/* Sync status indicator */}
      <SyncStatusIndicator />
    </>
  )
}
