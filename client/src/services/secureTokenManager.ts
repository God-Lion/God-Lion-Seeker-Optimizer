export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

class SecureTokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private expiresAt: number | null = null

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  getExpiresAt(): number | null {
    return this.expiresAt
  }

  getTokens(): TokenData | null {
    if (!this.accessToken || !this.refreshToken || !this.expiresAt) {
      return null
    }

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
    }
  }

  setTokens(tokens: TokenData): void {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    this.expiresAt = tokens.expiresAt
  }

  setAccessToken(token: string): void {
    this.accessToken = token
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token
  }

  setExpiresAt(expiresAt: number): void {
    this.expiresAt = expiresAt
  }

  clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true
    
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000
    
    return now >= this.expiresAt - bufferTime
  }

  hasTokens(): boolean {
    return this.accessToken !== null && this.refreshToken !== null
  }
}

export const secureTokenManager = new SecureTokenManager()

export default secureTokenManager
