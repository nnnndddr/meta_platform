import { Button, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { FieldMeta, FieldType } from '@/types/meta'
import { FieldEditorRow } from './FieldEditorRow'

function newField(index: number): FieldMeta {
  return {
    name: `field_${index + 1}`,
    label: `Field ${index + 1}`,
    type: 'text' as FieldType,
    required: false,
    'x-ui': {},
  }
}

interface Props {
  fields: FieldMeta[]
  onChange: (fields: FieldMeta[]) => void
}

export function FieldEditorList({ fields, onChange }: Props) {
  function updateField(index: number, patch: Partial<FieldMeta>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.length === 0 && (
        <Empty description="No fields yet" imageStyle={{ height: 32 }} style={{ padding: '8px 0' }} />
      )}
      {fields.map((field, i) => (
        <FieldEditorRow
          key={i}
          field={field}
          index={i}
          onChange={(patch) => updateField(i, patch)}
          onRemove={() => removeField(i)}
        />
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => onChange([...fields, newField(fields.length)])}
        size="small"
        style={{ marginTop: 4 }}
      >
        Add field
      </Button>
    </div>
  )
}
