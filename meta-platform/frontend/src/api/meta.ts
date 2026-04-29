import { api } from './client'
import type { EntityMeta } from '@/types/meta'

export const metaApi = {
  list: () => api.get<EntityMeta[]>('/meta'),
  get: (entityId: string) => api.get<EntityMeta>(`/meta/${entityId}`),
  upsert: (entityId: string, meta: EntityMeta) => api.post<EntityMeta>(`/meta/${entityId}`, meta),
  delete: (entityId: string) => api.delete<{ ok: boolean }>(`/meta/${entityId}`),
}
