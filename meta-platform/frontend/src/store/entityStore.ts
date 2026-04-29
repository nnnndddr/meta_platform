import { create } from 'zustand'
import type { EntityMeta, EntityRecord } from '@/types/meta'

interface EntityStore {
  metas: Record<string, EntityMeta>
  records: Record<string, EntityRecord[]>
  selectedEntityId: string | null

  setMeta: (meta: EntityMeta) => void
  setMetas: (metas: EntityMeta[]) => void
  setRecords: (entityId: string, records: EntityRecord[]) => void
  addRecord: (record: EntityRecord) => void
  updateRecord: (record: EntityRecord) => void
  removeRecord: (entityId: string, recordId: string) => void
  selectEntity: (entityId: string) => void
}

export const useEntityStore = create<EntityStore>((set) => ({
  metas: {},
  records: {},
  selectedEntityId: null,

  setMeta: (meta) =>
    set((s) => ({ metas: { ...s.metas, [meta.id]: meta } })),

  setMetas: (metas) =>
    set({ metas: Object.fromEntries(metas.map((m) => [m.id, m])) }),

  setRecords: (entityId, records) =>
    set((s) => ({ records: { ...s.records, [entityId]: records } })),

  addRecord: (record) =>
    set((s) => ({
      records: {
        ...s.records,
        [record.entity_id]: [...(s.records[record.entity_id] ?? []), record],
      },
    })),

  updateRecord: (record) =>
    set((s) => ({
      records: {
        ...s.records,
        [record.entity_id]: (s.records[record.entity_id] ?? []).map((r) =>
          r.id === record.id ? record : r
        ),
      },
    })),

  removeRecord: (entityId, recordId) =>
    set((s) => ({
      records: {
        ...s.records,
        [entityId]: (s.records[entityId] ?? []).filter((r) => r.id !== recordId),
      },
    })),

  selectEntity: (entityId) => set({ selectedEntityId: entityId }),
}))
