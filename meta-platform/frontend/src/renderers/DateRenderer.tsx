import { DatePicker, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FieldRendererProps } from './FieldRenderer'

export function DateRenderer({ value, onChange, compact }: FieldRendererProps) {
  const str = (value as string) ?? ''

  if (onChange) {
    return (
      <DatePicker
        value={str ? dayjs(str) : null}
        onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : null)}
        style={{ width: '100%' }}
        size="small"
        format="YYYY-MM-DD"
      />
    )
  }

  if (!str) return <Typography.Text style={{ fontSize: 13, color: '#9ca3af' }}>—</Typography.Text>

  try {
    const formatted = dayjs(str).format(compact ? 'D MMM' : 'D MMM YYYY')
    return <Typography.Text style={{ fontSize: compact ? 12 : 13 }}>{formatted}</Typography.Text>
  } catch {
    return <Typography.Text style={{ fontSize: 13 }}>{str}</Typography.Text>
  }
}
