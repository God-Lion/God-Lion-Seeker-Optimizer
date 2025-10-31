import { IAuth, ISession } from 'src/types'

export interface SessionConfig {
  timeout: number // Session timeout in milliseconds
  refreshThreshold: number // Time before expiry to trigger refresh (ms)
  rememberMe: boolean
  multiDevice: boolean
}

export interface SessionData {
  user: IAuth
  expiresAt: number
  lastActivity: number
  deviceId: string
  rememberMe: boolean
}

const STORAGE_KEY = 'app_session'
const ACTIVITY_KEY = 'last_activity'
const DEFAULT_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
const REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

class SessionManagementService {
  private activityCheckInterval: NodeJS.Timeout | null = null
  private config: SessionConfig = {
    timeout: DEFAULT_TIMEOUT,
    refreshThreshold: REFRESH_THRESHOLD,
    rememberMe: false,
    multiDevice: true
  }

  /**
   * Initialize session management
   */
  initialize(config?: Partial<SessionConfig>): void {
    if (config) this.config = { ...this.config, ...config }

    this.startActivityMonitoring()

    this.checkSessionExpiry()
  }

  createSession(authData: IAuth, rememberMe: boolean = false): SessionData {
    const now = Date.now()
    const timeout = rememberMe ? REMEMBER_ME_DURATION : this.config.timeout
    
    const sessionData: SessionData = {
      user: authData,
      expiresAt: now + timeout,
      lastActivity: now,
      deviceId: this.getDeviceId(),
      rememberMe
    }

    this.saveSession(sessionData)
    this.updateLastActivity()

    return sessionData
  }

  getSession(): SessionData | null {
    try {
      const data = this.getStorageItem(STORAGE_KEY)
      if (!data) return null

      const session: SessionData = JSON.parse(data)
      

      if (Date.now() > session.expiresAt) {
        this.destroySession()
        return null
      }

      return session
    } catch (error) {
      console.error('Error reading session:', error)
      return null
    }
  }


  updateActivity(): void {
    const session = this.getSession()
    if (!session) return

    const now = Date.now()
    session.lastActivity = now

    if (!session.rememberMe) session.expiresAt = now + this.config.timeout

    this.saveSession(session)
    this.updateLastActivity()
  }


  async refreshSession(): Promise<boolean> {
    const session = this.getSession()
    if (!session) return false

    try {
      // In a real app, you'd call an API to refresh the token
      // For now, just extend the session
      const now = Date.now()
      session.expiresAt = now + (session.rememberMe ? REMEMBER_ME_DURATION : this.config.timeout)
      session.lastActivity = now

      this.saveSession(session)
      return true
    } catch (error) {
      console.error('Error refreshing session:', error)
      return false
    }
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(): boolean {
    const session = this.getSession()
    if (!session) return false

    const now = Date.now()
    const timeUntilExpiry = session.expiresAt - now

    return timeUntilExpiry < this.config.refreshThreshold
  }

  destroySession(): void {
    this.removeStorageItem(STORAGE_KEY)
    this.removeStorageItem(ACTIVITY_KEY)
    this.stopActivityMonitoring()
  }

  getTimeUntilExpiry(): number {
    const session = this.getSession()
    if (!session) return 0

    const now = Date.now()
    return Math.max(0, session.expiresAt - now)
  }


  isUserActive(): boolean {
    const lastActivity = this.getLastActivity()
    if (!lastActivity) return false

    const now = Date.now()
    const inactiveTime = now - lastActivity
    
    // Consider user inactive after 5 minutes
    return inactiveTime < 5 * 60 * 1000
  }

  getSessionInfo(): {
    isActive: boolean
    expiresIn: string
    lastActivity: string
    deviceId: string
  } | null {
    const session = this.getSession()
    if (!session) return null

    const timeUntilExpiry = this.getTimeUntilExpiry()
    const lastActivity = this.getLastActivity() || 0

    return {
      isActive: this.isUserActive(),
      expiresIn: this.formatDuration(timeUntilExpiry),
      lastActivity: this.formatTimestamp(lastActivity),
      deviceId: session.deviceId
    }
  }

  /**
   * Get all active sessions for the user (from backend)
   */
  async getActiveSessions(): Promise<Array<ISession>> {
    // This would call your backend API
    // For now, return empty array
    return []
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string): Promise<boolean> {
    // This would call your backend API
    // For now, if it's the current session, destroy it
    const currentSession = this.getSession()
    if (currentSession?.deviceId === sessionId) {
      this.destroySession()
      return true
    }
    return false
  }

  /**
   * Private helper methods
   */

  private saveSession(session: SessionData): void {
    try {
      const storage = session.rememberMe ? localStorage : sessionStorage
      storage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  private getStorageItem(key: string): string | null {
    return sessionStorage.getItem(key) || localStorage.getItem(key)
  }

  private removeStorageItem(key: string): void {
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = this.generateDeviceId()
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  private generateDeviceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private updateLastActivity(): void {
    const now = Date.now()
    sessionStorage.setItem(ACTIVITY_KEY, now.toString())
  }

  private getLastActivity(): number {
    const activity = sessionStorage.getItem(ACTIVITY_KEY)
    return activity ? parseInt(activity, 10) : 0
  }

  private startActivityMonitoring(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    const activityHandler = () => {
      this.updateActivity()
    }

    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true })
    })

    this.activityCheckInterval = setInterval(() => {
      this.checkSessionExpiry()
    }, 60 * 1000)
  }

  private stopActivityMonitoring(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval)
      this.activityCheckInterval = null
    }
  }

  private checkSessionExpiry(): void {
    const session = this.getSession()
    if (!session) return

    const now = Date.now()
    
    if (now > session.expiresAt) {
      this.destroySession()
      window.location.href = '/auth/signin'
      return
    }

    if (this.needsRefresh()) this.refreshSession()
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }

  private formatTimestamp(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 24) return new Date(timestamp).toLocaleDateString()
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  cleanup(): void {
    this.destroySession()
  }
}

export const sessionManagementService = new SessionManagementService()

export default sessionManagementService
