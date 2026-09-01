import axios from 'axios'
import { getApiBaseUrl } from '../config/env'

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

function isAuthEndpoint(config) {
  const url = String(config?.url || '')
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/me')
  )
}

http.interceptors.response.use(
  (response) => {
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
    const status = error.response?.status
    const config = error.config

    if ((status === 401 || status === 403) && !isAuthEndpoint(config)) {
      unauthorizedHandler?.({ status })
      window.alert('인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.')
    } else if (status >= 500) {
      window.alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }

    return Promise.reject(error)
  },
)

export default http
