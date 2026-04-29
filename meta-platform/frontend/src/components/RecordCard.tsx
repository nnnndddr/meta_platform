import { Card, Typography } from 'antd'
import type { EntityMeta, EntityRecord } from '@/types/meta'
import { FieldRenderer } from '@/renderers/FieldRenderer'

interface RecordCardProps {
  record: EntityRecord
  meta: EntityMeta
  onClick: () => void
  isDragging?: boolean
}

const PREVIEW_TYPES = new Set(['select', 'multiselect', 'date', 'user', 'tags', 'progress'])

export function RecordCard({ record, meta, onClick, isDragging }: RecordCardProps) {
  const titleField    = meta.fields.find((f) => f.name === 'title') ?? meta.fields[0]
  const previewFields = meta.fields
    .filter((f) => f.name !== titleField?.name && PREVIEW_TYPES.has(f.type))
    .slice(0, 4)

  return (
    <Card
      size="small"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.18)'
          : '0 1px 3px rgba(0,0,0,0.07)',
        borderColor: isDragging ? '#93c5fd' : undefined,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      hoverable
      styles={{ body: { padding: '10px 12px' } }}
    >
      <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: previewFields.length ? 8 : 0 }}>
        {(record.data[titleField?.name ?? ''] as string) || 'Untitled'}
      </Typography.Text>

      {previewFields.map((field) => {
        const value = record.data[field.name]
        if (value === undefined || value === null || value === '' ||
            (Array.isArray(value) && value.length === 0)) return null
        return (
          <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Typography.Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', width: 52, flexShrink: 0 }}>
              {field.label}
            </Typography.Text>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FieldRenderer field={field} value={value} compact />
            </div>
          </div>
        )
      })}
    </Card>
  )
}
