import { Form, Input, Radio, Switch } from 'antd'
import { TableOutlined, BorderOutlined, FormOutlined, AppstoreOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { EntityMeta, LayoutType } from '@/types/meta'

const LAYOUTS: { value: LayoutType; label: string; icon: React.ReactNode }[] = [
  { value: 'table',  label: 'Table',  icon: <TableOutlined /> },
  { value: 'kanban', label: 'Kanban', icon: <BorderOutlined /> },
  { value: 'grid',   label: 'Grid',   icon: <AppstoreOutlined /> },
  { value: 'form',   label: 'Form',   icon: <FormOutlined /> },
]

import type React from 'react'

interface Props {
  draft: EntityMeta
  isNew: boolean
  onChange: (patch: Partial<EntityMeta>) => void
}

export function EntitySettingsPanel({ draft, isNew, onChange }: Props) {
  return (
    <Form layout="vertical" component="div">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Form.Item label="Entity ID" required style={{ marginBottom: 12 }}>
          <Input
            value={draft.id}
            disabled={!isNew}
            placeholder="e.g. project, bug_report"
            onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            size="small"
          />
          {!isNew && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>ID cannot be changed after creation</div>}
        </Form.Item>

        <Form.Item label="Display Name" required style={{ marginBottom: 12 }}>
          <Input
            value={draft.name}
            placeholder="e.g. Projects"
            onChange={(e) => onChange({ name: e.target.value })}
            size="small"
          />
        </Form.Item>

        <Form.Item label="Description" style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
          <Input
            value={draft.description}
            placeholder="Optional description"
            onChange={(e) => onChange({ description: e.target.value })}
            size="small"
          />
        </Form.Item>
      </div>

      <Form.Item label="Layout" style={{ marginBottom: 12 }}>
        <Radio.Group
          value={draft.layout}
          onChange={(e) => onChange({ layout: e.target.value })}
          size="small"
        >
          {LAYOUTS.map((l) => (
            <Radio.Button key={l.value} value={l.value}>
              {l.icon} {l.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>

      <Form.Item label={<span><PaperClipOutlined style={{ marginRight: 6 }} />Allow file attachments</span>} style={{ marginBottom: 0 }}>
        <Switch
          size="small"
          checked={draft.allow_attachments ?? false}
          onChange={(checked) => onChange({ allow_attachments: checked })}
        />
      </Form.Item>
    </Form>
  )
}
