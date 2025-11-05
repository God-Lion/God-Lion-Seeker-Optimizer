import { apiClient } from '../../../shared/api/api-client'
import { ENDPOINTS } from '../../../shared/api/config'
import { AxiosResponse } from 'axios'

export interface Notification {
  id: number
  user_id: number
  type: 'job_match' | 'application_update' | 'interview' | 'system' | 'recommendation'
  title: string
  message: string
  is_read: boolean
  priority: 'low' | 'medium' | 'high'
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
  unread_count: number
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  job_match_notifications: boolean
  application_updates: boolean
  interview_reminders: boolean
  weekly_digest: boolean
}

class NotificationsService {
  async getNotifications(params: {
    skip?: number
    limit?: number
    is_read?: boolean
    type?: string
  } = {}): Promise<AxiosResponse<NotificationListResponse>> {
    const searchParams = new URLSearchParams()
    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.is_read !== undefined) searchParams.append('is_read', String(params.is_read))
    if (params.type) searchParams.append('type', params.type)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.notifications.list}?${queryString}` : ENDPOINTS.notifications.list

    return apiClient.get<NotificationListResponse>(url)
  }

  async markAsRead(notificationId: number): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(ENDPOINTS.notifications.read(notificationId), {})
  }

  async markAllAsRead(): Promise<AxiosResponse<{ message: string; count: number }>> {
    return apiClient.put<{ message: string; count: number }>(ENDPOINTS.notifications.readAll, {})
  }

  async deleteNotification(notificationId: number): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(ENDPOINTS.notifications.delete(notificationId))
  }

  async clearAll(): Promise<AxiosResponse<{ message: string; count: number }>> {
    return apiClient.delete<{ message: string; count: number }>(ENDPOINTS.notifications.clearAll)
  }

  async getPreferences(): Promise<AxiosResponse<NotificationPreferences>> {
    return apiClient.get<NotificationPreferences>(ENDPOINTS.notifications.preferences)
  }

  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<AxiosResponse<NotificationPreferences>> {
    return apiClient.put<NotificationPreferences>(ENDPOINTS.notifications.preferences, preferences)
  }

  async getUnreadCount(): Promise<AxiosResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>(ENDPOINTS.notifications.unreadCount)
  }

  connectWebSocket(onMessage: (notification: Notification) => void): WebSocket {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${ENDPOINTS.notifications.ws}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data)
        onMessage(notification)
      } catch (error) {
        console.error('Failed to parse notification:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return ws
  }
}

export const notificationsService = new NotificationsService()
