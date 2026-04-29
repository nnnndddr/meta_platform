import { api } from './client'
import type { EntityRecord } from '@/types/meta'

export const dataApi = {
  list: (entityId: string) => api.get<EntityRecord[]>(`/data/${entityId}`),
  get: (entityId: string, recordId: string) =>
    api.get<EntityRecord>(`/data/${entityId}/${recordId}`),
  create: (entityId: string, data: Record<string, unknown>) =>
    api.post<EntityRecord>(`/data/${entityId}`, { data }),
  update: (entityId: string, recordId: string, data: Record<string, unknown>) =>
    api.patch<EntityRecord>(`/data/${entityId}/${recordId}`, { data }),
  delete: (entityId: string, recordId: string) =>
    api.delete<{ ok: boolean }>(`/data/${entityId}/${recordId}`),
}
