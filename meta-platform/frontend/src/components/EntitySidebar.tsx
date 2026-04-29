import { useState } from 'react'
import { Menu, Button, Typography, Tooltip, Popconfirm } from 'antd'
import {
  AppstoreOutlined,
  TableOutlined,
  FormOutlined,
  BorderOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { EntityMeta } from '@/types/meta'
import type React from 'react'

const LAYOUT_ICONS: Record<string, React.ReactNode> = {
  kanban: <BorderOutlined />,
  table:  <TableOutlined />,
  form:   <FormOutlined />,
  grid:   <AppstoreOutlined />,
}

interface EntitySidebarProps {
  metas: EntityMeta[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewEntity: () => void
  onEditSchema: (meta: EntityMeta) => void
  onDeleteSchema: (meta: EntityMeta) => void
}

export function EntitySidebar({ metas, selectedId, onSelect, onNewEntity, onEditSchema, onDeleteSchema }: EntitySidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const items = metas.map((meta) => ({
    key: meta.id,
    icon: LAYOUT_ICONS[meta.layout] ?? <AppstoreOutlined />,
    label: (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onMouseEnter={() => setHoveredId(meta.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.name}
        </span>
        {hoveredId === meta.id && (
          <span style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
            <Tooltip title="Edit schema">
              <EditOutlined
                style={{ fontSize: 12, color: '#9ca3af' }}
                onClick={(e) => { e.stopPropagation(); onEditSchema(meta) }}
              />
            </Tooltip>
            <Popconfirm
              title={`Delete "${meta.name}"?`}
              description="All records in this entity will also be deleted."
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={(e) => { e?.stopPropagation(); onDeleteSchema(meta) }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <DeleteOutlined
                style={{ fontSize: 12, color: '#f87171' }}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </span>
        )}
      </div>
    ),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Typography.Text strong style={{ fontSize: 13, color: '#374151' }}>
          Entities
        </Typography.Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={selectedId ? [selectedId] : []}
          items={items}
          onClick={({ key }) => onSelect(key)}
          style={{ border: 'none', fontSize: 13 }}
        />
        {metas.length === 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 12, padding: '12px 16px', display: 'block' }}>
            No entities yet
          </Typography.Text>
        )}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
        <Button
          block
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onNewEntity}
          size="small"
          style={{ fontSize: 12 }}
        >
          New Entity
        </Button>
      </div>
    </div>
  )
}
