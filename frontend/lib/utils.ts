import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length)
  }

  const masked = '*'.repeat(data.length - visibleChars)
  return masked + data.slice(-visibleChars)
}

export function calculateRiskScore(factors: Record<string, number>): number {
  const weights = {
    loginAttempts: 0.3,
    locationAnomaly: 0.25,
    timeAnomaly: 0.2,
    deviceAnomaly: 0.15,
    behaviorAnomaly: 0.1
  }

  let score = 0
  for (const [factor, value] of Object.entries(factors)) {
    const weight = weights[factor as keyof typeof weights] || 0.1
    score += value * weight
  }

  return Math.min(Math.max(score, 0), 100)
}

export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function isValidCSRFToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token)
}

export function encodeBase64(data: string): string {
  return btoa(unescape(encodeURIComponent(data)))
}

export function decodeBase64(data: string): string {
  return decodeURIComponent(escape(atob(data)))
}

export function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  })
}

export function generateSecureRandom(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

export function isSecureContext(): boolean {
  return window.isSecureContext || location.protocol === 'https:'
}

export function detectAnomalies(data: number[], threshold: number = 2): number[] {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)

  return data.map((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev)
    return zScore > threshold ? index : -1
  }).filter(index => index !== -1)
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000
}
