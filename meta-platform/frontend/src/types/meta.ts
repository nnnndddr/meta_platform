export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'user'
  | 'tags'
  | 'number'
  | 'progress'
  | 'checkbox'

export type LayoutType = 'kanban' | 'table' | 'form' | 'grid'
export type ActionVariant = 'primary' | 'secondary' | 'danger'

export interface XUIHints {
  widget?: string
  kanban_group?: boolean
  color_map?: Record<string, string>
  placeholder?: string
  readonly?: boolean
  width?: string
}

export interface FieldConstraints {
  // text / textarea
  minLength?: number
  maxLength?: number
  pattern?:   string   // regex

  // number / progress
  min?:  number
  max?:  number
  step?: number

  // date
  minDate?: string   // YYYY-MM-DD
  maxDate?: string   // YYYY-MM-DD

  // multiselect / tags
  minItems?: number
  maxItems?: number
}

export interface FieldMeta {
  name: string
  type: FieldType
  label: string
  required?: boolean
  options?: string[]
  default?: unknown
  'x-ui': XUIHints
  constraints?: FieldConstraints
}

export interface ActionMeta {
  id: string
  label: string
  icon?: string
  variant: ActionVariant
}

export interface EntityMeta {
  id: string
  name: string
  description: string
  layout: LayoutType
  fields: FieldMeta[]
  actions: ActionMeta[]
  allow_attachments?: boolean
  version: number
}

export interface EntityRecord {
  id: string
  entity_id: string
  data: Record<string, unknown>
  created_at?: string
  updated_at?: string
}
