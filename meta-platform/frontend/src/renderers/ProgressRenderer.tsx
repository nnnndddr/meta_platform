import { InputNumber, Progress } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

export function ProgressRenderer({ value, onChange }: FieldRendererProps) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))

  if (onChange) {
    return (
      <InputNumber
        value={pct}
        min={0}
        max={100}
        onChange={(v) => onChange(v ?? 0)}
        style={{ width: '100%' }}
        size="small"
        addonAfter="%"
      />
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Progress
        percent={pct}
        size="small"
        style={{ flex: 1, marginBottom: 0 }}
        showInfo={false}
      />
      <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}
