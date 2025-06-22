'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormRenderer } from '../forms/FormRenderer'
import { FormDefinition } from '../forms/FormFieldTypes'
import { toast } from 'sonner'
import { TicketSelection } from './TicketSelection'
import { useAuth } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

// Step 1
const TicketSelectionStep = ({
  eventId,
  onNext,
}: {
  eventId: string
  onNext: (data: { tickets: { ticketId: string; quantity: number }[] }) => void
}) => {
  const [selection, setSelection] = useState<Record<string, number>>({})

  const handleNext = () => {
    const finalSelection = Object.entries(selection)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketId, quantity]) => ({ ticketId, quantity }))

    if (finalSelection.length === 0) {
      toast.error('No tickets selected', {
        description: 'Please select at least one ticket to continue.',
      })
      return
    }
    onNext({ tickets: finalSelection })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Step 1: Select Tickets</h2>
      <p className="text-muted-foreground">Choose your tickets for the event.</p>
      <div className="mt-6">
        <TicketSelection eventId={eventId} onSelectionChange={setSelection} />
      </div>
      <Button onClick={handleNext} className="mt-4">
        Next
      </Button>
    </div>
  )
}

// Step 2
const PersonalInformationStep = ({
  eventId,
  onNext,
  onBack,
}: {
  eventId: string
  onNext: (data: { formResponses: any }) => void
  onBack: () => void
}) => {
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchFormDefinition = async () => {
      try {
        setLoading(true)
        const eventRes = await fetch(`/api/events/${eventId}`)
        if (!eventRes.ok) throw new Error('Failed to fetch event details')
        const eventData = await eventRes.json()
        const formId = eventData.event?.registrationForm

        if (!formId) {
          onNext({ formResponses: {} }) // No form, proceed with empty data
          return
        }

        const formRes = await fetch(`/api/forms/${formId}`)
        if (!formRes.ok) throw new Error('Failed to fetch form definition')
        const formData = await formRes.json()
        setFormDefinition(formData.form)
      } catch (error) {
        toast.error('Error loading registration form', {
          description:
            error instanceof Error ? error.message : 'Could not load the form for this event.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFormDefinition()
  }, [eventId, onNext])

  const handleFormSubmit = (formData: any) => {
    setIsSubmitting(true)
    console.log('Form data submitted:', formData)
    onNext({ formResponses: formData })
    setIsSubmitting(false)
  }

  if (loading) {
    return <div>Loading form...</div>
  }

  if (!formDefinition) {
    // This case is handled in the fetch logic, but as a fallback:
    return <div>No registration form is set for this event. You can proceed.</div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Step 2: Your Information</h2>
      <p className="text-muted-foreground">Please fill out your details.</p>
      <div className="mt-6">
        <FormRenderer
          formDefinition={formDefinition}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}

// Step 3 (placeholder)
const PaymentStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <div>
    <h2 className="text-xl font-semibold">Step 3: Payment</h2>
    <p className="text-muted-foreground">This is a placeholder. For now, no payment is required.</p>
    <div className="flex justify-between mt-4">
      <Button variant="outline" onClick={onBack}>
        Back
      </Button>
      <Button onClick={onNext}>Next</Button>
    </div>
  </div>
)

// Step 4
const ConfirmationStep = ({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  formData: any
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) => (
  <div>
    <h2 className="text-xl font-semibold">Step 4: Confirmation</h2>
    <p className="text-muted-foreground">Review your registration details.</p>
    <div className="mt-4 space-y-4">
      <div>
        <h3 className="font-medium">Selected Tickets</h3>
        <ul>
          {formData.tickets?.map((ticket: any) => (
            <li key={ticket.ticketId}>
              - {ticket.quantity}x Ticket ID: {ticket.ticketId}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium">Your Information</h3>
        <pre className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
          {JSON.stringify(formData.formResponses, null, 2)}
        </pre>
      </div>
    </div>
    <div className="flex justify-between mt-6">
      <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
        Back
      </Button>
      <Button onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Confirm Registration
      </Button>
    </div>
  </div>
)

// Step 5 (new)
const CompletionStep = () => (
  <div className="text-center">
    <h2 className="text-2xl font-bold text-green-600">Registration Complete!</h2>
    <p className="text-muted-foreground mt-2">
      Thank you for registering. You will receive a confirmation email shortly.
    </p>
    <Button asChild className="mt-6">
      <a href="/events">Back to Events</a>
    </Button>
  </div>
)

interface RegistrationFormProps {
  eventId: string
}

export function RegistrationForm({ eventId }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const totalSteps = 5 // Increased to 5
  const { token } = useAuth()

  const nextStep = (data?: any) => {
    if (data) {
      setFormData((prev: any) => ({ ...prev, ...data }))
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRegistrationSubmit = async () => {
    if (!token) {
      toast.error('Authentication Error', {
        description: 'You must be logged in to register for an event.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit registration.')
      }

      toast.success('Registration Successful!', {
        description: 'Your registration has been confirmed.',
      })

      nextStep() // Move to completion step
    } catch (error) {
      toast.error('Registration Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TicketSelectionStep eventId={eventId} onNext={nextStep} />
      case 2:
        return <PersonalInformationStep eventId={eventId} onNext={nextStep} onBack={prevStep} />
      case 3:
        return <PaymentStep onNext={nextStep} onBack={prevStep} />
      case 4:
        return (
          <ConfirmationStep
            formData={formData}
            onBack={prevStep}
            onSubmit={handleRegistrationSubmit}
            isSubmitting={isSubmitting}
          />
        )
      case 5:
        return <CompletionStep />
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Event Registration</CardTitle>
        {currentStep < totalSteps && (
          <CardDescription>
            Step {currentStep} of {totalSteps - 1}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{renderStep()}</CardContent>
    </Card>
  )
}
