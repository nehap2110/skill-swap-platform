import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { extractError } from '../services/api'
import Button from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-50">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-jade-50 border-2 border-jade-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔑</div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Forgot your password?</h1>
          <p className="text-ink-400 mt-1.5 text-sm leading-relaxed">
            No worries. Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="card p-8 text-center space-y-4 animate-scale-in">
            <div className="text-6xl">📬</div>
            <h2 className="font-display font-bold text-ink-800 text-xl">Check your inbox</h2>
            <p className="text-sm text-ink-500 leading-relaxed">
              If an account exists for{' '}
              <span className="font-semibold text-ink-800">{email}</span>,
              you'll receive a password reset link within a few minutes.
            </p>
            <p className="text-xs text-ink-400">
              Didn't see it? Check your spam folder, or{' '}
              <button onClick={() => setSent(false)} className="text-jade-600 underline">
                try again
              </button>.
            </p>
            <Link to="/login" className="btn-md btn-outline w-full justify-center block mt-4">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Send reset link
              </Button>
            </form>
            <div className="text-center">
              <Link to="/login" className="text-sm text-ink-400 hover:text-jade-600 transition-colors">
                ← Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}