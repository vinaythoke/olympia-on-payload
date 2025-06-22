'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface Ticket {
  id: string
  name: string
  description: string
  type: 'free' | 'paid' | 'rsvp' | 'protected'
  price?: number
  currency?: string
  remainingQuantity: number
  status: 'active' | 'inactive' | 'sold-out'
  protectionDetails?: {
    protectionType: 'password' | 'pin' | 'code'
  }
}

interface TicketPurchaseFormProps {
  ticket: Ticket
  onSuccess?: (purchaseData: any) => void
  onCancel?: () => void
}

const formSchema = z.object({
  quantity: z.number().int().positive().max(10),
  accessCode: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function TicketPurchaseForm({ ticket, onSuccess, onCancel }: TicketPurchaseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      accessCode: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)
      setError(null)

      // For protected tickets, validate the access code
      if (ticket.type === 'protected' && !data.accessCode) {
        setError('Access code is required for this ticket')
        setLoading(false)
        return
      }

      // Submit the purchase request
      const response = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          quantity: data.quantity,
          accessCode: data.accessCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to purchase ticket')
      }

      const purchaseData = await response.json()

      // Call the success callback with the purchase data
      if (onSuccess) {
        onSuccess(purchaseData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    })
    return formatter.format(price)
  }

  const getButtonText = () => {
    switch (ticket.type) {
      case 'free':
        return loading ? 'Reserving...' : 'Get Ticket'
      case 'paid':
        return loading ? 'Processing...' : 'Purchase'
      case 'rsvp':
        return loading ? 'Reserving...' : 'RSVP'
      case 'protected':
        return loading ? 'Verifying...' : 'Submit'
      default:
        return 'Submit'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{ticket.name}</h3>
      {ticket.type === 'paid' && ticket.price && (
        <p className="text-xl font-bold mb-4">{formatPrice(ticket.price, ticket.currency)}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <select
            id="quantity"
            {...register('quantity', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={loading}
          >
            {[...Array(Math.min(ticket.remainingQuantity, 10))].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {ticket.type === 'protected' && (
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
              {ticket.protectionDetails?.protectionType === 'password'
                ? 'Password'
                : ticket.protectionDetails?.protectionType === 'pin'
                  ? 'PIN'
                  : 'Access Code'}
            </label>
            <input
              type="text"
              id="accessCode"
              {...register('accessCode')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {getButtonText()}
          </button>
        </div>
      </form>
    </div>
  )
}
