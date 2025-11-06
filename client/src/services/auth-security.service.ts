/**
 * Enhanced Auth Security Service
 * 
 * ⚠️ IMPORTANT: This is CLIENT-SIDE rate limiting for UX purposes only.
 * It can be bypassed and should NOT be relied upon for security.
 * 
 * ALWAYS implement rate limiting on the BACKEND with:
 * - IP-based rate limiting
 * - Account-based rate limiting  
 * - CAPTCHA verification
 * - Email notifications for suspicious activity
 * 
 * @see DOCS/RATE_LIMITING_IMPLEMENTATION.md for backend implementation
 */

export interface FailedLoginAttempt {
  email: string
  timestamp: number
  ip?: string
  device?: string
  userAgent?: string
}

export interface LoginSecurity {
  attempts: number
  lastAttempt: number
  lockedUntil: number | null
  requiresCaptcha: boolean
  lockoutLevel: number
  alertSent: boolean
}

export interface RateLimitConfig {
  attempts: number[]
  lockouts: number[]
  captchaThreshold: number
  alertThreshold: number
  resetWindow: number
}

const STORAGE_KEY = 'auth_security'
const ATTEMPT_LOG_KEY = 'auth_failed_attempts_log'

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  attempts: [3, 5, 10],
  lockouts: [15, 60, 1440],
  captchaThreshold: 2,
  alertThreshold: 5,
  resetWindow: 60 * 60 * 1000
}

class EnhancedAuthSecurityService {
  private config: RateLimitConfig = DEFAULT_RATE_LIMITS

  configure(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getSecurityData(email: string): LoginSecurity {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return this.getDefaultSecurity()

      const allData: Record<string, LoginSecurity> = JSON.parse(data)
      const security = allData[email] || this.getDefaultSecurity()

      const now = Date.now()
      if (now - security.lastAttempt > this.config.resetWindow) {
        return this.getDefaultSecurity()
      }

      return security
    } catch (error) {
      console.error('Error reading security data:', error)
      return this.getDefaultSecurity()
    }
  }

  recordFailedAttempt(email: string, additionalInfo?: { 
    ip?: string
    device?: string
    userAgent?: string 
  }): LoginSecurity {
    const security = this.getSecurityData(email)
    const now = Date.now()

    if (security.lockedUntil && security.lockedUntil > now) {
      console.warn(`Account locked. Remaining time: ${this.getLockoutTimeRemaining(email)}`)
      return security
    }

    if (security.lockedUntil && security.lockedUntil <= now) {
      security.lockedUntil = null
    }

    if (now - security.lastAttempt > this.config.resetWindow) {
      security.attempts = 0
      security.lockoutLevel = 0
      security.alertSent = false
    }

    security.attempts++
    security.lastAttempt = now

    const lockoutLevel = this.determineLockoutLevel(security.attempts)
    security.lockoutLevel = lockoutLevel

    if (security.attempts >= this.config.attempts[lockoutLevel]) {
      const lockoutDuration = this.config.lockouts[lockoutLevel] * 60 * 1000
      security.lockedUntil = now + lockoutDuration
      
      console.warn(
        `Account locked for ${this.config.lockouts[lockoutLevel]} minutes ` +
        `(Level ${lockoutLevel + 1})`
      )
    }

    if (security.attempts >= this.config.captchaThreshold) {
      security.requiresCaptcha = true
    }

    if (security.attempts >= this.config.alertThreshold && !security.alertSent) {
      this.sendSecurityAlert(email, security.attempts)
      security.alertSent = true
    }

    this.saveSecurityData(email, security)
    this.logFailedAttempt({
      email,
      timestamp: now,
      userAgent: navigator.userAgent,
      ...additionalInfo
    })

    return security
  }

  recordSuccessfulLogin(email: string): void {
    const security = this.getSecurityData(email)
    
    if (security.attempts > 0) {
      console.info(`Successful login after ${security.attempts} failed attempts`)
    }
    
    this.saveSecurityData(email, this.getDefaultSecurity())
  }

  isAccountLocked(email: string): { 
    locked: boolean
    remainingTime?: number
    lockoutLevel?: number 
  } {
    const security = this.getSecurityData(email)
    const now = Date.now()

    if (security.lockedUntil && security.lockedUntil > now) {
      return {
        locked: true,
        remainingTime: security.lockedUntil - now,
        lockoutLevel: security.lockoutLevel
      }
    }

    return { locked: false }
  }

  requiresCaptcha(email: string): boolean {
    const security = this.getSecurityData(email)
    return security.requiresCaptcha
  }

  unlockAccount(email: string): void {
    console.info(`Manually unlocking account: ${email}`)
    this.saveSecurityData(email, this.getDefaultSecurity())
  }

