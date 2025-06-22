# Form Builder Documentation

## Overview

The Form Builder is a visual drag-and-drop interface that allows event organizers to create custom registration forms for their events. It provides a user-friendly way to design forms without writing code, with support for various field types, validation rules, and layout options.

## Architecture

The Form Builder consists of the following components:

1. **FormFieldTypes.ts**: TypeScript interfaces for form fields and related types
2. **DraggableField.tsx**: Draggable field component for the form builder interface
3. **FieldConfigPanel.tsx**: Configuration panel for editing field properties
4. **FormPreview.tsx**: Preview component for visualizing the form
5. **FormBuilder.tsx**: Main component orchestrating the form building experience

These components work together with Payload CMS collections:

1. **FormBuilder.ts**: Collection for storing form definitions
2. **FormSubmission.ts**: Collection for storing form responses

## Components

### FormFieldTypes.ts

This file defines the TypeScript interfaces used throughout the form builder:

- `FormField`: Base interface for all field types
- `FieldType`: Union type of all supported field types
- `FieldValidation`: Interface for field validation rules
- `FieldOption`: Interface for select/radio/multiselect options
- `FormDefinition`: Complete form definition structure
- `FormSettings`: Form submission settings
- `LayoutSettings`: Form layout settings
- `FormResponse`: Type for form field response data
- `FormSubmission`: Submission data type
- `DragItem`: Type for drag and drop operations
- `FieldTemplate`: Template for adding fields to the form
- `FieldConfigProps`: Props for the field configuration panel
- `FormBuilderProps`: Props for the form builder component

### DraggableField.tsx

This component renders a form field that can be dragged and reordered within the form builder. It uses React DnD (Drag and Drop) for the interaction.

**Props:**
- `field`: The field configuration object
- `index`: Position in the fields array
- `moveField`: Function to reorder fields
- `onSelect`: Function called when field is selected
- `isSelected`: Whether this field is currently selected

### FieldConfigPanel.tsx

This component provides a UI for configuring a selected form field. It dynamically renders different options based on the field type.

**Props:**
- `field`: The field being configured
- `updateField`: Function to update the field configuration
- `removeField`: Function to remove the field from the form

**Features:**
- Field type selection
- Label and placeholder configuration
- Help text customization
- Required field toggle
- Width selection (full/half)
- Validation options based on field type
- Option management for select/radio/multiselect fields

### FormPreview.tsx

This component renders a preview of the form based on the current configuration.

**Props:**
- `fields`: Array of form fields
- `layoutSettings`: Form layout settings
- `formSettings`: Form submission settings

**Features:**
- Renders different field types appropriately
- Respects layout settings (stacked/grid)
- Shows/hides labels, placeholders, and help text based on settings
- Renders submit button with custom text

### FormBuilder.tsx

This is the main component that orchestrates the entire form building experience.

**Props:**
- `initialForm`: Optional initial form configuration
- `onSave`: Function to save the form
- `eventId`: Optional event ID to link the form to

**Features:**
- Drag-and-drop field reordering
- Field template selection
- Field configuration
- Form preview mode
- Form metadata editing
- Form settings configuration
- Form persistence

## Database Collections

### FormBuilder Collection

Stores form definitions with the following key fields:
- `name`: Form name
- `event`: Optional relationship to an event
- `description`: Form description
- `fields`: Array of field configurations
- `formSettings`: Form submission settings
- `layoutSettings`: Form layout settings

### FormSubmission Collection

Stores form responses with the following key fields:
- `submissionID`: Unique submission identifier
- `form`: Relationship to the form
- `event`: Relationship to the event
- `submittedBy`: Relationship to the user who submitted the form
- `formData`: JSON data containing field responses
- `status`: Submission status (submitted, under_review, approved, rejected)
- `files`: Array of uploaded files

## Usage Flow

1. **Creating a Form**:
   - Navigate to the form builder interface
   - Add fields by clicking on field templates
   - Configure fields using the configuration panel
   - Reorder fields using drag and drop
   - Preview the form to see how it will appear to users
   - Save the form

2. **Linking to Events**:
   - When creating or editing an event, select a form from the "Registration Form" field
   - The form will be automatically linked to the event

3. **Form Submission**:
   - Users fill out the form on the event registration page
   - Form data is validated according to the defined rules
   - Submissions are stored in the database and linked to both the form and event

## Form Field Types

The form builder supports the following field types:

- **Text Input**: Single-line text field
- **Text Area**: Multi-line text field
- **Number**: Numeric input field
- **Email**: Email address field with validation
- **Phone**: Phone number field
- **Date**: Date picker field
- **Checkbox**: Single checkbox field
- **Select**: Dropdown selection field
- **Multi-select**: Multi-option selection field
- **Radio Group**: Radio button selection field
- **File Upload**: File upload field

## Validation Options

Fields can be configured with various validation rules:

- Required field toggle
- Min/max length for text fields
- Min/max value for number fields
- Regex pattern validation
- Custom error messages

## Layout Options

Forms can be configured with different layout options:

- **Layout**: Stacked or grid layout
- **Labels**: Show/hide field labels
- **Placeholders**: Show/hide field placeholders
- **Help Text**: Show/hide field help text 