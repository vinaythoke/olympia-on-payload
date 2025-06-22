import React from 'react';
import { FormField, FieldType } from './FormFieldTypes';

interface FormPreviewProps {
  fields: FormField[];
  layoutSettings: {
    layout: 'stacked' | 'grid';
    showLabels: boolean;
    showPlaceholders: boolean;
    showHelpText: boolean;
  };
  formSettings: {
    submitButtonText: string;
  };
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  fields,
  layoutSettings,
  formSettings,
}) => {
  const renderField = (field: FormField) => {
    const {
      fieldId,
      fieldType,
      fieldLabel,
      placeholder,
      required,
      helpText,
      width,
      options,
    } = field;

    // Common field props
    const commonProps = {
      id: fieldId,
      name: fieldId,
      placeholder: layoutSettings.showPlaceholders ? placeholder : undefined,
      required,
      className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50",
    };

    let inputField;

    switch (fieldType) {
      case 'text':
        inputField = <input type="text" {...commonProps} />;
        break;
      case 'textarea':
        inputField = (
          <textarea
            {...commonProps}
            rows={4}
          />
        );
        break;
      case 'number':
        inputField = <input type="number" {...commonProps} />;
        break;
      case 'email':
        inputField = <input type="email" {...commonProps} />;
        break;
      case 'phone':
        inputField = <input type="tel" {...commonProps} />;
        break;
      case 'date':
        inputField = <input type="date" {...commonProps} />;
        break;
      case 'checkbox':
        inputField = (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={fieldId}
              name={fieldId}
              className="rounded text-blue-500 focus:ring-blue-400 h-5 w-5"
            />
            {layoutSettings.showLabels && (
              <label htmlFor={fieldId} className="ml-2 block font-medium text-gray-700">
                {fieldLabel}
                {required && <span className="ml-1 text-red-500">*</span>}
              </label>
            )}
          </div>
        );
        break;
      case 'select':
        inputField = (
          <select {...commonProps}>
            <option value="">{layoutSettings.showPlaceholders ? placeholder || 'Select...' : 'Select...'}</option>
            {options?.map((option, i) => (
              <option key={i} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;
      case 'multiselect':
        inputField = (
          <select {...commonProps} multiple size={Math.min(5, options?.length || 3)}>
            {options?.map((option, i) => (
              <option key={i} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;
      case 'radio':
        inputField = (
          <div className="mt-1 space-y-2">
            {options?.map((option, i) => (
              <div key={i} className="flex items-center">
                <input
                  type="radio"
                  id={`${fieldId}-${i}`}
                  name={fieldId}
                  value={option.value}
                  className="text-blue-500 focus:ring-blue-400 h-4 w-4"
                />
                <label htmlFor={`${fieldId}-${i}`} className="ml-2 block font-medium text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        break;
      case 'file':
        inputField = (
          <input
            type="file"
            id={fieldId}
            name={fieldId}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        );
        break;
      default:
        inputField = <input type="text" {...commonProps} />;
    }

    // Don't show label twice for checkbox
    const shouldShowLabel = layoutSettings.showLabels && fieldType !== 'checkbox';

    return (
      <div
        key={fieldId}
        className={`mb-4 ${width === 'half' ? 'w-1/2 px-2' : 'w-full'}`}
      >
        {shouldShowLabel && (
          <label htmlFor={fieldId} className="block font-medium text-gray-700 mb-1">
            {fieldLabel}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        {inputField}
        {layoutSettings.showHelpText && helpText && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  };

  const wrapperClassName = layoutSettings.layout === 'grid'
    ? 'flex flex-wrap -mx-2'
    : '';

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="preview-form">
        <div className={wrapperClassName}>
          {fields.map(renderField)}
        </div>
        
        <div className="mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {formSettings.submitButtonText || 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}; 