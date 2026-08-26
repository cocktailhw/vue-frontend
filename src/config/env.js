const DEFAULT_API_BASE = '/api'

function runtimeEnv() {
  return typeof window !== 'undefined' && window._env_ ? window._env_ : {}
}

export function getAppEnv() {
  return String(runtimeEnv().APP_ENV || 'DEVELOPMENT').toUpperCase()
}

export function getApiBaseUrl() {
  return String(runtimeEnv().API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '')
}

export function isProductionEnv() {
  const env = getAppEnv()
  return env === 'PRODUCTION' || env === 'PRD'
}

export function getEnvBadgeLabel() {
  return isProductionEnv() ? 'PRD' : 'DEV'
}

/**
 * Join API base with a path. Dedupes a trailing `/api` on the base
 * when the path already starts with `/api/`.
 */
export function buildApiUrl(path) {
  const apiBaseUrl = getApiBaseUrl()
  let normalized = path.startsWith('/') ? path : `/${path}`
  if (apiBaseUrl.endsWith('/api') && normalized.startsWith('/api/')) {
    normalized = normalized.slice(4)
  }
  return `${apiBaseUrl}${normalized}`
}
