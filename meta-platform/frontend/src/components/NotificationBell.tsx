import { useState } from 'react'
import { Badge, Button, Empty, List, Popover, Tooltip, Typography } from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationStore, type Notification } from '@/store/notificationStore'

const NOTIFICATION_API = 'http://localhost:8001'

const EVENT_ICONS: Record<string, string> = {
  'record.created': '🆕',
  'record.updated': '✏️',
  'record.deleted': '🗑️',
}

function NotificationItem({ notif, onDelete }: { notif: Notification; onDelete: (id: string) => void }) {
  const relativeTime = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })
  return (
    <List.Item
      style={{ padding: '8px 12px', background: notif.read ? 'transparent' : '#f0f7ff', borderRadius: 6, marginBottom: 2 }}
      actions={[
        <Tooltip title="Dismiss" key="del">
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(notif.id)}
            style={{ color: '#9ca3af' }}
          />
        </Tooltip>,
      ]}
    >
      <List.Item.Meta
        avatar={<span style={{ fontSize: 18 }}>{EVENT_ICONS[notif.event_type] ?? '🔔'}</span>}
        title={<Typography.Text style={{ fontSize: 13 }}>{notif.message}</Typography.Text>}
        description={
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {notif.entity_name} · {relativeTime}
          </Typography.Text>
        }
      />
    </List.Item>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { currentUser, notifications, unreadCount, setNotifications, markAllRead, removeNotification } =
    useNotificationStore()

  async function handleOpenChange(visible: boolean) {
    setOpen(visible)
    if (visible && currentUser) {
      try {
        const res = await fetch(`${NOTIFICATION_API}/notifications/${currentUser.id}`)
        if (res.ok) {
          const data: Notification[] = await res.json()
          setNotifications(data)
        }
      } catch {
        // notification service unavailable
      }
    }
  }

  async function handleMarkAllRead() {
    if (!currentUser) return
    markAllRead()
    await fetch(`${NOTIFICATION_API}/notifications/${currentUser.id}/read-all`, { method: 'POST' }).catch(() => {})
  }

  async function handleDelete(id: string) {
    if (!currentUser) return
    removeNotification(id)
    await fetch(`${NOTIFICATION_API}/notifications/${currentUser.id}/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const content = (
    <div style={{ width: 380, maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button size="small" type="text" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" style={{ margin: '24px 0' }} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => <NotificationItem key={n.id} notif={n} onDelete={handleDelete} />}
            split={false}
          />
        )}
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      arrow={false}
      overlayStyle={{ paddingTop: 4 }}
      overlayInnerStyle={{ padding: 12 }}
    >
      <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
        />
      </Badge>
    </Popover>
  )
}
