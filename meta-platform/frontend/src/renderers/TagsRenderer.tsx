import { Select, Tag } from 'antd'
import type { FieldRendererProps } from './FieldRenderer'

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean)
  return []
}

export function TagsRenderer({ value, onChange }: FieldRendererProps) {
  const tags = toArray(value)

  if (onChange) {
    return (
      <Select
        mode="tags"
        value={tags}
        onChange={(val) => onChange(val)}
        style={{ width: '100%' }}
        size="small"
        placeholder="Add tags…"
        tokenSeparators={[',']}
      />
    )
  }

  if (!tags.length) return <span style={{ fontSize: 13, color: '#d1d5db' }}>—</span>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {tags.map((tag) => (
        <Tag key={tag} style={{ margin: 0, fontSize: 11 }}>{tag}</Tag>
      ))}
    </div>
  )
}
