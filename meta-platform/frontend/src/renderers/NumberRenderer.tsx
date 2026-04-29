import { InputNumber, Typography } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

export function NumberRenderer({ value, onChange, compact }: FieldRendererProps) {
  if (onChange) {
    return (
      <InputNumber
        value={value as number}
        onChange={(v) => onChange(v ?? 0)}
        style={{ width: '100%' }}
        size="small"
      />
    )
  }

  return (
    <Typography.Text style={{ fontSize: compact ? 12 : 13 }}>
      {value !== undefined && value !== null ? String(value) : '—'}
    </Typography.Text>
  )
}