  getLockoutTimeRemaining(email: string): string {
    const lockStatus = this.isAccountLocked(email)
    if (!lockStatus.locked || !lockStatus.remainingTime) {
      return ''
    }

    const totalMinutes = Math.ceil(lockStatus.remainingTime / 60000)
    
    if (totalMinutes >= 1440) {
      const days = Math.floor(totalMinutes / 1440)
      const hours = Math.floor((totalMinutes % 1440) / 60)
      return `${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`
    } else if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`
    } else {
      return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`
    }
  }

  getSecurityStatus(email: string): {
    attempts: number
    isLocked: boolean
    requiresCaptcha: boolean
    lockoutLevel: number
    remainingTime: string
    nextLockoutThreshold: number
  } {
    const security = this.getSecurityData(email)
    const lockStatus = this.isAccountLocked(email)
    const lockoutLevel = security.lockoutLevel
    const nextThreshold = this.config.attempts[Math.min(lockoutLevel + 1, this.config.attempts.length - 1)]

    return {
      attempts: security.attempts,
      isLocked: lockStatus.locked,
      requiresCaptcha: security.requiresCaptcha,
      lockoutLevel: lockoutLevel,
      remainingTime: this.getLockoutTimeRemaining(email),
      nextLockoutThreshold: nextThreshold
    }
  }

  validatePasswordStrength(password: string): {
    isValid: boolean
    strength: 'weak' | 'medium' | 'strong' | 'very-strong'
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long')
    } else if (password.length >= 16) {
      score += 3
    } else if (password.length >= 12) {
      score += 2
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Include at least one uppercase letter')
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Include at least one lowercase letter')
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      feedback.push('Include at least one number')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Include at least one special character')
    } else {
      score += 2
    }

    const commonPatterns = [
      'password', '12345', 'qwerty', 'abc123', 'letmein',
      'admin', 'welcome', 'monkey', '111111', 'password1'
    ]
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      feedback.push('Avoid common patterns like "password" or "12345"')
      score -= 3
    }

    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating characters')
      score -= 1
    }

    let strength: 'weak' | 'medium' | 'strong' | 'very-strong'
    if (score >= 8) strength = 'very-strong'
    else if (score >= 6) strength = 'strong'
    else if (score >= 4) strength = 'medium'
    else strength = 'weak'

    return {
      isValid: feedback.length === 0 && score >= 4,
      strength,
      score: Math.max(0, score),
      feedback
    }
  }

  private determineLockoutLevel(attempts: number): number {
    for (let i = this.config.attempts.length - 1; i >= 0; i--) {
      if (attempts >= this.config.attempts[i]) {
        return i
      }
    }
    return 0
  }

  private sendSecurityAlert(email: string, attempts: number): void {
    console.warn(
      `⚠️ SECURITY ALERT: ${attempts} failed login attempts for ${email}\n` +
      `This should trigger an email notification on the backend.`
    )

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Security Alert', {
          body: `Multiple failed login attempts detected for ${email}`,
          icon: '/security-alert-icon.png'
        })
      }
    }
  }

  private getDefaultSecurity(): LoginSecurity {
    return {
      attempts: 0,
      lastAttempt: 0,
      lockedUntil: null,
      requiresCaptcha: false,
      lockoutLevel: 0,
      alertSent: false
    }
  }

  private saveSecurityData(email: string, security: LoginSecurity): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      const allData: Record<string, LoginSecurity> = data ? JSON.parse(data) : {}
      allData[email] = security
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
    } catch (error) {
      console.error('Error saving security data:', error)
    }
  }

  private logFailedAttempt(attempt: FailedLoginAttempt): void {
    try {
      const logs = localStorage.getItem(ATTEMPT_LOG_KEY)
      const logArray: FailedLoginAttempt[] = logs ? JSON.parse(logs) : []
      
      logArray.push(attempt)
      if (logArray.length > 100) {
        logArray.shift()
      }
      
      localStorage.setItem(ATTEMPT_LOG_KEY, JSON.stringify(logArray))
    } catch (error) {
      console.error('Error logging failed attempt:', error)
    }
  }

  getFailedAttempts(limit: number = 10): FailedLoginAttempt[] {
    try {
      const logs = localStorage.getItem(ATTEMPT_LOG_KEY)
      const logArray: FailedLoginAttempt[] = logs ? JSON.parse(logs) : []
      return logArray.slice(-limit).reverse()
    } catch (error) {
      console.error('Error reading failed attempts:', error)
      return []
    }
  }

  getFailedAttemptsForEmail(email: string, limit: number = 10): FailedLoginAttempt[] {
    const allAttempts = this.getFailedAttempts(100)
    return allAttempts
      .filter(attempt => attempt.email === email)
      .slice(0, limit)
  }

  getSecurityMetrics(): {
    totalAccounts: number
    lockedAccounts: number
    accountsRequiringCaptcha: number
    recentFailedAttempts: number
  } {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return {
          totalAccounts: 0,
          lockedAccounts: 0,
          accountsRequiringCaptcha: 0,
          recentFailedAttempts: 0
        }
      }

      const allData: Record<string, LoginSecurity> = JSON.parse(data)
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      let lockedAccounts = 0
      let accountsRequiringCaptcha = 0

      Object.values(allData).forEach(security => {
        if (security.lockedUntil && security.lockedUntil > now) {
          lockedAccounts++
        }
        if (security.requiresCaptcha) {
          accountsRequiringCaptcha++
        }
      })

      const logs = localStorage.getItem(ATTEMPT_LOG_KEY)
      const logArray: FailedLoginAttempt[] = logs ? JSON.parse(logs) : []
      const recentFailedAttempts = logArray.filter(
        attempt => attempt.timestamp > oneHourAgo
      ).length

      return {
        totalAccounts: Object.keys(allData).length,
        lockedAccounts,
        accountsRequiringCaptcha,
        recentFailedAttempts
      }
    } catch (error) {
      console.error('Error getting security metrics:', error)
      return {
        totalAccounts: 0,
        lockedAccounts: 0,
        accountsRequiringCaptcha: 0,
        recentFailedAttempts: 0
      }
    }
  }

  clearAllSecurityData(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ATTEMPT_LOG_KEY)
    console.info('All security data cleared')
  }

  clearSecurityDataForEmail(email: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return

      const allData: Record<string, LoginSecurity> = JSON.parse(data)
      delete allData[email]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
      
      console.info(`Security data cleared for ${email}`)
    } catch (error) {
      console.error('Error clearing security data:', error)
    }
  }
}

export const authSecurityService = new EnhancedAuthSecurityService()

export default authSecurityService
