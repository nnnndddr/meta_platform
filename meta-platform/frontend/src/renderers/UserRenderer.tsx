import { Avatar, Input, Space, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { FieldRendererProps } from './FieldRenderer'

export function UserRenderer({ value, onChange, compact }: FieldRendererProps) {
  const name = (value as string) ?? ''

  if (onChange) {
    return (
      <Input
        value={name}
        placeholder="Assignee name"
        onChange={(e) => onChange(e.target.value)}
        prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
        size="small"
      />
    )
  }

  if (!name) return <Typography.Text style={{ fontSize: 13, color: '#9ca3af' }}>Unassigned</Typography.Text>

  const initial = name.charAt(0).toUpperCase()

  return (
    <Space size={6}>
      <Avatar size={compact ? 18 : 22} style={{ backgroundColor: '#6366f1', fontSize: compact ? 9 : 11 }}>
        {initial}
      </Avatar>
      {!compact && <Typography.Text style={{ fontSize: 13 }}>{name}</Typography.Text>}
    </Space>
  )
}
