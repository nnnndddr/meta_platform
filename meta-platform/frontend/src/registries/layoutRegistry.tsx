import type { FC } from 'react'
import type { EntityMeta, EntityRecord } from '@/types/meta'
import { KanbanLayout } from '@/layouts/KanbanLayout'
import { TableLayout } from '@/layouts/TableLayout'
import { FormLayoutAdapter } from '@/layouts/FormLayout'
import { GridLayout } from '@/layouts/GridLayout'

export interface LayoutProps {
  meta: EntityMeta
  records: EntityRecord[]
  onRecordUpdate: (record: EntityRecord) => void
  onRecordClick: (record: EntityRecord) => void
}

type LayoutFC = FC<LayoutProps>

export const LAYOUT_REGISTRY: Record<string, LayoutFC> = {
  kanban: KanbanLayout,
  table: TableLayout,
  form: FormLayoutAdapter,
  grid: GridLayout,
}
