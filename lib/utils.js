// ─────────────────────────────────────────────────────────────────────────────
// F18 — Localization & Currency Formatting Utilities
//
// What this does:
//   - Grabs the user's primary system locale (e.g., en-US, ar-EG).
//   - Dynamically determines if the region is Egypt ('EG') to serve 'EGP',
//     otherwise defaults to 'USD'.
//   - Formats product numbers into clean, localized currency strings.
// ─────────────────────────────────────────────────────────────────────────────

import { getLocales } from 'expo-localization'

// Fetch the system's preferred locale block
const deviceLocale = getLocales()[0]

// Determine target currency based on region code
export const currencyCode = deviceLocale?.regionCode === 'EG' ? 'EGP' : 'USD'

/**
 * Formats a raw numerical price into a clean localized currency presentation string.
 * @param {number} amount - The numeric price of the product item.
 * @returns {string} - The cleanly formatted currency value (e.g., "EGP 150.00" or "$150.00").
 */
export const formatPrice = (amount) =>
  new Intl.NumberFormat(deviceLocale?.languageTag ?? 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)