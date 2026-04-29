import { Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import type { ActionMeta, EntityMeta } from '@/types/meta'

const ICONS: Record<string, React.ReactNode> = {
  plus:     <PlusOutlined />,
  trash:    <DeleteOutlined />,
  settings: <SettingOutlined />,
}

const VARIANT: Record<string, 'primary' | 'default' | 'danger'> = {
  primary:   'primary',
  secondary: 'default',
  danger:    'danger',
}

import type React from 'react'

interface ActionBarProps {
  meta: EntityMeta
  onAction: (actionId: string) => void
}

export function ActionBar({ meta, onAction }: ActionBarProps) {
  return (
    <Space>
      {meta.actions.map((action: ActionMeta) => (
        <Button
          key={action.id}
          type={VARIANT[action.variant] === 'primary' ? 'primary' : 'default'}
          danger={action.variant === 'danger'}
          icon={action.icon ? ICONS[action.icon] : undefined}
          size="small"
          onClick={() => onAction(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </Space>
  )
}
