import { useEffect } from 'react'
import { Avatar, Select, Tag } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import { useNotificationStore } from '@/store/notificationStore'
import { api } from '@/api/client'
import type { User } from '@/store/notificationStore'

const AVATAR_COLORS: Record<string, string> = {
  engineering: '#2563eb',
  design:      '#7c3aed',
}

const GROUP_COLORS: Record<string, string> = {
  engineering: 'blue',
  design:      'purple',
}

export function UserSelector() {
  const { users, currentUser, setUsers, setCurrentUser } = useNotificationStore()

  useEffect(() => {
    api.get<User[]>('/users')
      .then(setUsers)
      .catch(() => {})
  }, [])

  if (!users.length) return null

  const avatarColor = (u: User) => AVATAR_COLORS[u.group] ?? '#6b7280'

  return (
    <Select
      value={currentUser?.id}
      onChange={(id) => {
        const user = users.find((u) => u.id === id)
        if (user) setCurrentUser(user)
      }}
      style={{ width: 220 }}
      variant="borderless"
      optionRender={(opt) => {
        const user = users.find((u) => u.id === opt.value)
        if (!user) return opt.label
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={20} style={{ background: avatarColor(user), fontSize: 11, flexShrink: 0 }}>
              {user.name[0]}
            </Avatar>
            <span style={{ flex: 1 }}>{user.name}</span>
            <Tag color={GROUP_COLORS[user.group] ?? 'default'} style={{ margin: 0, fontSize: 10 }}>
              {user.group}
            </Tag>
            {user.role === 'admin' && (
              <CrownOutlined style={{ color: '#f59e0b', fontSize: 12 }} />
            )}
          </span>
        )
      }}
      labelRender={(opt) => {
        const user = users.find((u) => u.id === opt.value)
        if (!user) return opt.label
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar size={18} style={{ background: avatarColor(user), fontSize: 10, flexShrink: 0 }}>
              {user.name[0]}
            </Avatar>
            <span>{user.name}</span>
            {user.role === 'admin' && (
              <CrownOutlined style={{ color: '#f59e0b', fontSize: 11 }} />
            )}
          </span>
        )
      }}
      options={users.map((u) => ({ value: u.id, label: u.name }))}
    />
  )
}
