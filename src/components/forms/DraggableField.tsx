'use client'

import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { FormField, DragItem } from './FormFieldTypes'

const FIELD_TYPE = 'FIELD'

interface DraggableFieldProps {
  field: FormField
  index: number
  moveField: (dragIndex: number, hoverIndex: number) => void
  onSelect: (fieldId: string) => void
  isSelected: boolean
}

export const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  index,
  moveField,
  onSelect,
  isSelected,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  // Configure drag and drop
  const [{ handlerId }, drop] = useDrop({
    accept: FIELD_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Get rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the item's height
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveField(dragIndex, hoverIndex)

      // Update the index for the drag item
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: FIELD_TYPE,
    item: () => {
      return { id: field.fieldId, index, field, type: FIELD_TYPE }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.5 : 1
  drag(drop(ref))

  // Get field type display name
  const getFieldTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      text: 'Text Input',
      textarea: 'Text Area',
      number: 'Number',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      checkbox: 'Checkbox',
      select: 'Select',
      multiselect: 'Multi-select',
      radio: 'Radio Group',
      file: 'File Upload',
    }

    return typeLabels[type] || type
  }

  // Get field icon
  const getFieldIcon = (type: string): string => {
    const icons: Record<string, string> = {
      text: '✏️',
      textarea: '📝',
      number: '🔢',
      email: '📧',
      phone: '📱',
      date: '📅',
      checkbox: '✅',
      select: '🔽',
      multiselect: '📋',
      radio: '⚪',
      file: '📎',
    }

    return icons[type] || '🔶'
  }

  return (
    <div
      ref={ref}
      style={{ opacity, cursor: 'move', marginBottom: '8px' }}
      onClick={() => onSelect(field.fieldId)}
      data-handler-id={handlerId}
      className={`p-4 border rounded-md shadow-sm ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } ${field.width === 'half' ? 'w-1/2' : 'w-full'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">{getFieldIcon(field.fieldType)}</span>
          <div>
            <div className="font-medium">{field.fieldLabel}</div>
            <div className="text-xs text-gray-500">
              {getFieldTypeLabel(field.fieldType)}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Selected</div>
        )}
      </div>

      {field.helpText && <div className="text-xs text-gray-500 mt-1">{field.helpText}</div>}
    </div>
  )
}
