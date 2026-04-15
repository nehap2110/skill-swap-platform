import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Lightbulb, Handshake, RefreshCcw,
  LogOut, ChevronDown, Menu, X, Star, Globe, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const AUTH_NAV = [
  { to: '/',        label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/skills',  label: 'Skills',    Icon: Lightbulb },
  { to: '/matches', label: 'Matches',   Icon: Handshake },
  { to: '/swaps',   label: 'Swaps',     Icon: RefreshCcw },
]

const PUBLIC_NAV = [
  { to: '/landing', label: 'Home',    Icon: Globe },
  { to: '/about',   label: 'About',   Icon: User },
  { to: '/contact', label: 'Contact', Icon: Handshake },
]

const menuVariants = {
  closed: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
  open:   { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}

const dropdownVariants = {
  closed: { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.15 } },
  open:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] } },
}

const itemVariants = {
  closed: { opacity: 0, x: -12 },
  open:   (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
}

export default function Navbar() {
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()
  const location            = useLocation()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [dropOpen, setDropOpen]     = useState(false)
  const dropRef = useRef(null)

  // Scroll detection for glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false) }, [location.pathname])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }
  const navLinks = user ? AUTH_NAV : PUBLIC_NAV

  return (
    <>
      <motion.nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-ink-950/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-b border-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-5 h-[68px] flex items-center gap-6">

          {/* ── Logo ── */}
          <Link to={user ? '/' : '/landing'} className="flex items-center gap-2.5 flex-shrink-0 group">
            <motion.div
              className="w-9 h-9 bg-jade-500 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span className="font-display font-bold text-white text-base leading-none">S</span>
            </motion.div>
            <span className="font-display font-bold text-jade-400 text-xl tracking-tight hidden sm:block">
              Skill<span className="text-jade-400">Swap</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/' || to === '/landing'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-jade-400 bg-jade-500/10'
                      : 'text-ink-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }>
                {({ isActive }) => (
                  <>
                    <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2.5 ml-auto">
            {user ? (
              /* ── User dropdown ── */
              <div className="relative" ref={dropRef}>
                <motion.button
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors border border-white/[0.08]"
                  whileTap={{ scale: 0.97 }}
                >
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-600 leading-tight max-w-[110px] truncate">{user.name}</p>
                    <p className="text-[11px] text-ink-400 leading-tight flex items-center gap-0.5">
                      <Star size={9} className="text-amber-400" strokeWidth={0} fill="currentColor" />
                      {(user.rating || 0).toFixed(1)}
                    </p>
                  </div>
                  <motion.div animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-ink-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="closed" animate="open" exit="closed"
                      className="absolute right-0 mt-2 w-56 bg-ink-900/95 backdrop-blur-xl rounded-2xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-white/[0.07]">
                        <p className="text-[11px] text-ink-500 font-medium uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-white mt-0.5 truncate">{user.email}</p>
                      </div>
                      {/* Links */}
                      <div className="py-1.5">
                        {AUTH_NAV.map(({ to, label, Icon }, i) => (
                          <motion.div key={to} custom={i} variants={itemVariants} initial="closed" animate="open">
                            <Link to={to} onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                              <Icon size={15} strokeWidth={1.8} className="text-ink-500" />
                              {label}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                      <div className="py-1.5 border-t border-white/[0.07]">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.08] transition-colors">
                          <LogOut size={15} strokeWidth={1.8} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ── Guest buttons ── */
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  Sign in
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-jade-500 text-white hover:bg-jade-400 transition-colors shadow-[0_0_20px_rgba(22,165,121,0.3)]">
                    Get started
                  </Link>
                </motion.div>
              </div>
            )}

            {/* ── Mobile hamburger ── */}
            <motion.button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-ink-300 hover:text-white"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={menuOpen ? 'x' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed" animate="open" exit="closed"
              className="md:hidden overflow-hidden bg-ink-950/95 backdrop-blur-xl border-t border-white/[0.06]"
            >
              <div className="px-5 py-4 space-y-1">
                {navLinks.map(({ to, label, Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.2 }}
                  >
                    <NavLink to={to} end={to === '/' || to === '/landing'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-jade-500/15 text-jade-400' : 'text-ink-300 hover:bg-white/[0.06] hover:text-white'
                        }`
                      }>
                      <Icon size={16} strokeWidth={1.8} />
                      {label}
                    </NavLink>
                  </motion.div>
                ))}

                {!user && (
                  <motion.div
                    className="pt-3 border-t border-white/[0.07] flex gap-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  >
                    <Link to="/login" className="flex-1 py-2.5 text-center text-sm text-ink-300 hover:text-white border border-white/[0.1] rounded-xl transition-colors">Sign in</Link>
                    <Link to="/register" className="flex-1 py-2.5 text-center text-sm font-semibold bg-jade-500 text-white rounded-xl hover:bg-jade-400 transition-colors">Get started</Link>
                  </motion.div>
                )}

                {user && (
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    Sign out
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}