/**
 * Dashboard.jsx
 *
 * Bug fixes applied:
 * 1. user.publicProfile uses 'id' not '_id' — handle both.
 * 2. skillsOffered / skillsWanted may contain ObjectId strings or objects.
 *    Use skillName() utility.
 * 3. Rating display: user.rating is a Number, guard against NaN.
 * 4. Stats fetch: GET /swaps returns data.data.swaps array.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import { skillName } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import StarRating from '../components/StarRating'
import ErrorAlert from '../components/ErrorAlert'

function ProfileEditor({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:     user.name     || '',
    bio:      user.bio      || '',
    location: user.location || '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(extractError(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 w-full">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Full name</label>
          <input name="name" value={form.name} onChange={handle} className="input" required />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" value={form.location} onChange={handle}
            placeholder="City, Country" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea name="bio" value={form.bio} onChange={handle}
          rows={3} maxLength={300} placeholder="Tell others what you're about…"
          className="input resize-none" />
        <p className="text-xs text-ink-400 text-right mt-1">{form.bio.length}/300</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Save changes</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default function Dashboard() {
  const { user, refreshUser, updateUser } = useAuth()
  const [editing, setEditing]  = useState(false)
  const [success, setSuccess]  = useState('')
  const [stats, setStats]      = useState(null)

  useEffect(() => {
    // Load swap counts for dashboard widgets
    api.get('/swaps', { params: { role: 'all' } })
      .then(({ data }) => {
        const swaps = data.data?.swaps || []
        setStats({
          total:     swaps.length,
          active:    swaps.filter(s => s.status === 'accepted').length,
          completed: swaps.filter(s => s.status === 'completed').length,
          pending:   swaps.filter(s => s.status === 'pending').length,
        })
      })
      .catch(() => setStats({ total: 0, active: 0, completed: 0, pending: 0 }))
  }, [])

  const handleSave = async (patch) => {
    const { data } = await api.put('/users/me', patch)
    // Response: { data: publicProfile }
    updateUser(data.data)
    await refreshUser()
    setEditing(false)
    setSuccess('Profile updated!')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!user) return null

  const offered = user.skillsOffered || []
  const wanted  = user.skillsWanted  || []
  const rating  = typeof user.rating === 'number' ? user.rating : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {success && (
        <div className="p-3.5 rounded-xl bg-jade-50 border border-jade-200 text-sm text-jade-700 flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative flex-shrink-0">
            <Avatar name={user.name} src={user.avatar} size="xl" />
            {user.isVerified && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-jade-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">✓</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <ProfileEditor user={user} onSave={handleSave} onCancel={() => setEditing(false)} />
            ) : (
              <>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-ink-900">{user.name}</h1>
                    {user.location && <p className="text-sm text-ink-400 mt-0.5">📍 {user.location}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit profile
                  </Button>
                </div>
                {user.bio
                  ? <p className="text-ink-600 text-sm mt-2 leading-relaxed max-w-lg">{user.bio}</p>
                  : <p className="text-ink-300 text-sm mt-2 italic">
                      No bio yet —{' '}
                      <button onClick={() => setEditing(true)} className="text-jade-600 hover:underline not-italic">
                        add one
                      </button>
                    </p>
                }
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <StarRating
                    value={rating}
                    size="sm"
                    showCount
                    count={user.reviewCount || 0}
                  />
                  {user.isVerified && <Badge color="jade">✓ Verified</Badge>}
                  <span className="text-xs text-ink-300 font-mono">{user.email}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats ? [
          { label: 'Total swaps',  value: stats.total,     icon: '🔄', color: 'text-sky-600 bg-sky-50' },
          { label: 'Active',       value: stats.active,    icon: '⚡', color: 'text-jade-600 bg-jade-50' },
          { label: 'Completed',    value: stats.completed, icon: '✅', color: 'text-ink-600 bg-ink-100' },
          { label: 'Pending',      value: stats.pending,   icon: '⏳', color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} className="p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg mx-auto mb-2`}>{icon}</div>
            <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{label}</p>
          </Card>
        )) : [1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
      </div>

      {/* Skills */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink-800">Skills I Offer</h2>
            <Badge color="jade">{offered.length}</Badge>
          </div>
          {offered.length === 0
            ? <p className="text-sm text-ink-300 italic">
                None yet ·{' '}
                <Link to="/skills" className="text-jade-600 not-italic hover:underline">Add skills →</Link>
              </p>
            : <div className="flex flex-wrap gap-1.5">
                {offered.map((s, i) => (
                  <Badge key={i} color="jade">{skillName(s)}</Badge>
                ))}
              </div>
          }
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink-800">Skills I Want</h2>
            <Badge color="sky">{wanted.length}</Badge>
          </div>
          {wanted.length === 0
            ? <p className="text-sm text-ink-300 italic">
                None yet ·{' '}
                <Link to="/skills" className="text-jade-600 not-italic hover:underline">Add skills →</Link>
              </p>
            : <div className="flex flex-wrap gap-1.5">
                {wanted.map((s, i) => (
                  <Badge key={i} color="sky">{skillName(s)}</Badge>
                ))}
              </div>
          }
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: '/skills',  emoji: '💡', title: 'Manage Skills',  sub: 'Add & organise your skills' },
          { to: '/matches', emoji: '🤝', title: 'Find Matches',   sub: 'People with skills you need' },
          { to: '/swaps',   emoji: '🔄', title: 'View Swaps',     sub: 'Track your active requests' },
        ].map(({ to, emoji, title, sub }) => (
          <Link key={to} to={to}
            className="card p-4 flex items-center gap-3 hover:shadow-hover transition-shadow group">
            <div className="w-10 h-10 bg-ink-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-jade-50 transition-colors">{emoji}</div>
            <div>
              <p className="font-medium text-ink-800 text-sm">{title}</p>
              <p className="text-xs text-ink-400">{sub}</p>
            </div>
            <svg className="w-4 h-4 text-ink-300 ml-auto group-hover:text-jade-500 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}