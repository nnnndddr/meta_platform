import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  group: string
  role: string
}

export interface Notification {
  id: string
  user_id: string
  event_type: string
  entity_id: string
  entity_name: string
  record_id: string
  record_title: string
  message: string
  created_at: string
  read: boolean
}

interface NotificationStore {
  currentUser: User | null
  users: User[]
  notifications: Notification[]
  unreadCount: number
  setCurrentUser: (user: User) => void
  setUsers: (users: User[]) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (n: Notification) => void
  markAllRead: () => void
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      notifications: [],
      unreadCount: 0,

      setCurrentUser: (user) => set({ currentUser: user, notifications: [], unreadCount: 0 }),

      setUsers: (users) => {
        set((s) => {
          // Auto-select first user if none selected yet
          const currentUser = s.currentUser ?? (users.length > 0 ? users[0] : null)
          return { users, currentUser }
        })
      },

      setNotifications: (notifications) =>
        set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),

      addNotification: (n) =>
        set((s) => {
          // Дедупликация: то же id может прийти дважды из-за двух WS-соединений (React StrictMode)
          if (s.notifications.some((x) => x.id === n.id)) return s
          const notifications = [n, ...s.notifications].slice(0, 100)
          return { notifications, unreadCount: notifications.filter((x) => !x.read).length }
        }),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((s) => {
          const notifications = s.notifications.filter((n) => n.id !== id)
          return { notifications, unreadCount: notifications.filter((n) => !n.read).length }
        }),
    }),
    {
      name: 'notification-store',
      partialize: (s) => ({ currentUser: s.currentUser }),
    }
  )
)
