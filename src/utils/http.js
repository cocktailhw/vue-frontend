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

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
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

    if (status === 401) {
      localStorage.removeItem('accessToken')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    } else if (status >= 500) {
      window.alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }

    return Promise.reject(error)
  },
)

export default http
