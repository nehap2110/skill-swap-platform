import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api, { extractError } from '../services/api'
import { connectSocket, disconnectSocket } from '../socket/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized           = useRef(false)

  // Initialise on mount — verify stored token still valid
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(({ data }) => {
        const u = data.data
        setUser(u)
        localStorage.setItem('user', JSON.stringify(u))
        connectSocket(token)          // open socket after token confirmed
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { accessToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    connectSocket(accessToken)        // open socket immediately after login
    return u
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    const { accessToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    connectSocket(accessToken)
    return u
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    disconnectSocket()                // tear down socket on logout
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    setUser(data.data)
    localStorage.setItem('user', JSON.stringify(data.data))
    return data.data
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}