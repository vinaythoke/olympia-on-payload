'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, QrCode, CheckCircle, XCircle, AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { QrReader } from 'react-qr-reader'
import Webcam from 'react-webcam'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { storeOfflineCheckIn, syncOfflineCheckIns } from '@/lib/offlineStorage'
import { Badge } from '@/components/ui/badge'

// Participant data interface
interface Participant {
  name: string
  ticketId: string
  status: 'valid' | 'invalid' | 'already_checked_in' | 'checked_in'
  event?: string
}

export function CheckInInterface() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<Participant | null>(null)
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0)
  const webcamRef = useRef<Webcam>(null)
  const { token, user } = useAuth()

  // Check network status on mount and set up listeners
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Initial check
    updateOnlineStatus()

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Check for pending offline check-ins
    checkPendingOfflineActions()

    // Clean up
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Check for pending offline actions
  const checkPendingOfflineActions = async () => {
    try {
      // Use the IndexedDB API to count pending offline check-ins
      const db = await window.indexedDB.open('olympia-offline', 1)

      db.onsuccess = () => {
        const database = db.result
        const transaction = database.transaction(['offline-check-ins'], 'readonly')
        const store = transaction.objectStore('offline-check-ins')
        const countRequest = store.count()

        countRequest.onsuccess = () => {
          setPendingSyncCount(countRequest.result)
        }
      }
    } catch (error) {
      console.error('Error checking pending offline actions:', error)
    }
  }

  // Sync offline check-ins when back online
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      handleSyncOfflineData()
    }
  }, [isOnline, pendingSyncCount])

  const handleSyncOfflineData = async () => {
    if (!isOnline || pendingSyncCount === 0) return

    setIsSyncing(true)

    try {
      const success = await syncOfflineCheckIns()

      if (success) {
        toast.success(`Successfully synced ${pendingSyncCount} offline check-ins`)
        setPendingSyncCount(0)
      } else {
        toast.error('Some check-ins failed to sync. Will retry later.')
        // Recheck the count
        checkPendingOfflineActions()
      }
    } catch (error) {
      console.error('Error syncing offline data:', error)
      toast.error('Failed to sync offline data. Will retry later.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleStartScan = () => {
    setIsScanning(true)
    setScanResult(null)
    setPhoto(null)
  }

  const handleCancelScan = () => {
    setIsScanning(false)
  }

  const handleScanSuccess = (result: any, error: any) => {
    if (!!result) {
      setIsScanning(false)

      // Get the QR code data
      const ticketId = result?.getText()

      // Set initial scan result
      setScanResult({
        name: 'Validating...',
        ticketId: ticketId,
        status: 'valid',
      })

      // Next step is to take a photo
      setIsTakingPhoto(true)
    }

    if (!!error) {
      console.error('QR Scan error:', error)
    }
  }

  const handlePhotoCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setPhoto(imageSrc)
      setIsTakingPhoto(false)

      // Submit check-in with photo
      if (scanResult) {
        handleCheckInSubmit(scanResult.ticketId, imageSrc)
      }
    }
  }

  const handleRetakePhoto = () => {
    setPhoto(null)
    setIsTakingPhoto(true)
  }

  const handleCheckInSubmit = async (ticketId: string, photoData: string) => {
    if (!token) {
      toast.error('You must be logged in to perform check-ins')
      return
    }

    setIsSubmitting(true)

    // If offline, store the check-in for later sync
    if (!isOnline) {
      try {
        await storeOfflineCheckIn({
          ticketId,
          photoData,
          timestamp: Date.now(),
          userId: user?.id || '',
          eventId: '', // We don't know the event ID from the QR code alone
        })

        // Update pending count
        setPendingSyncCount((prev) => prev + 1)

        // Show success message
        setScanResult({
          name: 'Offline Check-in',
          ticketId: ticketId,
          status: 'checked_in',
          event: 'Will sync when online',
        })

        toast.success('Check-in saved for syncing when back online')
      } catch (error) {
        console.error('Failed to store offline check-in:', error)
        toast.error('Failed to save offline check-in')
        setScanResult({
          name: 'Error',
          ticketId: ticketId,
          status: 'invalid',
          event: 'Unknown',
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // If online, proceed with normal check-in
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          photoData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Ticket already checked in
          setScanResult({
            name: data.ticketPurchase.purchaser?.name || 'Unknown',
            ticketId: ticketId,
            status: 'already_checked_in',
            event: data.ticketPurchase.event?.title || 'Unknown Event',
          })
          toast.error('This ticket has already been used for entry')
        } else {
          // Other error
          setScanResult({
            name: 'Error',
            ticketId: ticketId,
            status: 'invalid',
            event: 'Unknown',
          })
          toast.error(data.error || 'Failed to check in participant')
        }
      } else {
        // Success
        setScanResult({
          name: data.ticketPurchase.purchaser?.name || 'Unknown',
          ticketId: ticketId,
          status: 'checked_in',
          event: data.ticketPurchase.event?.title || 'Unknown Event',
        })
        toast.success('Participant successfully checked in!')
      }
    } catch (error) {
      console.error('Check-in error:', error)

      // If the error is due to network connectivity, try to store offline
      if (!navigator.onLine) {
        setIsOnline(false)
        handleCheckInSubmit(ticketId, photoData) // Retry as offline
        return
      }

      toast.error('Failed to connect to the server. Please try again.')
      setScanResult({
        name: 'Connection Error',
        ticketId: ticketId,
        status: 'invalid',
        event: 'Unknown',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setScanResult(null)
    setPhoto(null)
    setIsScanning(false)
    setIsTakingPhoto(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Event Check-In</CardTitle>
          {!isOnline && (
            <Badge
              variant="outline"
              className="bg-yellow-100 text-yellow-800 flex items-center gap-1"
            >
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Offline pending sync notification */}
        {pendingSyncCount > 0 && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <div className="flex justify-between items-center">
              <span>
                {pendingSyncCount} check-in{pendingSyncCount !== 1 ? 's' : ''} pending sync
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncOfflineData}
                disabled={!isOnline || isSyncing}
                className="h-7 text-xs"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        )}

        {!isScanning && !scanResult && !isTakingPhoto && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center mb-4">
              Scan a participant's ticket QR code to check them in
              {!isOnline && (
                <span className="block text-sm text-yellow-600 mt-1">
                  Working offline. Check-ins will sync when you're back online.
                </span>
              )}
            </p>
            <Button onClick={handleStartScan} className="w-full">
              <QrCode className="mr-2 h-4 w-4" /> Start Scanning
            </Button>
          </div>
        )}

        {isScanning && (
          <div>
            <p className="mb-4 text-center">Position the QR code within the frame</p>
            <QrReader
              onResult={handleScanSuccess}
              constraints={{ facingMode: 'environment' }}
              containerStyle={{ width: '100%', height: '300px' }}
              videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Button variant="outline" onClick={handleCancelScan} className="w-full mt-4">
              Cancel Scan
            </Button>
          </div>
        )}

        {isTakingPhoto && (
          <div>
            <p className="mb-4 text-center">Take a photo of the participant</p>
            <div className="relative w-full h-[300px] bg-black mb-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'environment' }}
                className="w-full h-full object-cover"
              />
            </div>
            <Button onClick={handlePhotoCapture} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
          </div>
        )}

        {photo && scanResult && !isSubmitting && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full h-[200px] bg-black mb-4">
              <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            </div>

            <div className="w-full p-4 border rounded-md mb-4">
              <div className="flex items-center gap-2 mb-2">
                {scanResult.status === 'checked_in' && (
                  <CheckCircle className="text-green-500 h-6 w-6" />
                )}
                {scanResult.status === 'already_checked_in' && (
                  <AlertCircle className="text-amber-500 h-6 w-6" />
                )}
                {scanResult.status === 'invalid' && <XCircle className="text-red-500 h-6 w-6" />}
                <h3 className="font-semibold text-lg">
                  {scanResult.status === 'checked_in' && 'Successfully Checked In!'}
                  {scanResult.status === 'already_checked_in' && 'Already Checked In'}
                  {scanResult.status === 'invalid' && 'Invalid Ticket'}
                </h3>
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {scanResult.name}
                </p>
                <p>
                  <strong>Ticket:</strong> {scanResult.ticketId}
                </p>
                <p>
                  <strong>Event:</strong> {scanResult.event || 'Unknown'}
                </p>
                {!isOnline && scanResult.status === 'checked_in' && (
                  <p className="text-yellow-600 mt-2 flex items-center gap-1">
                    <WifiOff className="h-3 w-3" /> Saved offline (will sync when online)
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleRetakePhoto} className="flex-1">
                Retake Photo
              </Button>
              <Button onClick={handleReset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" /> New Check-In
              </Button>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-spin">
              <RefreshCw className="h-8 w-8" />
            </div>
            <p>{!isOnline ? 'Saving offline...' : 'Processing check-in...'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
