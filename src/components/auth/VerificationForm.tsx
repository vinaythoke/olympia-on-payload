'use client'

import * as React from 'react'
import { useForm, ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/lib/auth'

const verificationSchema = z.object({
  id_type: z.enum(['pan', 'aadhaar'], {
    required_error: 'Please select an ID type.',
  }),
  id_number: z.string().min(1, 'ID number is required.'),
})

type VerificationFormValues = z.infer<typeof verificationSchema>

const idTypeToVerificationId: Record<string, string> = {
  pan: 'pan_kyc',
  aadhaar: 'aadhaar_offline_kyc', // This might need adjustment based on the exact aadhaar verification needed
}

export function VerificationForm() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      id_number: '',
    },
  })

  const onSubmit = async (data: VerificationFormValues) => {
    setIsLoading(true)
    toast.info('Submitting verification request...')

    try {
      const response = await fetch('/api/verification/cashfree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          verification_id: idTypeToVerificationId[data.id_type],
          id_number: data.id_number,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed. Please try again.')
      }

      // The response structure from cashfree will determine what to show here.
      // Assuming a simple success message for now.
      toast.success('Verification request submitted successfully!', {
        description: `Reference ID: ${result.ref_id || 'N/A'}`,
      })
    } catch (error: any) {
      toast.error('An error occurred.', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Submit Document</CardTitle>
            <CardDescription>Select the type of document you want to verify.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="id_type"
              render={({
                field,
              }: {
                field: ControllerRenderProps<VerificationFormValues, 'id_type'>
              }) => (
                <FormItem>
                  <FormLabel>ID Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ID type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pan">PAN</SelectItem>
                      <SelectItem value="aadhaar">Aadhaar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_number"
              render={({
                field,
              }: {
                field: ControllerRenderProps<VerificationFormValues, 'id_number'>
              }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your ID number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
