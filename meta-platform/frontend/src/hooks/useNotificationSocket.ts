import { useEffect, useRef } from 'react'
import { notification } from 'antd'
import { useNotificationStore, type Notification } from '@/store/notificationStore'

const NOTIFICATION_WS_BASE = 'ws://localhost:8001/ws'
const NOTIFICATION_API = 'http://localhost:8001'
const MAX_RETRIES = 8
const BASE_DELAY_MS = 1000

function eventIcon(eventType: string): string {
  if (eventType === 'record.created') return '🆕'
  if (eventType === 'record.deleted') return '🗑️'
  return '✏️'
}

export function useNotificationSocket() {
  const currentUser = useNotificationStore((s) => s.currentUser)
  const wsRef = useRef<WebSocket | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!currentUser) return

    // Флаг принадлежит конкретному вызову эффекта.
    // При cleanup становится false — WS1.onclose больше не запускает переподключение,
    // даже если userIdRef успел вернуться к тому же значению (React StrictMode).
    let active = true
    let retries = 0
    const userId = currentUser.id

    // Загружаем историю уведомлений сразу при подключении пользователя
    fetch(`${NOTIFICATION_API}/notifications/${userId}`)
      .then((r) => r.json())
      .then((data) => { if (active) useNotificationStore.getState().setNotifications(data) })
      .catch(() => {})

    function connect() {
      if (!active) return

      const ws = new WebSocket(`${NOTIFICATION_WS_BASE}/${userId}`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        if (!active) return
        try {
          const raw = JSON.parse(event.data)
          if (raw?.action === 'pong') return
          const notif = raw as Notification
          useNotificationStore.getState().addNotification(notif)
          notification.open({
            message: notif.entity_name,
            description: `${eventIcon(notif.event_type)} ${notif.message}`,
            placement: 'topRight',
            duration: 4,
          })
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        // Если эффект уже был очищен — не переподключаемся.
        // Это предотвращает создание лишнего соединения в React StrictMode.
        if (!active) return
        if (retries >= MAX_RETRIES) return
        const delay = BASE_DELAY_MS * Math.pow(2, retries)
        retries += 1
        timeoutRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      active = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      wsRef.current?.close()
    }
  }, [currentUser?.id])
}
