/**
 * Shared View Types
 * 
 * Type definitions for various views and components
 */

export interface ICategory {
  id: string | number
  name: string
  description?: string
  icon?: string
  count?: number
  color?: string
  slug?: string
}

export interface IEddition {
  id: string | number
  name: string
  date: string
  description?: string
  status?: string
}

export interface IParticipant {
  id: string | number
  name: string
  email: string
  role?: string
  avatar?: string
}

export interface IPhase {
  id: string | number
  name: string
  status: string
  startDate?: string
  endDate?: string
  progress?: number
}

export interface IProvider {
  id: string | number
  name: string
  type: string
  description?: string
  logo?: string
  active?: boolean
}

export interface IUser {
  id: string | number
  firstName: string
  lastName: string
  email: string
  role: number
  avatar?: string
  status?: string
}

// Re-export for backward compatibility
export type { ICategory as Category }
export type { IEddition as Eddition }
export type { IParticipant as Participant }
export type { IPhase as Phase }
export type { IProvider as Provider }
export type { IUser as User }
