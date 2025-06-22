'use client'

import React, { useState, useEffect } from 'react'
import { FormDefinition, FormField } from './FormFieldTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface FormRendererProps {
  formDefinition: FormDefinition
  onSubmit: (formData: any) => void
  isSubmitting?: boolean
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formDefinition,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    // Initialize form data with default values
    const initialData: any = {}
    formDefinition.fields.forEach((field) => {
      initialData[field.fieldId] = field.defaultValue || ''
    })
    setFormData(initialData)
  }, [formDefinition])

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [fieldId]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const renderField = (field: FormField) => {
    const { fieldId, fieldType, fieldLabel, placeholder, required, helpText, options } = field

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {required && '*'}
            </Label>
            <Input
              id={fieldId}
              type={fieldType === 'phone' ? 'tel' : fieldType}
              placeholder={placeholder}
              required={required}
              value={formData[fieldId] || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(fieldId, e.target.value)
              }
            />
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
        )
      case 'textarea':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {required && '*'}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={placeholder}
              required={required}
              value={formData[fieldId] || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange(fieldId, e.target.value)
              }
            />
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
        )
      case 'checkbox':
        return (
          <div key={fieldId} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={formData[fieldId] || false}
              onCheckedChange={(checked: boolean) => handleChange(fieldId, checked)}
            />
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {required && '*'}
            </Label>
          </div>
        )
      case 'radio':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {fieldLabel}
              {required && '*'}
            </Label>
            <RadioGroup
              value={formData[fieldId]}
              onValueChange={(value: string) => handleChange(fieldId, value)}
            >
              {options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                  <Label htmlFor={`${fieldId}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
        )
      case 'select':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {fieldLabel}
              {required && '*'}
            </Label>
            <Select
              value={formData[fieldId]}
              onValueChange={(value: string) => handleChange(fieldId, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
        )
      // 'multiselect' and 'file' types would need more complex state management
      // and are omitted here for simplicity in this step.
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formDefinition.fields.map(renderField)}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {formDefinition.formSettings.submitButtonText || 'Submit'}
      </Button>
    </form>
  )
}
