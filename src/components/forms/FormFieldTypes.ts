// Define general field validation types
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  customErrorMessage?: string;
}

// Define individual options for select, multi-select and radio fields
export interface FieldOption {
  label: string;
  value: string;
}

// Base interface for all field types
export interface FormField {
  fieldId: string;
  fieldType: FieldType;
  fieldLabel: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  width: 'full' | 'half';
  validations?: FieldValidation;
  options?: FieldOption[];
  defaultValue?: any;
}

// All supported field types
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'file';

// Form layout settings
export interface LayoutSettings {
  layout: 'stacked' | 'grid';
  showLabels: boolean;
  showPlaceholders: boolean;
  showHelpText: boolean;
}

// Form submission settings
export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectAfterSubmit?: string;
}

// Complete form definition
export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  event?: { id: string; title: string };
  fields: FormField[];
  formSettings: FormSettings;
  layoutSettings: LayoutSettings;
}

// Type for form field response data
export interface FormResponse {
  [fieldId: string]: string | string[] | boolean | File | File[];
}

// Submission data type
export interface FormSubmission {
  id: string;
  submissionID: string;
  formData: FormResponse;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Drag and drop context types
export interface DragItem {
  index: number;
  id: string;
  type: string;
  field: FormField;
}

// Defines a field template for adding to the form
export interface FieldTemplate {
  type: FieldType;
  name: string;
  icon: string;
  defaultConfig: Partial<FormField>;
}

// Field configuration panel props
export interface FieldConfigProps {
  field: FormField;
  updateField: (field: FormField) => void;
  removeField: (fieldId: string) => void;
}

// Form builder component props
export interface FormBuilderProps {
  initialForm?: FormDefinition;
  onSave: (form: FormDefinition) => Promise<void>;
  eventId?: string; // Optional event ID to link this form to
} 