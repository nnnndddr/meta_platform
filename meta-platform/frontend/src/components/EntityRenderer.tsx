import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Segmented, Spin, Typography, Space } from 'antd'
import {
  PlusOutlined,
  TableOutlined,
  BorderOutlined,
  AppstoreOutlined,
  FormOutlined,
} from '@ant-design/icons'
import type { EntityMeta, EntityRecord, LayoutType } from '@/types/meta'
import { LAYOUT_REGISTRY } from '@/registries/layoutRegistry'
import { RecordModal, type ModalMode } from './RecordModal'
import { dataApi } from '@/api/data'
import { useNotificationStore } from '@/store/notificationStore'

interface EntityRendererProps {
  meta: EntityMeta
}

interface ModalState {
  open: boolean
  mode: ModalMode
  record?: EntityRecord
}

const CLOSED: ModalState = { open: false, mode: 'create' }

const LAYOUT_OPTIONS: { value: LayoutType; icon: React.ReactNode; label: string }[] = [
  { value: 'table',  icon: <TableOutlined />,      label: 'Table'  },
  { value: 'kanban', icon: <BorderOutlined />,      label: 'Kanban' },
  { value: 'grid',   icon: <AppstoreOutlined />,    label: 'Grid'   },
  { value: 'form',   icon: <FormOutlined />,        label: 'Form'   },
]

import type React from 'react'

export function EntityRenderer({ meta }: EntityRendererProps) {
  const queryClient = useQueryClient()
  const currentUserId = useNotificationStore((s) => s.currentUser?.id)
  const [modal, setModal]           = useState<ModalState>(CLOSED)
  // Local layout — starts from meta.layout, user can switch without touching DB
  const [activeLayout, setActiveLayout] = useState<LayoutType>(meta.layout)

  // Reset layout when entity switches
  useEffect(() => {
    setActiveLayout(meta.layout)
    setModal(CLOSED)
  }, [meta.id, meta.layout])

  // currentUserId в ключе гарантирует перезапрос при смене пользователя
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['data', meta.id, currentUserId],
    queryFn: () => dataApi.list(meta.id),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => dataApi.create(meta.id, data),
    onSuccess: (created) => {
      queryClient.setQueryData<EntityRecord[]>(['data', meta.id, currentUserId], (prev = []) => [...prev, created])
      queryClient.invalidateQueries({ queryKey: ['data', meta.id] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      dataApi.update(meta.id, id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<EntityRecord[]>(['data', meta.id, currentUserId], (prev = []) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
      queryClient.invalidateQueries({ queryKey: ['data', meta.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataApi.delete(meta.id, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<EntityRecord[]>(['data', meta.id, currentUserId], (prev = []) =>
        prev.filter((r) => r.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['data', meta.id] })
      setModal(CLOSED)
    },
  })

  function openCreate() { setModal({ open: true, mode: 'create' }) }
  function openView(record: EntityRecord) { setModal({ open: true, mode: 'view', record }) }
  function openEdit(record: EntityRecord) { setModal({ open: true, mode: 'edit', record }) }

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync(data)
    setModal(CLOSED)
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!modal.record) return
    const updated = await updateMutation.mutateAsync({ id: modal.record.id, data })
    setModal({ open: true, mode: 'view', record: updated })
  }

  function handleDelete() {
    if (!modal.record) return
    deleteMutation.mutate(modal.record.id)
  }

  function handleRecordUpdate(record: EntityRecord) {
    queryClient.setQueryData<EntityRecord[]>(['data', meta.id], (prev = []) =>
      prev.map((r) => (r.id === record.id ? record : r))
    )
    dataApi.update(meta.id, record.id, record.data).catch(() => {
      queryClient.invalidateQueries({ queryKey: ['data', meta.id] })
    })
  }

  const Layout = LAYOUT_REGISTRY[activeLayout] ?? LAYOUT_REGISTRY.table

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            {meta.name}
          </Typography.Title>
          {meta.description && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {meta.description}
            </Typography.Text>
          )}
        </div>

        <Space>
          {/* Layout switcher — client-side only, no DB write */}
          <Segmented
            size="small"
            value={activeLayout}
            onChange={(v) => setActiveLayout(v as LayoutType)}
            options={LAYOUT_OPTIONS.map((o) => ({
              value: o.value,
              icon: o.icon,
              label: o.label,
            }))}
          />

          {/* Always visible create button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={openCreate}
          >
            New {meta.name}
          </Button>
        </Space>
      </div>

      {/* ── Layout area ── */}
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Layout
            meta={meta}
            records={records}
            onRecordUpdate={handleRecordUpdate}
            onRecordClick={openView}
          />
        </div>
      )}

      {/* ── Modal ── */}
      {modal.open && (
        <RecordModal
          meta={meta}
          mode={modal.mode}
          record={modal.record}
          onClose={() => setModal(CLOSED)}
          onSave={modal.mode === 'create' ? handleCreate : modal.mode === 'edit' ? handleUpdate : undefined}
          onEdit={modal.mode === 'view' && modal.record ? () => openEdit(modal.record!) : undefined}
          onDelete={modal.mode !== 'create' ? handleDelete : undefined}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
