import { Form, Empty, Button, Card, Typography } from 'antd'
import type { LayoutProps } from '@/registries/layoutRegistry'
import type { FieldMeta } from '@/types/meta'
import { FieldRenderer } from '@/renderers/FieldRenderer'

// Used standalone inside RecordModal (editable form)
interface FormLayoutProps {
  fields: FieldMeta[]
  data: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  errors?: Record<string, string>
}

export function FormLayout({ fields, data, onChange, errors = {} }: FormLayoutProps) {
  return (
    <Form layout="vertical" component="div">
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          label={
            <span>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
            </span>
          }
          validateStatus={errors[field.name] ? 'error' : undefined}
          help={errors[field.name]}
          style={{ marginBottom: 16 }}
        >
          <FieldRenderer
            field={field}
            value={data[field.name] ?? field.default ?? ''}
            onChange={(val) => onChange(field.name, val)}
          />
        </Form.Item>
      ))}
    </Form>
  )
}

// Adapter used when FormLayout is selected as the entity layout
export function FormLayoutAdapter({ meta, records, onRecordClick }: LayoutProps) {
  if (!records.length) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="No records yet. Create one first." />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560, margin: '0 auto' }}>
      {records.map((record) => (
        <Card
          key={record.id}
          size="small"
          extra={<Button type="link" size="small" onClick={() => onRecordClick(record)}>Edit</Button>}
        >
          {meta.fields.map((field) => (
            <div key={field.name} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, width: 120, flexShrink: 0, paddingTop: 2 }}>
                {field.label}
              </Typography.Text>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldRenderer field={field} value={record.data[field.name]} />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}
