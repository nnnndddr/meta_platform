import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Space, Alert, Typography, Card, Divider } from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type { EntityMeta } from '@/types/meta'
import { metaApi } from '@/api/meta'
import { EntitySettingsPanel } from './constructor/EntitySettingsPanel'
import { FieldEditorList } from './constructor/FieldEditorList'

function defaultMeta(): EntityMeta {
  return { id: '', name: '', description: '', layout: 'table', fields: [], actions: [], version: 1 }
}

interface Props {
  existingMeta?: EntityMeta | null
  onDone: (savedId?: string) => void
}

export function SchemaConstructor({ existingMeta, onDone }: Props) {
  const queryClient = useQueryClient()
  const isNew = !existingMeta
  const [draft, setDraft] = useState<EntityMeta>(() =>
    existingMeta ? { ...existingMeta } : defaultMeta()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patchDraft(patch: Partial<EntityMeta>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    if (!draft.id.trim()) { setError('Entity ID is required'); return }
    if (!draft.name.trim()) { setError('Display name is required'); return }
    if (draft.fields.length === 0) { setError('Add at least one field'); return }
    const names = draft.fields.map((f) => f.name.trim())
    if (names.some((n) => !n)) { setError('All field names must be non-empty'); return }
    if (new Set(names).size !== names.length) { setError('Field names must be unique'); return }

    setError(null)
    setSaving(true)
    try {
      await metaApi.upsert(draft.id, draft)
      await queryClient.invalidateQueries({ queryKey: ['meta'] })
      onDone(draft.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {isNew ? 'New Entity' : `Edit Schema: ${existingMeta!.name}`}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Define fields and layout — the frontend renders from this schema automatically.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<CloseOutlined />} onClick={() => onDone()} size="small">Cancel</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} size="small">
            Save Schema
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, flexShrink: 0 }} />}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        <Card size="small" title={<Typography.Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Entity Settings</Typography.Text>} style={{ marginBottom: 16 }}>
          <EntitySettingsPanel draft={draft} isNew={isNew} onChange={patchDraft} />
        </Card>

        <Card size="small" title={<Typography.Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Fields</Typography.Text>}>
          <FieldEditorList
            fields={draft.fields}
            onChange={(fields) => patchDraft({ fields })}
          />
        </Card>
      </div>
    </div>
  )
}
