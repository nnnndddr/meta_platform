import { Select, Tag, Typography } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

const ANTD_COLORS: Record<string, string> = {
  gray:   'default',
  blue:   'blue',
  yellow: 'gold',
  green:  'green',
  orange: 'orange',
  red:    'red',
}

export function SelectRenderer({ field, value, onChange, compact }: FieldRendererProps) {
  const xui = field['x-ui'] ?? {}
  const isMulti = field.type === 'multiselect'
  const options = (field.options ?? []).map((o) => ({ label: o, value: o }))

  if (onChange) {
    return (
      <Select
        mode={isMulti ? 'multiple' : undefined}
        value={(value as string | string[]) ?? (isMulti ? [] : undefined)}
        onChange={(v) => onChange(v)}
        options={options}
        style={{ width: '100%' }}
        size="small"
        placeholder="Select…"
        allowClear
      />
    )
  }

  // Badge display for select
  if (xui.widget === 'badge' && value) {
    const colorKey = xui.color_map?.[value as string] ?? 'gray'
    const color = ANTD_COLORS[colorKey] ?? 'default'
    return <Tag color={color} style={{ margin: 0, fontSize: compact ? 11 : 12 }}>{value as string}</Tag>
  }

  // Multiselect display
  if (isMulti && Array.isArray(value) && value.length) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(value as string[]).map((v) => (
          <Tag key={v} style={{ margin: 0, fontSize: 11 }}>{v}</Tag>
        ))}
      </div>
    )
  }

  return (
    <Typography.Text style={{ fontSize: compact ? 12 : 13 }}>
      {(value as string) || '—'}
    </Typography.Text>
  )
}
