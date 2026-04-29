import type { FC } from 'react'
import type { FieldMeta } from '@/types/meta'
import { TextRenderer } from './TextRenderer'
import { TextareaRenderer } from './TextareaRenderer'
import { SelectRenderer } from './SelectRenderer'
import { UserRenderer } from './UserRenderer'
import { DateRenderer } from './DateRenderer'
import { TagsRenderer } from './TagsRenderer'
import { ProgressRenderer } from './ProgressRenderer'
import { NumberRenderer } from './NumberRenderer'
import { CheckboxRenderer } from './CheckboxRenderer'

export interface FieldRendererProps {
  field: FieldMeta
  value: unknown
  onChange?: (value: unknown) => void
  compact?: boolean
}

type RendererFC = FC<FieldRendererProps>

const WIDGET_REGISTRY: Record<string, RendererFC> = {
  badge:          SelectRenderer,
  avatar:         UserRenderer,
  'progress-bar': ProgressRenderer,
  'date-picker':  DateRenderer,
}

const TYPE_REGISTRY: Record<string, RendererFC> = {
  text:        TextRenderer,
  textarea:    TextareaRenderer,
  select:      SelectRenderer,
  multiselect: SelectRenderer,
  date:        DateRenderer,
  user:        UserRenderer,
  tags:        TagsRenderer,
  progress:    ProgressRenderer,
  number:      NumberRenderer,
  checkbox:    CheckboxRenderer,
}

export function FieldRenderer(props: FieldRendererProps) {
  // Defensive: normalize x-ui in case API returned snake_case key
  const field = props.field
  const xui = field['x-ui'] ?? (field as unknown as Record<string, unknown>)['x_ui'] ?? {}
  const normalizedField = field['x-ui'] ? field : { ...field, 'x-ui': xui }

  const widget = (xui as { widget?: string }).widget
  const Comp: RendererFC =
    (widget ? WIDGET_REGISTRY[widget] : undefined) ??
    TYPE_REGISTRY[field.type] ??
    TextRenderer

  return <Comp {...props} field={normalizedField as FieldMeta} />
}
