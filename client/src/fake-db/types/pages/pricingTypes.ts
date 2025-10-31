/**
 * Pricing Plan Types
 * 
 * Type definitions for pricing plans and related data
 */

export interface PricingPlanType {
  id: string
  title: string
  subtitle?: string
  price: number
  currency?: string
  interval?: 'month' | 'year'
  features: string[]
  popular?: boolean
  buttonText?: string
  color?: string
  recommended?: boolean
  badge?: string
}

export interface PricingFeature {
  id: string
  text: string
  included: boolean
  highlighted?: boolean
}

export interface PricingComparison {
  feature: string
  basic: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

export default PricingPlanType
