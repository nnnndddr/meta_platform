import { Checkbox, Typography } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

export function CheckboxRenderer({ field, value, onChange }: FieldRendererProps) {
  const checked = Boolean(value)

  if (onChange) {
    return (
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)}>
        {field.label}
      </Checkbox>
    )
  }

  return (
    <Typography.Text style={{ fontSize: 13, color: checked ? '#16a34a' : '#9ca3af' }}>
      {checked ? '✓ Yes' : '✗ No'}
    </Typography.Text>
  )
}
