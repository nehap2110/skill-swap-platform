/**
 * Matches.jsx
 *
 * Bug fixes applied:
 * 1. API returns { data: { matches: publicProfile[], pagination } }
 *    publicProfile has { id, name, skillsOffered, skillsWanted, ... }
 *    NOT { user, matchedSkills } — that was the frontend's wrong assumption.
 * 2. publicProfile.id (not ._id) — use both.
 * 3. Skills are populated with 'title category level' in the query but the
 *    actual Skill model field is 'name' — handle both.
 * 4. RequestSwapModal: offeredSkill MUST belong to current user,
 *    wantedSkill MUST belong to receiver. Fetch separately.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import { skillName, skillId } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import StarRating from '../components/StarRating'
import Modal from '../components/Modal'
import ErrorAlert from '../components/ErrorAlert'
import Empty from '../components/Empty'
import { SkeletonCard } from '../components/Skeleton'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

// ─── RequestSwapModal ─────────────────────────────────────────────────────────
// offeredSkill must be owned by the SENDER (current user)
// wantedSkill  must be owned by the RECEIVER (target user)
function RequestSwapModal({ target, onClose, onSuccess }) {
  const { user }  = useAuth()
  const userId    = user?._id || user?.id

  // Skills owned by me (to offer)
  const [mySkills,     setMySkills]     = useState([])
  // Skills owned by the target (to request)
  const [theirSkills,  setTheirSkills]  = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)

  const [form, setForm]     = useState({ offeredSkillId: '', wantedSkillId: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    const fetchSkills = async () => {
      setLoadingSkills(true)
      try {
        // Fetch all skills, then filter by createdBy
        const { data } = await api.get('/skills')
        const all = data.data?.skills || []

        // Skills created by me
        const mine  = all.filter(s => {
          const creator = s.createdBy?._id || s.createdBy?.id || s.createdBy
          return String(creator) === String(userId)
        })

        // Skills created by receiver — use their profile's skillsOffered if available
        // since the user may have selected skills from the platform list
        const targetId = target?.id || target?._id
        const theirOwned = all.filter(s => {
          const creator = s.createdBy?._id || s.createdBy?.id || s.createdBy
          return String(creator) === String(targetId)
        })

        // Fallback: use target.skillsOffered if we can't determine ownership
        const theirOffered = (target?.skillsOffered || []).map(s => ({
          _id:  skillId(s),
          name: skillName(s),
        })).filter(s => s._id)

        setMySkills(mine)
        // Prefer owned skills, fallback to skillsOffered from profile
        setTheirSkills(theirOwned.length > 0 ? theirOwned : theirOffered)
      } catch (err) {
        setError(extractError(err))
      } finally {
        setLoadingSkills(false)
      }
    }
    fetchSkills()
  }, [userId, target])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.offeredSkillId || !form.wantedSkillId) {
      setError('Please select both skills.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const targetId = target?.id || target?._id
      await api.post('/swaps', {
        receiverId:     String(targetId),
        offeredSkillId: form.offeredSkillId,
        wantedSkillId:  form.wantedSkillId,
        message:        form.message.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const targetName = target?.name || 'this user'

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Target preview */}
      <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-xl">
        <Avatar name={target?.name || '?'} src={target?.avatar} size="md" />
        <div>
          <p className="font-semibold text-ink-800">{target?.name}</p>
          {target?.location && <p className="text-xs text-ink-400">📍 {target.location}</p>}
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Skill I offer (must be mine) */}
      <div>
        <label className="label">Skill I'll offer <span className="text-ink-400 font-normal">(must be yours)</span></label>
        {loadingSkills ? <div className="h-10 shimmer rounded-xl" /> : mySkills.length === 0 ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            You have no skills added yet. <Link to="/skills" className="font-semibold underline">Add skills →</Link>
          </div>
        ) : (
          <select required value={form.offeredSkillId}
            onChange={e => setForm(f => ({ ...f, offeredSkillId: e.target.value }))} className="input">
            <option value="">Select a skill you offer…</option>
            {mySkills.map(s => (
              <option key={s._id || s.id} value={s._id || s.id}>{skillName(s)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Skill I want (must be theirs) */}
      <div>
        <label className="label">Skill I want from {targetName}</label>
        {loadingSkills ? <div className="h-10 shimmer rounded-xl" /> : theirSkills.length === 0 ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            {targetName} has no skills listed.
          </div>
        ) : (
          <select required value={form.wantedSkillId}
            onChange={e => setForm(f => ({ ...f, wantedSkillId: e.target.value }))} className="input">
            <option value="">Select a skill they offer…</option>
            {theirSkills.map(s => {
              const id  = s._id || s.id || s
              const nm  = typeof s === 'object' ? skillName(s) : s
              return <option key={String(id)} value={String(id)}>{nm}</option>
            })}
          </select>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="label">Message <span className="text-ink-400 font-normal">(optional)</span></label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={3} maxLength={500}
          placeholder={`Hi ${targetName}, I'd love to swap skills…`}
          className="input resize-none" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1" loading={loading}
          disabled={!form.offeredSkillId || !form.wantedSkillId || mySkills.length === 0}>
          Send Request
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal]     = useState(0)
  const [modal, setModal]     = useState(null)
  const { toasts, toast }     = useToast()

  const fetchMatches = async (p = 1) => {
    if (p === 1) setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/users/matches', { params: { page: p, limit: 12 } })
      // API returns: { data: { matches: publicProfile[], pagination } }
      // publicProfile shape: { id, name, email, avatar, bio, location,
      //                        skillsOffered, skillsWanted, rating, reviewCount, isVerified }
      const incoming   = data.data?.matches || []
      const pagination = data.data?.pagination || {}

      if (p === 1) setMatches(incoming)
      else setMatches(prev => [...prev, ...incoming])

      setTotal(pagination.total ?? incoming.length)
      setHasMore(p < (pagination.totalPages ?? 1))
      setPage(p)
    } catch (err) {
      setError(extractError(err))
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMatches(1) }, [])

  const handleSuccess = () => toast('Swap request sent! 🎉')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} />

      <Modal open={!!modal} onClose={() => setModal(null)} title="Request a Skill Swap" size="lg">
        {modal && (
          <RequestSwapModal
            target={modal}
            onClose={() => setModal(null)}
            onSuccess={handleSuccess}
          />
        )}
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Skill Matches</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {total > 0 ? `${total} people with complementary skills` : 'People whose skills align with yours'}
          </p>
        </div>
        <Link to="/skills" className="btn-sm btn-outline">Manage my skills →</Link>
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Grid */}
      {loading && matches.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : matches.length === 0 && !error ? (
        <Empty
          icon="🤝"
          title="No matches yet"
          description="Add skills you offer and skills you want to discover people to swap with."
          action={<Link to="/skills" className="btn-md btn-jade">Add skills</Link>}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((profile) => {
              // profile IS the publicProfile object directly
              // profile.id is the MongoDB _id (virtual)
              const pid = profile?.id || profile?._id
              if (!pid) return null

              const offeredSkills = profile.skillsOffered || []
              const wantedSkills  = profile.skillsWanted  || []

              return (
                <Card key={String(pid)} className="flex flex-col gap-4 hover:shadow-hover transition-shadow">
                  {/* User info */}
                  <div className="flex items-start gap-3">
                    <Avatar name={profile.name || '?'} src={profile.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-800 truncate">{profile.name || 'Unknown'}</p>
                      {profile.location && (
                        <p className="text-xs text-ink-400 mt-0.5">📍 {profile.location}</p>
                      )}
                      <StarRating
                        value={profile.rating || 0}
                        size="sm"
                        showCount
                        count={profile.reviewCount || 0}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">{profile.bio}</p>
                  )}

                  {/* Skills they offer */}
                  {offeredSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-jade-600 uppercase tracking-wide mb-1.5">
                        Offers
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {offeredSkills.slice(0, 4).map((s, i) => (
                          <Badge key={i} color="jade">{skillName(s)}</Badge>
                        ))}
                        {offeredSkills.length > 4 && (
                          <Badge color="ink">+{offeredSkills.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills they want */}
                  {wantedSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-1.5">
                        Wants to learn
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {wantedSkills.slice(0, 4).map((s, i) => (
                          <Badge key={i} color="sky">{skillName(s)}</Badge>
                        ))}
                        {wantedSkills.length > 4 && (
                          <Badge color="ink">+{wantedSkills.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full mt-auto"
                    size="sm"
                    onClick={() => setModal(profile)}
                  >
                    Request Swap
                  </Button>
                </Card>
              )
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" loading={loading} onClick={() => fetchMatches(page + 1)}>
                Load more matches
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}