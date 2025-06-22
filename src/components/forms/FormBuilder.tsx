'use client'

import React, { useState, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { nanoid } from 'nanoid'
import {
  FormField,
  FormDefinition,
  FormBuilderProps,
  FieldType,
  FormSettings,
  LayoutSettings,
  FieldTemplate,
} from './FormFieldTypes'
import { DraggableField } from './DraggableField'
import { FieldConfigPanel } from './FieldConfigPanel'
import { FormPreview } from './FormPreview'

// Default values for new field templates
const FIELD_TEMPLATES: FieldTemplate[] = [
  {
    type: 'text',
    name: 'Text Input',
    icon: '✏️',
    defaultConfig: {
      fieldType: 'text',
      fieldLabel: 'Text Input',
      placeholder: 'Enter text...',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'textarea',
    name: 'Text Area',
    icon: '📝',
    defaultConfig: {
      fieldType: 'textarea',
      fieldLabel: 'Text Area',
      placeholder: 'Enter long text...',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'number',
    name: 'Number',
    icon: '🔢',
    defaultConfig: {
      fieldType: 'number',
      fieldLabel: 'Number',
      placeholder: 'Enter a number',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'email',
    name: 'Email',
    icon: '📧',
    defaultConfig: {
      fieldType: 'email',
      fieldLabel: 'Email',
      placeholder: 'Enter email address',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'phone',
    name: 'Phone',
    icon: '📱',
    defaultConfig: {
      fieldType: 'phone',
      fieldLabel: 'Phone',
      placeholder: 'Enter phone number',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'date',
    name: 'Date',
    icon: '📅',
    defaultConfig: {
      fieldType: 'date',
      fieldLabel: 'Date',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'checkbox',
    name: 'Checkbox',
    icon: '✅',
    defaultConfig: {
      fieldType: 'checkbox',
      fieldLabel: 'Checkbox Option',
      required: false,
      width: 'full',
    },
  },
  {
    type: 'select',
    name: 'Select',
    icon: '🔽',
    defaultConfig: {
      fieldType: 'select',
      fieldLabel: 'Select',
      placeholder: 'Choose an option',
      required: false,
      width: 'full',
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'multiselect',
    name: 'Multi-select',
    icon: '📋',
    defaultConfig: {
      fieldType: 'multiselect',
      fieldLabel: 'Multiple Selection',
      required: false,
      width: 'full',
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' },
      ],
    },
  },
  {
    type: 'radio',
    name: 'Radio Group',
    icon: '⚪',
    defaultConfig: {
      fieldType: 'radio',
      fieldLabel: 'Radio Group',
      required: false,
      width: 'full',
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'file',
    name: 'File Upload',
    icon: '📎',
    defaultConfig: {
      fieldType: 'file',
      fieldLabel: 'File Upload',
      required: false,
      width: 'full',
    },
  },
]

// Default new form definition
const DEFAULT_FORM: FormDefinition = {
  id: '',
  name: 'New Form',
  description: '',
  fields: [],
  formSettings: {
    submitButtonText: 'Submit',
    successMessage: 'Form submitted successfully!',
  },
  layoutSettings: {
    layout: 'stacked',
    showLabels: true,
    showPlaceholders: true,
    showHelpText: true,
  },
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ initialForm, onSave, eventId }) => {
  // Setup form state using initialForm or default values
  const [form, setForm] = useState<FormDefinition>(() => {
    if (initialForm) {
      return initialForm
    }

    return {
      ...DEFAULT_FORM,
      id: nanoid(),
    }
  })

  // Track which field is currently selected
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  // Track whether we're in preview mode
  const [previewMode, setPreviewMode] = useState(false)
  // Track if there are unsaved changes
  const [isDirty, setIsDirty] = useState(false)

  // Find the currently selected field
  const selectedField = form.fields.find((field) => field.fieldId === selectedFieldId)

  // Handler for adding a new field from templates
  const addField = (templateType: FieldType) => {
    const template = FIELD_TEMPLATES.find((t) => t.type === templateType)
    if (!template) return

    const newField: FormField = {
      fieldId: `field_${nanoid(6)}`,
      fieldType: template.type,
      fieldLabel: template.defaultConfig.fieldLabel || 'New Field',
      placeholder: template.defaultConfig.placeholder,
      required: template.defaultConfig.required || false,
      helpText: template.defaultConfig.helpText,
      width: template.defaultConfig.width || 'full',
      validations: {},
      options: template.defaultConfig.options,
    }

    setForm((prevForm) => ({
      ...prevForm,
      fields: [...prevForm.fields, newField],
    }))

    setSelectedFieldId(newField.fieldId)
    setIsDirty(true)
  }

  // Handler for updating an existing field
  const updateField = (updatedField: FormField) => {
    setForm((prevForm) => ({
      ...prevForm,
      fields: prevForm.fields.map((field) =>
        field.fieldId === updatedField.fieldId ? updatedField : field,
      ),
    }))
    setIsDirty(true)
  }

  // Handler for removing a field
  const removeField = (fieldId: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      fields: prevForm.fields.filter((field) => field.fieldId !== fieldId),
    }))

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }

    setIsDirty(true)
  }

  // Handler for reordering fields using drag and drop
  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    setForm((prevForm) => {
      const newFields = [...prevForm.fields]
      const draggedField = newFields[dragIndex]

      newFields.splice(dragIndex, 1)
      newFields.splice(hoverIndex, 0, draggedField)

      return {
        ...prevForm,
        fields: newFields,
      }
    })

    setIsDirty(true)
  }, [])

  // Handler for updating form settings
  const updateFormSettings = (
    settingType: 'formSettings' | 'layoutSettings',
    key: string,
    value: string | boolean,
  ) => {
    setForm((prevForm) => ({
      ...prevForm,
      [settingType]: {
        ...prevForm[settingType],
        [key]: value,
      },
    }))

    setIsDirty(true)
  }

  // Handler for updating form metadata
  const updateFormMeta = (key: 'name' | 'description', value: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      [key]: value,
    }))

    setIsDirty(true)
  }

  // Handler for saving the form
  const handleSave = async () => {
    try {
      await onSave({
        ...form,
        // If we have an event ID, make sure it's included in the form
        ...(eventId ? { event: { id: eventId, title: 'Event' } } : {}),
      })
      setIsDirty(false)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('There was an error saving your form. Please try again.')
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-gray-50 min-h-screen p-6">
        {/* Form Builder Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {initialForm ? 'Edit Form' : 'Create New Form'}
            </h1>
            <p className="text-gray-600">
              Drag and drop to build your form, or choose from templates
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {previewMode ? 'Edit Form' : 'Preview Form'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Form
            </button>
          </div>
        </div>

        {/* Form Metadata */}
        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="formName" className="block font-medium text-gray-700 mb-1">
                Form Name
              </label>
              <input
                type="text"
                id="formName"
                value={form.name}
                onChange={(e) => updateFormMeta('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label htmlFor="formDescription" className="block font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="formDescription"
                value={form.description || ''}
                onChange={(e) => updateFormMeta('description', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        {previewMode ? (
          // Form Preview Mode
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Form Preview</h2>
            <FormPreview
              fields={form.fields}
              formSettings={form.formSettings}
              layoutSettings={form.layoutSettings}
            />
          </div>
        ) : (
          // Form Builder Mode
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Field Templates Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Add Field</h2>

                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TEMPLATES.map((template) => (
                    <button
                      key={template.type}
                      type="button"
                      onClick={() => addField(template.type)}
                      className="p-3 border border-gray-200 rounded text-center hover:bg-gray-50"
                    >
                      <div className="text-xl mb-1">{template.icon}</div>
                      <div className="text-sm">{template.name}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="font-bold text-md mb-3">Form Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="submitButtonText"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Submit Button Text
                      </label>
                      <input
                        type="text"
                        id="submitButtonText"
                        value={form.formSettings.submitButtonText}
                        onChange={(e) =>
                          updateFormSettings('formSettings', 'submitButtonText', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="formLayout"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Form Layout
                      </label>
                      <select
                        id="formLayout"
                        value={form.layoutSettings.layout}
                        onChange={(e) =>
                          updateFormSettings('layoutSettings', 'layout', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm"
                      >
                        <option value="stacked">Stacked</option>
                        <option value="grid">Grid</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showLabels"
                        checked={form.layoutSettings.showLabels}
                        onChange={(e) =>
                          updateFormSettings('layoutSettings', 'showLabels', e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="showLabels" className="ml-2 block text-sm text-gray-700">
                        Show Field Labels
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showPlaceholders"
                        checked={form.layoutSettings.showPlaceholders}
                        onChange={(e) =>
                          updateFormSettings('layoutSettings', 'showPlaceholders', e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label
                        htmlFor="showPlaceholders"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Show Placeholders
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showHelpText"
                        checked={form.layoutSettings.showHelpText}
                        onChange={(e) =>
                          updateFormSettings('layoutSettings', 'showHelpText', e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="showHelpText" className="ml-2 block text-sm text-gray-700">
                        Show Help Text
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Building Area */}
            <div className="lg:col-span-5">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[400px]">
                <h2 className="font-bold text-lg mb-4">Form Structure</h2>

                {form.fields.length === 0 ? (
                  <div className="h-60 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500">
                        Your form is empty. Add fields from the left panel.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.fields.map((field, index) => (
                      <DraggableField
                        key={field.fieldId}
                        field={field}
                        index={index}
                        moveField={moveField}
                        onSelect={setSelectedFieldId}
                        isSelected={selectedFieldId === field.fieldId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Field Configuration Panel */}
            <div className="lg:col-span-4">
              {selectedField ? (
                <FieldConfigPanel
                  field={selectedField}
                  updateField={updateField}
                  removeField={removeField}
                />
              ) : (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
                  <p className="text-gray-500">Select a field to configure its properties.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  )
}
