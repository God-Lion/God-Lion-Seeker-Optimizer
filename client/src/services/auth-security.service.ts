export interface FailedLoginAttempt {
  email: string
  timestamp: number
  ip?: string
  device?: string
}

export interface LoginSecurity {
  attempts: number
  lastAttempt: number
  lockedUntil: number | null
  requiresCaptcha: boolean
}

const STORAGE_KEY = 'auth_security'
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const CAPTCHA_THRESHOLD = 2 // Show CAPTCHA after 2 failed attempts

class AuthSecurityService {
  /**
   * Get security data for an email
   */
  getSecurityData(email: string): LoginSecurity {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return this.getDefaultSecurity()

      const allData: Record<string, LoginSecurity> = JSON.parse(data)
      return allData[email] || this.getDefaultSecurity()
    } catch (error) {
      console.error('Error reading security data:', error)
      return this.getDefaultSecurity()
    }
  }

  recordFailedAttempt(email: string, additionalInfo?: { ip?: string; device?: string }): LoginSecurity {
    const security = this.getSecurityData(email)
    const now = Date.now()

    // If account is currently locked, don't increment attempts
    if (security.lockedUntil && security.lockedUntil > now) return security

    // Reset attempts if last attempt was more than 1 hour ago
    if (now - security.lastAttempt > 60 * 60 * 1000) security.attempts = 0

    security.attempts++
    security.lastAttempt = now

    if (security.attempts >= MAX_ATTEMPTS) security.lockedUntil = now + LOCKOUT_DURATION

    if (security.attempts >= CAPTCHA_THRESHOLD) security.requiresCaptcha = true
    

    this.saveSecurityData(email, security)

    this.logFailedAttempt({
      email,
      timestamp: now,
      ...additionalInfo
    })

    return security
  }

  recordSuccessfulLogin(email: string): void {
    this.saveSecurityData(email, this.getDefaultSecurity())
  }

  isAccountLocked(email: string): { locked: boolean; remainingTime?: number } {
    const security = this.getSecurityData(email)
    const now = Date.now()

    if (security.lockedUntil && security.lockedUntil > now) {
      return {
        locked: true,
        remainingTime: security.lockedUntil - now
      }
    }

    return { locked: false }
  }

  /**
   * Check if CAPTCHA is required
   */
  requiresCaptcha(email: string): boolean {
    const security = this.getSecurityData(email)
    return security.requiresCaptcha
  }

  /**
   * Manually unlock an account (admin function)
   */
  unlockAccount(email: string): void {
    this.saveSecurityData(email, this.getDefaultSecurity())
  }


  getLockoutTimeRemaining(email: string): string {
    const lockStatus = this.isAccountLocked(email)
    if (!lockStatus.locked || !lockStatus.remainingTime) {
      return ''
    }

    const minutes = Math.ceil(lockStatus.remainingTime / 60000)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }


  validatePasswordStrength(password: string): {
    isValid: boolean
    strength: 'weak' | 'medium' | 'strong'
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < 8) feedback.push('Password must be at least 8 characters long')
    else if (password.length >= 12) score += 2
    else score += 1

    // Uppercase check
    if (!/[A-Z]/.test(password)) feedback.push('Include at least one uppercase letter')
      else score += 1

    // Lowercase check
    if (!/[a-z]/.test(password))
      feedback.push('Include at least one lowercase letter')
    else score += 1

    // Number check
    if (!/\d/.test(password))
      feedback.push('Include at least one number')
    else score += 1
    
    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      feedback.push('Include at least one special character')
    else score += 1

    // Common patterns check
    const commonPatterns = ['password', '12345', 'qwerty', 'abc123']
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      feedback.push('Avoid common patterns like "password" or "12345"')
      score -= 2
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong'
    if (score >= 5) strength = 'strong'
    else if (score >= 3) strength = 'medium'
    else strength = 'weak'

    return {
      isValid: feedback.length === 0 && score >= 3,
      strength,
      feedback
    }
  }

  private getDefaultSecurity(): LoginSecurity {
    return {
      attempts: 0,
      lastAttempt: 0,
      lockedUntil: null,
      requiresCaptcha: false
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
      const logs = localStorage.getItem('auth_failed_attempts_log')
      const logArray: FailedLoginAttempt[] = logs ? JSON.parse(logs) : []
      
      // Keep only last 100 attempts
      logArray.push(attempt)
      if (logArray.length > 100) logArray.shift()
      
      localStorage.setItem('auth_failed_attempts_log', JSON.stringify(logArray))
    } catch (error) {
      console.error('Error logging failed attempt:', error)
    }
  }

  getFailedAttempts(limit: number = 10): FailedLoginAttempt[] {
    try {
      const logs = localStorage.getItem('auth_failed_attempts_log')
      const logArray: FailedLoginAttempt[] = logs ? JSON.parse(logs) : []
      return logArray.slice(-limit)
    } catch (error) {
      console.error('Error reading failed attempts:', error)
      return []
    }
  }

  clearAllSecurityData(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('auth_failed_attempts_log')
  }
}

export const authSecurityService = new AuthSecurityService()

export default authSecurityService
