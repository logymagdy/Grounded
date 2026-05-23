import { getLocales } from 'expo-localization'


const deviceLocale = getLocales()[0]

export const currencyCode = deviceLocale?.regionCode === 'EG' ? 'EGP' : 'USD'

/**

 * @param {number} amount 
 * @returns {string} 
 */
export const formatPrice = (amount) => {
  const safeAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  return new Intl.NumberFormat(deviceLocale?.languageTag ?? 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(safeAmount)
}

/**
 * Safely parses any ISO timestamp into a clean, human-readable display date
 * @param {string|Date} timestamp - The database created_at stamp
 * @returns {string} - e.g., "May 19, 2026"
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(deviceLocale?.languageTag ?? 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Global standardized log utility for monitoring background service errors cleanly
 * @param {string} context - Where the exception occurred (e.g., "Supabase Storage Upload")
 * @param {Error|object} error - The caught error instance
 */
export const logError = (context, error) => {
  console.error(`[App Error Context: ${context}]:`, error?.message || error)
}