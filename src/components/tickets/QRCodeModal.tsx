'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface QRCodeModalProps {
  ticketPurchaseId: number
}

export function QRCodeModal({ ticketPurchaseId }: QRCodeModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View QR Code</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Ticket QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img
            src={`/api/tickets/qr/${ticketPurchaseId}`}
            alt="Ticket QR Code"
            width={256}
            height={256}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 