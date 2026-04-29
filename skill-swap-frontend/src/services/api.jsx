import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api` || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(() => api(original)).catch(() => Promise.reject(err))
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.data?.accessToken
        if (newToken) {
          localStorage.setItem('accessToken', newToken)
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`
          refreshQueue.forEach(p => p.resolve())
          refreshQueue = []
          return api(original)
        }
      } catch {
        refreshQueue.forEach(p => p.reject())
        refreshQueue = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export const extractError = (err) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  'Something went wrong. Please try again.'

export default api