import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractError } from '../services/api'
import Button from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'

const STRENGTH_LABELS = ['', 'Too weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-jade-400', 'bg-jade-500']

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 5)
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const strength = getStrength(form.password)
  const handle = (e) => { setError(''); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) { setError(extractError(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-50">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-jade-500 rounded-xl flex items-center justify-center font-display font-bold text-white">S</div>
            <span className="font-display font-bold text-ink-900 text-xl">SkillSwap</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink-900">Create your account</h1>
          <p className="text-ink-400 mt-1 text-sm">Start swapping skills with people worldwide</p>
        </div>

        <div className="card p-6">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {error && <div className="mb-4" />}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input name="name" required value={form.name} onChange={handle} placeholder="Alex Johnson" className="input" autoComplete="name" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" required value={form.email} onChange={handle} placeholder="you@example.com" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} required value={form.password} onChange={handle} placeholder="Min 8 chars, 1 uppercase, 1 number" className="input pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 text-xs font-mono">{showPw ? 'hide' : 'show'}</button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? STRENGTH_COLORS[strength] : 'bg-ink-100'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength >= 4 ? 'text-jade-600' : strength >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input name="confirmPassword" type={showPw ? 'text' : 'password'} required value={form.confirmPassword} onChange={handle} placeholder="••••••••" className={`input ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-rose-400 focus:ring-rose-400' : ''}`} autoComplete="new-password" />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-xs text-rose-600 mt-1">Passwords don't match</p>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>Create account</Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-jade-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}