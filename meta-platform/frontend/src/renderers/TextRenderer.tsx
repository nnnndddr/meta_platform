import { Input, Typography } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

export function TextRenderer({ field, value, onChange, compact }: FieldRendererProps) {
  const xui = field['x-ui'] ?? {}

  if (onChange) {
    return (
      <Input
        value={(value as string) ?? ''}
        placeholder={xui.placeholder ?? ''}
        readOnly={xui.readonly}
        onChange={(e) => onChange(e.target.value)}
        size="small"
      />
    )
  }

  return (
    <Typography.Text style={{ fontSize: compact ? 12 : 13 }}>
      {(value as string) || '—'}
    </Typography.Text>
  )
}
