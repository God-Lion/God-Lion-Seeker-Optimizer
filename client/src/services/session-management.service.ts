import { IAuth, ISession } from './../types'
import CryptoJS from 'crypto-js'

export interface SessionConfig {
  timeout: number
  absoluteTimeout: number
  refreshThreshold: number
  maxConcurrentSessions: number
  requireDeviceVerification: boolean
  rememberMe: boolean
  multiDevice: boolean
}

export interface SessionData {
  user: IAuth
  expiresAt: number
  absoluteExpiresAt: number
  lastActivity: number
  createdAt: number
  deviceFingerprint: string
  rememberMe: boolean
  ipAddress?: string
  userAgent: string
  sessionId: string
}

const STORAGE_KEY = 'app_session'
const ACTIVITY_KEY = 'last_activity'
const SESSIONS_KEY = 'active_sessions'

const DEFAULT_TIMEOUT = 15 * 60 * 1000
const REMEMBER_ME_DURATION = 7 * 24 * 60 * 60 * 1000
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000
const REFRESH_THRESHOLD = 5 * 60 * 1000
const MAX_CONCURRENT_SESSIONS = 3

class SecureSessionManagementService {
  private activityCheckInterval: NodeJS.Timeout | null = null
  private config: SessionConfig = {
    timeout: DEFAULT_TIMEOUT,
    absoluteTimeout: ABSOLUTE_TIMEOUT,
    refreshThreshold: REFRESH_THRESHOLD,
    maxConcurrentSessions: MAX_CONCURRENT_SESSIONS,
    requireDeviceVerification: true,
    rememberMe: false,
    multiDevice: true
  }

  initialize(config?: Partial<SessionConfig>): void {
    if (config) this.config = { ...this.config, ...config }
    this.startActivityMonitoring()
    this.checkSessionExpiry()
    this.cleanupExpiredSessions()
  }

  async createSession(authData: IAuth, rememberMe: boolean = false): Promise<SessionData> {
    const deviceFingerprint = await this.getDeviceFingerprint()
    
    const activeSessions = await this.getActiveSessions(authData._id)
    if (activeSessions.length >= this.config.maxConcurrentSessions) {
      await this.terminateOldestSession(authData._id)
    }

    const now = Date.now()
    const sessionId = this.generateSessionId()
    
    const sessionData: SessionData = {
      user: authData,
      expiresAt: now + (rememberMe ? REMEMBER_ME_DURATION : this.config.timeout),
      absoluteExpiresAt: now + this.config.absoluteTimeout,
      lastActivity: now,
      createdAt: now,
      deviceFingerprint,
      rememberMe,
      userAgent: navigator.userAgent,
      sessionId
    }

    this.saveSession(sessionData)
    this.updateLastActivity()
    await this.registerSession(sessionData)

    return sessionData
  }

  getSession(): SessionData | null {
    try {
      const data = this.getStorageItem(STORAGE_KEY)
      if (!data) return null

      const session: SessionData = JSON.parse(data)
      const now = Date.now()

      if (now > session.expiresAt || now > session.absoluteExpiresAt) {
        this.destroySession()
        return null
      }

      if (this.config.requireDeviceVerification) {
        this.verifyDeviceFingerprint(session.deviceFingerprint).then(isValid => {
          if (!isValid) {
            console.warn('Device fingerprint mismatch - potential session hijacking')
            this.destroySession()
          }
        })
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

    if (now > session.absoluteExpiresAt) {
      this.destroySession()
      return
    }

    if (!session.rememberMe) {
      session.expiresAt = Math.min(
        now + this.config.timeout,
        session.absoluteExpiresAt
      )
    }

    this.saveSession(session)
    this.updateLastActivity()
  }

  async refreshSession(): Promise<boolean> {
    const session = this.getSession()
    if (!session) return false

    try {
      const now = Date.now()
      
      if (now > session.absoluteExpiresAt) {
        this.destroySession()
        return false
      }

      const newTimeout = session.rememberMe ? REMEMBER_ME_DURATION : this.config.timeout
      session.expiresAt = Math.min(now + newTimeout, session.absoluteExpiresAt)
      session.lastActivity = now

      this.saveSession(session)
      return true
    } catch (error) {
      console.error('Error refreshing session:', error)
      return false
    }
  }

  needsRefresh(): boolean {
    const session = this.getSession()
    if (!session) return false

    const now = Date.now()
    const timeUntilExpiry = session.expiresAt - now

    return timeUntilExpiry < this.config.refreshThreshold
  }

  destroySession(): void {
    const session = this.getSession()
    if (session) {
      this.unregisterSession(session.sessionId)
    }
    
    this.removeStorageItem(STORAGE_KEY)
    this.removeStorageItem(ACTIVITY_KEY)
    this.stopActivityMonitoring()
  }

  getTimeUntilExpiry(): number {
    const session = this.getSession()
    if (!session) return 0

    const now = Date.now()
    return Math.max(0, Math.min(session.expiresAt - now, session.absoluteExpiresAt - now))
  }

  isUserActive(): boolean {
    const lastActivity = this.getLastActivity()
    if (!lastActivity) return false

    const now = Date.now()
    const inactiveTime = now - lastActivity
    
    return inactiveTime < 5 * 60 * 1000
  }

  getSessionInfo(): {
    isActive: boolean
    expiresIn: string
    absoluteExpiresIn: string
    lastActivity: string
    deviceFingerprint: string
    sessionAge: string
  } | null {
    const session = this.getSession()
    if (!session) return null

    const now = Date.now()
    const timeUntilExpiry = this.getTimeUntilExpiry()
    const absoluteTimeUntilExpiry = session.absoluteExpiresAt - now
    const lastActivity = this.getLastActivity() || 0
    const sessionAge = now - session.createdAt

    return {
      isActive: this.isUserActive(),
      expiresIn: this.formatDuration(timeUntilExpiry),
      absoluteExpiresIn: this.formatDuration(absoluteTimeUntilExpiry),
      lastActivity: this.formatTimestamp(lastActivity),
      deviceFingerprint: session.deviceFingerprint.substring(0, 8),
      sessionAge: this.formatDuration(sessionAge)
    }
  }

  async getActiveSessions(userId?: string): Promise<Array<ISession>> {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (!sessionsData) return []

      const allSessions: SessionData[] = JSON.parse(sessionsData)
      const now = Date.now()

      return allSessions
        .filter(s => {
          if (userId && s.user._id !== userId) return false
          return now <= s.absoluteExpiresAt
        })
        .map(s => ({
          id: s.sessionId,
          userId: s.user._id,
          device: this.parseUserAgent(s.userAgent).device,
          browser: this.parseUserAgent(s.userAgent).browser,
          ip: s.ipAddress || 'Unknown',
          location: 'Unknown',
          lastActive: new Date(s.lastActivity).toISOString(),
          current: s.sessionId === this.getSession()?.sessionId
        }))
    } catch (error) {
      console.error('Error getting active sessions:', error)
      return []
    }
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const currentSession = this.getSession()
    if (currentSession?.sessionId === sessionId) {
      this.destroySession()
      return true
    }

    return this.unregisterSession(sessionId)
  }

  private async getDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth.toString(),
      screen.width.toString(),
      screen.height.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || 'unknown',
      (navigator as any).deviceMemory?.toString() || 'unknown',
      navigator.platform,
      navigator.maxTouchPoints?.toString() || '0'
    ]

