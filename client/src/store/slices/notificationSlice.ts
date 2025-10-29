import { StateCreator } from 'zustand'

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'job_match'
  | 'application_update'
  | 'scraper_complete'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export interface NotificationSlice {
  // State
  notifications: Notification[]
  unreadCount: number

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearNotifications: () => void
  getUnreadNotifications: () => Notification[]
}

const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const createNotificationSlice: StateCreator<
  NotificationSlice,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notificationData) => {
    set((state) => {
      const notification: Notification = {
        ...notificationData,
        id: generateNotificationId(),
        timestamp: new Date().toISOString(),
        read: false,
      }
      
      state.notifications.unshift(notification)
      state.unreadCount += 1

      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    })
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      state.notifications.forEach((n) => {
        n.read = true
      })
      state.unreadCount = 0
    })
  },

  deleteNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
      state.notifications = state.notifications.filter((n) => n.id !== id)
    })
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = []
      state.unreadCount = 0
    })
  },

  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.read)
  },
})
