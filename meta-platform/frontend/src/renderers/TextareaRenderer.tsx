import { Input, Typography } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

export function TextareaRenderer({ field, value, onChange }: FieldRendererProps) {
  const xui = field['x-ui'] ?? {}

  if (onChange) {
    return (
      <Input.TextArea
        value={(value as string) ?? ''}
        placeholder={xui.placeholder ?? ''}
        readOnly={xui.readonly}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ resize: 'none' }}
      />
    )
  }

  return (
    <Typography.Paragraph
      style={{ fontSize: 13, color: '#4b5563', marginBottom: 0, whiteSpace: 'pre-wrap' }}
    >
      {(value as string) || '—'}
    </Typography.Paragraph>
  )
}
