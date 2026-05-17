// ─── F18: Localization Utility ─────────────────────────────────────────────────
import { getLocales } from 'expo-localization'

const deviceLocale = getLocales()[0]

export const currencyCode = deviceLocale?.regionCode === 'EG' ? 'EGP' : 'USD'

export const formatPrice = (amount) =>
  new Intl.NumberFormat(deviceLocale?.languageTag ?? 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)