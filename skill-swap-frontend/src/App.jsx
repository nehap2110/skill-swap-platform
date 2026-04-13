import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar          from './components/Navbar'
import Footer          from './components/Footer'
import ProtectedRoute  from './components/ProtectedRoute'
import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import ForgotPassword  from './pages/ForgotPassword'
import ResetPassword   from './pages/ResetPassword'
import About           from './pages/About'
import Contact         from './pages/Contact'
import Dashboard       from './pages/Dashboard'
import Skills          from './pages/Skills'
import Matches         from './pages/Matches'
import Swaps           from './pages/Swaps'
import Chat            from './pages/Chat'
import Reviews         from './pages/Reviews'

// Routes where we hide the footer (chat uses full height)
const NO_FOOTER_ROUTES = ['/chat/']

function Spinner() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-ink-100" />
          <div className="absolute inset-0 rounded-full border-4 border-jade-500 border-t-transparent animate-spin" />
        </div>
        <p className="font-mono text-xs text-ink-300 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  )
}

export default function App() {
  const { loading } = useAuth()
  const location    = useLocation()

  if (loading) return <Spinner />

  const hideFooter = NO_FOOTER_ROUTES.some(p => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          {/* Public / marketing routes */}
          <Route path="/landing"         element={<Home />} />
          <Route path="/about"           element={<About />} />
          <Route path="/contact"         element={<Contact />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Protected app routes */}
          <Route path="/"                element={<ProtectedRoute fallback={<Home />}><Dashboard /></ProtectedRoute>} />
          <Route path="/skills"          element={<ProtectedRoute><Skills /></ProtectedRoute>} />
          <Route path="/matches"         element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/swaps"           element={<ProtectedRoute><Swaps /></ProtectedRoute>} />
          <Route path="/chat/:swapId"    element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/reviews/:swapId" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}