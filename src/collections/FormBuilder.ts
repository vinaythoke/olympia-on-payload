import { CollectionConfig, Access, FieldAccess } from 'payload'

const FormBuilder: CollectionConfig = {
  slug: 'form-builders',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'event.title', 'createdAt'],
    group: 'Form Management',
  },
  access: {
    // Only organizers and superadmins can create forms
    create: ({ req }) => {
      return Boolean(req.user && ['organizer', 'superadmin'].includes(req.user?.role || ''));
    },
    // Forms can be read by the creating organizer and superadmins
    read: ({ req, id }) => {
      if (req.user) {
        if (req.user.role === 'superadmin') return true;
        
        if (req.user.role === 'organizer') {
          // For organizers, check ownership through relationship
          return {
            or: [
              {
                'event.organizer.user': {
                  equals: req.user.id,
                },
              },
              {
                createdBy: {
                  equals: req.user.id,
                },
              }
            ]
          };
        }
      }
      
      return false;
    },
    // Only the creating organizer or superadmin can update forms
    update: ({ req }) => {
      if (req.user?.role === 'superadmin') return true;
      
      if (req.user?.role === 'organizer') {
        // Same ownership check pattern as read
        return {
          or: [
            {
              'event.organizer.user': {
                equals: req.user.id,
              },
            },
            {
              createdBy: {
                equals: req.user.id,
              },
            }
          ]
        };
      }
      
      return false;
    },
    // Only the creating organizer or superadmin can delete forms
    delete: ({ req }) => {
      if (req.user?.role === 'superadmin') return true;
      
      if (req.user?.role === 'organizer') {
        // Same ownership check pattern as read
        return {
          or: [
            {
              'event.organizer.user': {
                equals: req.user.id,
              },
            },
            {
              createdBy: {
                equals: req.user.id,
              },
            }
          ]
        };
      }
      
      return false;
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the form for easy reference',
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: false,
      admin: {
        description: 'Event this form is associated with (optional)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the form purpose',
      },
    },
    {
      name: 'fields',
      type: 'array',
      admin: {
        description: 'Form fields configuration',
      },
      fields: [
        {
          name: 'fieldId',
          type: 'text',
          required: true,
          admin: {
            description: 'Unique identifier for the field',
          },
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          options: [
            { label: 'Text Input', value: 'text' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Number', value: 'number' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Date', value: 'date' },
            { label: 'Checkbox', value: 'checkbox' },
            { label: 'Select', value: 'select' },
            { label: 'Multi-select', value: 'multiselect' },
            { label: 'Radio Group', value: 'radio' },
            { label: 'File Upload', value: 'file' },
          ],
        },
        {
          name: 'fieldLabel',
          type: 'text',
          required: true,
          admin: {
            description: 'Label displayed to the user',
          },
        },
        {
          name: 'placeholder',
          type: 'text',
          admin: {
            description: 'Placeholder text (where applicable)',
            condition: (data, siblingData) => {
              return ['text', 'textarea', 'number', 'email', 'phone', 'date'].includes(siblingData?.fieldType as string);
            },
          },
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Is this field required?',
          },
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            description: 'Options for select, multi-select, and radio fields',
            condition: (data, siblingData) => {
              return ['select', 'multiselect', 'radio'].includes(siblingData?.fieldType as string);
            },
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'validations',
          type: 'group',
          admin: {
            description: 'Validation rules for this field',
          },
          fields: [
            {
              name: 'minLength',
              type: 'number',
              admin: {
                description: 'Minimum characters allowed',
                condition: (data, siblingData) => {
                  // Get the parent field type by accessing the parent path
                  const parentContext = siblingData?.__parentPath;
                  const fieldType = parentContext?.[1]?.fieldType;
                  return ['text', 'textarea', 'email', 'phone'].includes(fieldType as string);
                },
              },
            },
            {
              name: 'maxLength',
              type: 'number',
              admin: {
                description: 'Maximum characters allowed',
                condition: (data, siblingData) => {
                  // Get the parent field type by accessing the parent path
                  const parentContext = siblingData?.__parentPath;
                  const fieldType = parentContext?.[1]?.fieldType;
                  return ['text', 'textarea', 'email', 'phone'].includes(fieldType as string);
                },
              },
            },
            {
              name: 'minValue',
              type: 'number',
              admin: {
                description: 'Minimum value allowed',
                condition: (data, siblingData) => {
                  // Get the parent field type by accessing the parent path
                  const parentContext = siblingData?.__parentPath;
                  const fieldType = parentContext?.[1]?.fieldType;
                  return fieldType === 'number';
                },
              },
            },
            {
              name: 'maxValue',
              type: 'number',
              admin: {
                description: 'Maximum value allowed',
                condition: (data, siblingData) => {
                  // Get the parent field type by accessing the parent path
                  const parentContext = siblingData?.__parentPath;
                  const fieldType = parentContext?.[1]?.fieldType;
                  return fieldType === 'number';
                },
              },
            },
            {
              name: 'pattern',
              type: 'text',
              admin: {
                description: 'Regex pattern for validation',
                condition: (data, siblingData) => {
                  // Get the parent field type by accessing the parent path
                  const parentContext = siblingData?.__parentPath;
                  const fieldType = parentContext?.[1]?.fieldType;
                  return ['text', 'email', 'phone'].includes(fieldType as string);
                },
              },
            },
            {
              name: 'customErrorMessage',
              type: 'text',
              admin: {
                description: 'Custom error message when validation fails',
              },
            },
          ],
        },
        {
          name: 'helpText',
          type: 'text',
          admin: {
            description: 'Additional help text for the field',
          },
        },
        {
          name: 'width',
          type: 'select',
          defaultValue: 'full',
          options: [
            { label: 'Full Width', value: 'full' },
            { label: 'Half Width', value: 'half' },
          ],
          admin: {
            description: 'Width of the field in the form layout',
          },
        },
      ],
    },
    {
      name: 'formSettings',
      type: 'group',
      fields: [
        {
          name: 'submitButtonText',
          type: 'text',
          defaultValue: 'Submit',
        },
        {
          name: 'successMessage',
          type: 'text',
          defaultValue: 'Form submitted successfully!',
        },
        {
          name: 'redirectAfterSubmit',
          type: 'text',
          admin: {
            description: 'URL to redirect to after form submission (optional)',
          },
        },
      ],
    },
    {
      name: 'layoutSettings',
      type: 'group',
      fields: [
        {
          name: 'layout',
          type: 'select',
          options: [
            { label: 'Stacked', value: 'stacked' },
            { label: 'Grid', value: 'grid' },
          ],
          defaultValue: 'stacked',
        },
        {
          name: 'showLabels',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showPlaceholders',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showHelpText',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'formResponses',
      type: 'relationship',
      relationTo: 'submissions',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Submissions for this form (managed automatically)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Generate unique IDs for fields if they don't already have one
        if (data.fields && Array.isArray(data.fields)) {
          data.fields = data.fields.map((field: any, index: number) => {
            if (!field.fieldId) {
              field.fieldId = `field_${Date.now().toString().slice(-6)}_${index}`;
            }
            return field;
          });
        }
        return data;
      },
    ],
  },
}

export { FormBuilder } 