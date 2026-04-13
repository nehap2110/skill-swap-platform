import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const AUTH_LINKS = [
  { to: '/',        label: 'Dashboard', icon: '⌂' },
  { to: '/skills',  label: 'Skills',    icon: '💡' },
  { to: '/matches', label: 'Matches',   icon: '🤝' },
  { to: '/swaps',   label: 'Swaps',     icon: '🔄' },
]

const PUBLIC_LINKS = [
  { to: '/landing', label: 'Home' },
  { to: '/about',   label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [open, setOpen]        = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }
  const navLinks = user ? AUTH_LINKS : PUBLIC_LINKS

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-white border-b border-ink-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <Link to={user ? '/' : '/landing'} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">S</div>
          <span className="font-display font-bold text-ink-900 text-lg hidden sm:block">SkillSwap</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-jade-50 text-jade-700' : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                }`
              }>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            /* Authenticated user menu */
            <div className="relative" ref={menuRef}>
              <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-ink-50 transition-colors">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-ink-800 leading-tight max-w-[120px] truncate">{user.name}</p>
                  <p className="text-xs text-ink-400 leading-tight">★ {(user.rating || 0).toFixed(1)}</p>
                </div>
                <svg className={`w-3.5 h-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-hover border border-ink-100 py-1.5 z-50 animate-scale-in origin-top-right">
                  <div className="px-3.5 py-2.5 border-b border-ink-50 mb-1">
                    <p className="text-xs text-ink-400 mb-0.5">Logged in as</p>
                    <p className="text-sm font-semibold text-ink-800 truncate">{user.email}</p>
                  </div>
                  {AUTH_LINKS.map(({ to, label, icon }) => (
                    <Link key={to} to={to} onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <span>{icon}</span> {label}
                    </Link>
                  ))}
                  <hr className="my-1 border-ink-50" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                    <span>🚪</span> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest buttons */
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-sm btn-outline hidden sm:inline-flex">Sign in</Link>
              <Link to="/register" className="btn-sm btn-jade">Get started</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-ink-50 transition-colors">
            <svg className="w-5 h-5 text-ink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-ink-100 px-4 py-3 space-y-1 shadow-md animate-slide-up">
          {navLinks.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-jade-50 text-jade-700' : 'text-ink-600 hover:bg-ink-50'
                }`
              }>
              {icon && <span>{icon}</span>} {label}
            </NavLink>
          ))}
          {!user && (
            <div className="flex gap-2 pt-2 border-t border-ink-50 mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-sm btn-outline flex-1 justify-center">Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-sm btn-jade flex-1 justify-center">Get started</Link>
            </div>
          )}
          {user && (
            <button onClick={() => { handleLogout(); setMobileOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <span>🚪</span> Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}