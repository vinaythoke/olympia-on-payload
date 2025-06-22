'use client'

import React, { useState } from 'react'
import { FormField, FieldType, FieldOption, FieldConfigProps } from './FormFieldTypes'

export const FieldConfigPanel: React.FC<FieldConfigProps> = ({
  field,
  updateField,
  removeField,
}) => {
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')

  // Update a specific field property
  const handleFieldChange = (name: keyof FormField, value: any) => {
    updateField({ ...field, [name]: value })
  }

  // Update nested validation property
  const handleValidationChange = (name: string, value: any) => {
    const validations = { ...field.validations, [name]: value }
    updateField({ ...field, validations })
  }

  // Add a new option to select/radio/multiselect fields
  const addOption = () => {
    if (!newOptionLabel.trim() || !newOptionValue.trim()) return

    const newOption: FieldOption = {
      label: newOptionLabel,
      value: newOptionValue,
    }

    const updatedOptions = [...(field.options || []), newOption]
    updateField({ ...field, options: updatedOptions })

    // Reset inputs
    setNewOptionLabel('')
    setNewOptionValue('')
  }

  // Remove an option at specific index
  const removeOption = (index: number) => {
    if (!field.options) return

    const updatedOptions = [...field.options]
    updatedOptions.splice(index, 1)
    updateField({ ...field, options: updatedOptions })
  }

  // Determine if we should show options interface
  const showOptions = ['select', 'multiselect', 'radio'].includes(field.fieldType)

  // Determine which validation fields to show based on field type
  const showTextValidations = ['text', 'textarea', 'email', 'phone'].includes(field.fieldType)
  const showNumberValidations = field.fieldType === 'number'

  return (
    <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
      <h3 className="font-bold text-lg mb-4">Configure Field</h3>

      <div className="space-y-4">
        {/* Field Type */}
        <div>
          <label htmlFor="fieldType" className="block font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <select
            id="fieldType"
            value={field.fieldType}
            onChange={(e) => handleFieldChange('fieldType', e.target.value as FieldType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="text">Text Input</option>
            <option value="textarea">Text Area</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="date">Date</option>
            <option value="checkbox">Checkbox</option>
            <option value="select">Select Dropdown</option>
            <option value="multiselect">Multi-select</option>
            <option value="radio">Radio Group</option>
            <option value="file">File Upload</option>
          </select>
        </div>

        {/* Field Label */}
        <div>
          <label htmlFor="fieldLabel" className="block font-medium text-gray-700 mb-1">
            Field Label
          </label>
          <input
            type="text"
            id="fieldLabel"
            value={field.fieldLabel || ''}
            onChange={(e) => handleFieldChange('fieldLabel', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Placeholder - Only for text-like fields */}
        {['text', 'textarea', 'number', 'email', 'phone', 'date'].includes(field.fieldType) && (
          <div>
            <label htmlFor="placeholder" className="block font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              id="placeholder"
              value={field.placeholder || ''}
              onChange={(e) => handleFieldChange('placeholder', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
        )}

        {/* Help Text */}
        <div>
          <label htmlFor="helpText" className="block font-medium text-gray-700 mb-1">
            Help Text
          </label>
          <input
            type="text"
            id="helpText"
            value={field.helpText || ''}
            onChange={(e) => handleFieldChange('helpText', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
          <p className="mt-1 text-xs text-gray-500">Displayed below the field</p>
        </div>

        {/* Required */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={field.required}
            onChange={(e) => handleFieldChange('required', e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label htmlFor="required" className="ml-2 block font-medium text-gray-700">
            Required Field
          </label>
        </div>

        {/* Field Width */}
        <div>
          <label htmlFor="width" className="block font-medium text-gray-700 mb-1">
            Field Width
          </label>
          <select
            id="width"
            value={field.width}
            onChange={(e) => handleFieldChange('width', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
          </select>
        </div>

        {/* Validations - Text fields */}
        {showTextValidations && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">Validation Options</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minLength" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Length
                </label>
                <input
                  type="number"
                  id="minLength"
                  value={field.validations?.minLength || ''}
                  onChange={(e) =>
                    handleValidationChange(
                      'minLength',
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  id="maxLength"
                  value={field.validations?.maxLength || ''}
                  onChange={(e) =>
                    handleValidationChange(
                      'maxLength',
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="0"
                />
              </div>
            </div>

            {/* Pattern for text/email/phone */}
            <div className="mt-4">
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">
                Regex Pattern
              </label>
              <input
                type="text"
                id="pattern"
                value={field.validations?.pattern || ''}
                onChange={(e) => handleValidationChange('pattern', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Regular expression pattern for validation
              </p>
            </div>
          </div>
        )}

        {/* Validations - Number fields */}
        {showNumberValidations && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">Validation Options</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  id="minValue"
                  value={field.validations?.minValue || ''}
                  onChange={(e) =>
                    handleValidationChange(
                      'minValue',
                      e.target.value ? parseFloat(e.target.value) : null,
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>

              <div>
                <label htmlFor="maxValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  id="maxValue"
                  value={field.validations?.maxValue || ''}
                  onChange={(e) =>
                    handleValidationChange(
                      'maxValue',
                      e.target.value ? parseFloat(e.target.value) : null,
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Custom Error Message */}
        {(showTextValidations || showNumberValidations) && (
          <div>
            <label
              htmlFor="customErrorMessage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Custom Error Message
            </label>
            <input
              type="text"
              id="customErrorMessage"
              value={field.validations?.customErrorMessage || ''}
              onChange={(e) => handleValidationChange('customErrorMessage', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">Shown when validation fails</p>
          </div>
        )}

        {/* Options for select/multiselect/radio */}
        {showOptions && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">Options</h4>

            {/* Existing Options */}
            {field.options && field.options.length > 0 && (
              <ul className="mb-4 space-y-2">
                {field.options.map((option, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="ml-2 text-gray-500 text-sm">({option.value})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add New Option */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label
                  htmlFor="optionLabel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Label
                </label>
                <input
                  type="text"
                  id="optionLabel"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="optionValue"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Value
                </label>
                <input
                  type="text"
                  id="optionValue"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addOption}
              disabled={!newOptionLabel.trim() || !newOptionValue.trim()}
              className={`mt-2 px-4 py-2 rounded-md text-sm ${
                !newOptionLabel.trim() || !newOptionValue.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Add Option
            </button>
          </div>
        )}

        {/* Delete Field Button */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            type="button"
            onClick={() => removeField(field.fieldId)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm"
          >
            Delete Field
          </button>
        </div>
      </div>
    </div>
  )
}
