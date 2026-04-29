import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { LayoutProps } from '@/registries/layoutRegistry'
import type { EntityMeta, EntityRecord } from '@/types/meta'
import { RecordCard } from '@/components/RecordCard'

// ─── Colors ───────────────────────────────────────────────────────────────────

const COL_BG: Record<string, string> = {
  gray:   'bg-gray-100',
  blue:   'bg-blue-50',
  yellow: 'bg-yellow-50',
  green:  'bg-green-50',
  orange: 'bg-orange-50',
  red:    'bg-red-50',
}
const COL_RING: Record<string, string> = {
  gray:   'ring-gray-400',
  blue:   'ring-blue-400',
  yellow: 'ring-yellow-400',
  green:  'ring-green-400',
  orange: 'ring-orange-400',
  red:    'ring-red-400',
}

// ─── SortableCard ─────────────────────────────────────────────────────────────

interface SortableCardProps {
  record: EntityRecord
  meta: EntityMeta
  activeId: UniqueIdentifier | null
  onRecordClick: (r: EntityRecord) => void
}

function SortableCard({ record, meta, activeId, onRecordClick }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: record.id,
    animateLayoutChanges: () => false,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        pointerEvents: activeId === record.id ? 'none' : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <RecordCard record={record} meta={meta} onClick={() => onRecordClick(record)} />
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface ColumnProps {
  id: string
  label: string
  colorKey: string
  records: EntityRecord[]
  meta: EntityMeta
  activeId: UniqueIdentifier | null
  isOver: boolean
  onRecordClick: (r: EntityRecord) => void
}

function KanbanColumn({ id, label, colorKey, records, meta, activeId, isOver, onRecordClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id })
  const bg   = COL_BG[colorKey]   ?? 'bg-gray-100'
  const ring = COL_RING[colorKey] ?? 'ring-gray-400'

  return (
    <div className="flex flex-col min-w-[264px] w-[264px] shrink-0">
      <div className={`rounded-t-xl px-3 py-2.5 flex items-center gap-2 ${bg}`}>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {label.replace('_', ' ')}
        </span>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-500">
          {records.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-b-xl p-2 min-h-[160px] flex flex-col gap-2
          transition-[box-shadow,background-color] duration-150
          ${bg} ${isOver ? `ring-2 ring-inset ${ring}` : ''}
        `}
      >
        <SortableContext
          id={id}
          items={records.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {records.map((record) => (
            <SortableCard
              key={record.id}
              record={record}
              meta={meta}
              activeId={activeId}
              onRecordClick={onRecordClick}
            />
          ))}
        </SortableContext>

        {records.length === 0 && (
          <div
            className={`
              flex-1 rounded-lg border-2 border-dashed
              flex items-center justify-center transition-colors duration-150
              ${isOver
                ? 'border-blue-400 bg-blue-50/60 text-blue-500'
                : 'border-gray-200 text-gray-300'}
            `}
          >
            <span className="text-xs font-medium">{isOver ? '↓ Drop here' : 'Empty'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KanbanLayout ─────────────────────────────────────────────────────────────

export function KanbanLayout({ meta, records, onRecordUpdate, onRecordClick }: LayoutProps) {
  const groupField = meta.fields.find((f) => f['x-ui']?.kanban_group)
  const columns    = groupField?.options ?? []
  const colorMap   = groupField?.['x-ui']?.color_map ?? {}

  const [localItems, setLocalItems] = useState<Record<string, EntityRecord[]>>({})
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overColId, setOverColId] = useState<string | null>(null)

  const isDraggingRef = useRef(false)
  const recordsRef    = useRef(records)
  // Track final column via ref so handleDragEnd doesn't read stale localItems closure
  const finalColRef   = useRef<string | null>(null)

  useEffect(() => { recordsRef.current = records }, [records])

  useEffect(() => {
    if (isDraggingRef.current) return
    setLocalItems(buildGrouped(records))
  }, [records]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildGrouped(recs: EntityRecord[]): Record<string, EntityRecord[]> {
    return Object.fromEntries(
      columns.map((col) => [
        col,
        recs.filter((r) => r.data[groupField?.name ?? ''] === col),
      ])
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /** Find which column a given id belongs to (works for both column ids and card ids) */
  function findColumnOf(id: UniqueIdentifier, items: Record<string, EntityRecord[]>): string | null {
    const str = String(id)
    if (columns.includes(str)) return str
    for (const [col, recs] of Object.entries(items)) {
      if (recs.some((r) => r.id === str)) return col
    }
    return null
  }

  const activeRecord = activeId
    ? Object.values(localItems).flat().find((r) => r.id === activeId) ?? null
    : null

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(e: DragStartEvent) {
    isDraggingRef.current = true
    setActiveId(e.active.id)
    finalColRef.current = findColumnOf(e.active.id, localItems)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over || !groupField) return

    setLocalItems((prev) => {
      const fromCol = findColumnOf(active.id, prev)
      const toCol   = findColumnOf(over.id, prev)

      if (!fromCol || !toCol) return prev

      // Update the ref so handleDragEnd always knows where card landed
      finalColRef.current = toCol
      setOverColId(toCol)

      const fromItems = prev[fromCol] ?? []
      const toItems   = prev[toCol]   ?? []
      const activeIdx = fromItems.findIndex((r) => r.id === active.id)
      if (activeIdx === -1) return prev

      // ── Same column: reorder ──────────────────────────────────────────────
      if (fromCol === toCol) {
        const overIdx = fromItems.findIndex((r) => r.id === over.id)
        if (overIdx === -1 || overIdx === activeIdx) return prev
        return { ...prev, [fromCol]: arrayMove(fromItems, activeIdx, overIdx) }
      }

      // ── Cross column: move with position-aware insertion ──────────────────
      const moving = fromItems[activeIdx]
      const overIdx = toItems.findIndex((r) => r.id === over.id)

      let insertAt: number
      if (overIdx < 0) {
        // Hovering over empty column or column header → append
        insertAt = toItems.length
      } else {
        const isBelowMid =
          active.rect.current.translated != null &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2
        insertAt = isBelowMid ? overIdx + 1 : overIdx
      }

      const movedItem = { ...moving, data: { ...moving.data, [groupField.name]: toCol } }

      return {
        ...prev,
        [fromCol]: fromItems.filter((_, i) => i !== activeIdx),
        [toCol]: [...toItems.slice(0, insertAt), movedItem, ...toItems.slice(insertAt)],
      }
    })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active } = e
    const finalCol = finalColRef.current

    setActiveId(null)
    setOverColId(null)
    isDraggingRef.current = false
    finalColRef.current = null

    if (!groupField || !finalCol) return

    // Fire PATCH only if the column actually changed
    const original = recordsRef.current.find((r) => r.id === active.id)
    if (original && original.data[groupField.name] !== finalCol) {
      onRecordUpdate({ ...original, data: { ...original.data, [groupField.name]: finalCol } })
    }
  }

  function handleDragCancel() {
    isDraggingRef.current = false
    finalColRef.current = null
    setLocalItems(buildGrouped(recordsRef.current))
    setActiveId(null)
    setOverColId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-full items-start">
        {columns.map((col) => (
          <KanbanColumn
            key={col}
            id={col}
            label={col}
            colorKey={colorMap[col] ?? 'gray'}
            records={localItems[col] ?? []}
            meta={meta}
            activeId={activeId}
            isOver={overColId === col}
            onRecordClick={onRecordClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeRecord && (
          <div style={{ transform: 'rotate(1.5deg) scale(1.02)', cursor: 'grabbing' }}>
            <RecordCard record={activeRecord} meta={meta} onClick={() => {}} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
