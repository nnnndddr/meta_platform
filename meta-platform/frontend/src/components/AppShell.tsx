import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Layout, Spin } from 'antd'
import type { EntityMeta } from '@/types/meta'
import { metaApi } from '@/api/meta'
import { message } from 'antd'
import { EntitySidebar } from './EntitySidebar'
import { EntityRenderer } from './EntityRenderer'
import { SchemaConstructor } from './SchemaConstructor'
import { UserSelector } from './UserSelector'
import { NotificationBell } from './NotificationBell'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

type Mode = 'view' | 'construct'

export function AppShell() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('view')
  const [constructTarget, setConstructTarget] = useState<EntityMeta | null>(null)

  useNotificationSocket()

  const queryClient = useQueryClient()

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ['meta'],
    queryFn: metaApi.list,
  })

  const deleteMeta = useMutation({
    mutationFn: (id: string) => metaApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['meta'] })
      if (selectedId === id) setSelectedId(null)
      message.success('Entity deleted')
    },
    onError: () => message.error('Failed to delete entity'),
  })

  useEffect(() => {
    if (metas.length && !selectedId) setSelectedId(metas[0].id)
  }, [metas, selectedId])

  const selectedMeta = metas.find((m: EntityMeta) => m.id === selectedId)

  function openNewEntity() {
    setConstructTarget(null)
    setMode('construct')
  }

  function openEditSchema(meta: EntityMeta) {
    setConstructTarget(meta)
    setMode('construct')
  }

  function closeConstructor(savedId?: string) {
    setMode('view')
    if (savedId) setSelectedId(savedId)
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Header
        style={{
          height: 48,
          lineHeight: '48px',
          padding: '0 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>Meta Platform</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserSelector />
          <NotificationBell />
        </div>
      </Layout.Header>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Layout.Sider
          width={220}
          theme="light"
          style={{ borderRight: '1px solid #f0f0f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <EntitySidebar
            metas={metas}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setMode('view') }}
            onNewEntity={openNewEntity}
            onEditSchema={openEditSchema}
            onDeleteSchema={(meta) => deleteMeta.mutate(meta.id)}
          />
        </Layout.Sider>

        <Layout.Content style={{ overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column' }}>
          {mode === 'construct' ? (
            <SchemaConstructor existingMeta={constructTarget} onDone={closeConstructor} />
          ) : isLoading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          ) : selectedMeta ? (
            <EntityRenderer meta={selectedMeta} />
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              Select an entity from the sidebar
            </div>
          )}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
