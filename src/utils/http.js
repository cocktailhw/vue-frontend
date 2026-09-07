import axios from 'axios'
import { getApiBaseUrl } from '../config/env'
import { useUiStore } from '../stores/ui'

/**
 * Central HTTP client for portal APIs.
 * Auth: HttpOnly cookie via withCredentials (no Bearer header / localStorage token).
 */
const http = axios.create({
  baseURL: getApiBaseUrl() || import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

/** Called on 401/403 (avoids circular import with Pinia). */
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

/** Clear leftover tokens from the previous Bearer/localStorage auth scheme. */
export function clearLegacyAccessToken() {
  localStorage.removeItem('accessToken')
  sessionStorage.removeItem('accessToken')
}

function getUi() {
  try {
    return useUiStore()
  } catch {
    return null
  }
}

function isAuthEndpoint(config) {
  const url = String(config?.url || '')
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/me')
  )
}

/**
 * Skip global error toast for statuses usually handled in forms.
 * Override with `config.skipGlobalErrorToast = true` (or false to force).
 */
function shouldSkipGlobalErrorToast(status, config) {
  if (config?.skipGlobalErrorToast === true) return true
  if (config?.skipGlobalErrorToast === false) return false
  return status === 401 || status === 403 || status === 409
}

function extractErrorMessage(error) {
  const data = error.response?.data
  const fromBody =
    data?.message ||
    data?.error ||
    data?.detail ||
    (typeof data === 'string' ? data : null)
  if (fromBody) return String(fromBody)
  if (error.message) return error.message
  return '요청 처리 중 오류가 발생했습니다.'
}

http.interceptors.request.use(
  (config) => {
    if (!config.skipGlobalLoading) {
      getUi()?.startLoading()
    }
    return config
  },
  (error) => {
    if (!error.config?.skipGlobalLoading) {
      getUi()?.stopLoading()
    }
    return Promise.reject(error)
  },
)

http.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoading) {
      getUi()?.stopLoading()
    }

    const body = response.data

    if (response.config?.responseType === 'blob' || body instanceof Blob) {
      return body
    }

    // ResultResponse / ApiResponse: axios response.data.data
    if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
      return body.data
    }

    return body
  },
  (error) => {
    const config = error.config || {}
    if (!config.skipGlobalLoading) {
      getUi()?.stopLoading()
    }

    const status = error.response?.status
    const ui = getUi()

    if ((status === 401 || status === 403) && !isAuthEndpoint(config)) {
      unauthorizedHandler?.({ status })
      // Session expired on protected APIs — still notify unless opted out
      if (config.skipGlobalErrorToast !== true) {
        ui?.showToast('인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.', 'error')
      }
    } else if (!shouldSkipGlobalErrorToast(status, config)) {
      ui?.showToast(extractErrorMessage(error), 'error')
    }

    return Promise.reject(error)
  },
)

export default http