    const componentString = components.join('|')
    const fingerprint = CryptoJS.SHA256(componentString).toString()
    
    return fingerprint
  }

  private async verifyDeviceFingerprint(storedFingerprint: string): Promise<boolean> {
    const currentFingerprint = await this.getDeviceFingerprint()
    return currentFingerprint === storedFingerprint
  }

  private parseUserAgent(userAgent: string): { device: string; browser: string } {
    const ua = userAgent.toLowerCase()
    
    let browser = 'Unknown'
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'
    else if (ua.includes('opera')) browser = 'Opera'

    let device = 'Desktop'
    if (ua.includes('mobile')) device = 'Mobile'
    else if (ua.includes('tablet')) device = 'Tablet'
    
    return { device, browser }
  }

  private async registerSession(session: SessionData): Promise<void> {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      const sessions: SessionData[] = sessionsData ? JSON.parse(sessionsData) : []
      
      sessions.push(session)
      
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Error registering session:', error)
    }
  }

  private unregisterSession(sessionId: string): boolean {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (!sessionsData) return false

      const sessions: SessionData[] = JSON.parse(sessionsData)
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId)
      
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions))
      return true
    } catch (error) {
      console.error('Error unregistering session:', error)
      return false
    }
  }

  private async terminateOldestSession(userId: string): Promise<void> {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (!sessionsData) return

      const sessions: SessionData[] = JSON.parse(sessionsData)
      const userSessions = sessions
        .filter(s => s.user._id === userId)
        .sort((a, b) => a.createdAt - b.createdAt)

      if (userSessions.length > 0) {
        const oldestSession = userSessions[0]
        await this.terminateSession(oldestSession.sessionId)
        console.info('Terminated oldest session due to concurrent session limit')
      }
    } catch (error) {
      console.error('Error terminating oldest session:', error)
    }
  }

  private cleanupExpiredSessions(): void {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (!sessionsData) return

      const sessions: SessionData[] = JSON.parse(sessionsData)
      const now = Date.now()
      
      const activeSessions = sessions.filter(s => now <= s.absoluteExpiresAt)
      
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(activeSessions))
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    const random2 = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}-${random2}`
  }

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

  private updateLastActivity(): void {
    const now = Date.now()
    sessionStorage.setItem(ACTIVITY_KEY, now.toString())
  }

  private getLastActivity(): number {
    const activity = sessionStorage.getItem(ACTIVITY_KEY)
    return activity ? parseInt(activity, 10) : 0
  }

  private startActivityMonitoring(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    let throttleTimeout: NodeJS.Timeout | null = null
    const activityHandler = () => {
      if (throttleTimeout) return
      
      throttleTimeout = setTimeout(() => {
        this.updateActivity()
        throttleTimeout = null
      }, 1000)
    }

    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true })
    })

    this.activityCheckInterval = setInterval(() => {
      this.checkSessionExpiry()
      this.cleanupExpiredSessions()
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
    
    if (now > session.expiresAt || now > session.absoluteExpiresAt) {
      this.destroySession()
      
      if (window.location.pathname !== '/auth/signin') {
        window.location.href = '/auth/signin?reason=session_expired'
      }
      return
    }

    if (this.needsRefresh()) {
      this.refreshSession()
    }
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

export const sessionManagementService = new SecureSessionManagementService()

export default sessionManagementService
