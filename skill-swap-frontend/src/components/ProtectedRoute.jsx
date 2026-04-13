import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * If `fallback` is provided, render it for unauthenticated users instead of redirecting
 * (used for the home `/` route so unauthenticated users see the landing page).
 */
export default function ProtectedRoute({ children, fallback }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    if (fallback) return fallback
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}