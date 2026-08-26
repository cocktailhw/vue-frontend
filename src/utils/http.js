import axios from 'axios'

/**
 * Central HTTP client for portal APIs.
 * baseURL comes from Vite env (e.g. /api) so Nginx can proxy in each environment.
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
})

/** Called on 401/403 after tokens are cleared (avoids circular import with Pinia). */
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

export function getAccessToken() {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
}

export function clearAccessToken() {
  localStorage.removeItem('accessToken')
  sessionStorage.removeItem('accessToken')
}

function isAuthRequest(config) {
  const url = String(config?.url || '')
  return url.includes('/auth/login') || url.includes('/auth/signup')
}

http.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => {
    const body = response.data

    // ResultResponse / ApiResponse: axios response.data.data
    if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
      return body.data
    }

    return body
  },
  (error) => {
    const status = error.response?.status
    const config = error.config

    if ((status === 401 || status === 403) && !isAuthRequest(config)) {
      clearAccessToken()
      unauthorizedHandler?.({ status })
      window.alert('인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.')
    } else if (status >= 500) {
      window.alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }

    return Promise.reject(error)
  },
)

export default http
