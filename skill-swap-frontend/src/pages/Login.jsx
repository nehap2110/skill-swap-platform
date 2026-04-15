import { useState ,useEffect} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractError } from '../services/api'
import Button from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'

export default function Login() {
  const { login, user ,refreshUser} = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  //if (user) { navigate(from, { replace: true }); return null }

  useEffect(() => {
  if (user) {
    navigate(from, { replace: true });
    
  }
}, [user])

  

  const handle = (e) => { setError(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      await refreshUser()

      
      navigate(from, { replace: true })
    } catch (err) { setError(extractError(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col lg:w-[45%] bg-ink-900 text-white p-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 10% 60%, #16a579 0%, transparent 55%), radial-gradient(ellipse at 90% 10%, #0ea5e9 0%, transparent 50%)' }} />
        <div className="relative flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center font-display font-bold text-sm">S</div>
            <span className="font-display font-bold text-xl">SkillSwap</span>
          </div>
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-5xl font-bold leading-[1.1] mb-4">
                Share what<br /><em className="text-jade-400 not-italic">you know.</em><br />Learn what<br />you don't.
              </h1>
              <p className="text-ink-300 leading-relaxed max-w-sm">
                Connect with skilled people worldwide. Offer what you're great at, get what you need — no money required.
              </p>
            </div>
            <div className="flex gap-10">
              {[['3.2k', 'Members'], ['850+', 'Skills'], ['12k', 'Swaps done']].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-bold text-jade-400">{n}</p>
                  <p className="text-ink-400 text-sm">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-ink-600 text-xs">© {new Date().getFullYear()} SkillSwap. Trade knowledge freely.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">S</div>
              <span className="font-display font-bold text-ink-900 text-xl">SkillSwap</span>
            </Link>
            <h2 className="font-display text-3xl font-bold text-ink-900">Welcome back</h2>
            <p className="text-ink-400 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="card p-6 space-y-4">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input name="email" type="email" autoComplete="email" required value={form.email} onChange={handle} placeholder="you@example.com" className="input" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-jade-600 hover:underline font-medium">Forgot?</Link>
                </div>
                <div className="relative">
                  <input name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={handle} placeholder="••••••••" className="input pr-10" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 text-xs font-mono">
                    {showPw ? 'hide' : 'show'}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
            </form>
          </div>

          <p className="text-center text-sm text-ink-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-jade-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}