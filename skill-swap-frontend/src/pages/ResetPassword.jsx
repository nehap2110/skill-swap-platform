import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api, { extractError } from '../services/api'
import Button from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'

const STRENGTH_LABELS = ['', 'Too weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-jade-400', 'bg-jade-500']
const STRENGTH_TEXT   = ['', 'text-rose-600', 'text-amber-600', 'text-amber-500', 'text-jade-500', 'text-jade-600']

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)            score++
  if (pw.length >= 12)           score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw))  score++
  return Math.min(score, 5)
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token') || ''

  const [form, setForm]       = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const strength = getStrength(form.password)
  const handle = (e) => { setError(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8)               { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(form.password))           { setError('Password must contain at least one uppercase letter.'); return }
    if (!/[0-9]/.test(form.password))           { setError('Password must contain at least one number.'); return }
    if (!token)                                 { setError('Reset token is missing. Please use the link from your email.'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        password:        form.password,
        confirmPassword: form.confirmPassword,
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 3500)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  // Invalid / missing token
  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-50">
      <div className="card p-8 max-w-sm w-full text-center space-y-4 animate-scale-in">
        <span className="text-5xl">⚠️</span>
        <h2 className="font-display font-bold text-ink-800 text-xl">Invalid Reset Link</h2>
        <p className="text-sm text-ink-400 leading-relaxed">
          This reset link is missing or has expired. Please request a new one.
        </p>
        <Link to="/forgot-password" className="btn-md btn-jade w-full justify-center block">
          Request new link
        </Link>
        <Link to="/login" className="block text-sm text-ink-400 hover:text-jade-600 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-50">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-jade-50 border-2 border-jade-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Set new password</h1>
          <p className="text-ink-400 mt-1.5 text-sm">Choose a strong password to protect your account.</p>
        </div>

        {done ? (
          <div className="card p-8 text-center space-y-4 animate-scale-in">
            <div className="text-6xl">✅</div>
            <h2 className="font-display font-bold text-ink-800 text-xl">Password updated!</h2>
            <p className="text-sm text-ink-500 leading-relaxed">
              Your password has been changed. Redirecting you to sign in…
            </p>
            <div className="w-full bg-ink-100 rounded-full h-1 overflow-hidden">
              <div className="bg-jade-500 h-1 rounded-full animate-[shimmer_3.5s_linear_1]" style={{ width: '100%' }} />
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handle}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="input pr-12"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-400 hover:text-ink-700">
                    {showPw ? 'hide' : 'show'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? STRENGTH_COLORS[strength] : 'bg-ink-100'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>
                      {STRENGTH_LABELS[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <input
                  name="confirmPassword"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={handle}
                  placeholder="••••••••"
                  className={`input ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  autoComplete="new-password"
                />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-rose-600 mt-1">Passwords don't match</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}
                disabled={strength < 3 || form.password !== form.confirmPassword}>
                Reset password
              </Button>
            </form>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-ink-400 hover:text-jade-600 transition-colors">
                Request a new link instead
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}