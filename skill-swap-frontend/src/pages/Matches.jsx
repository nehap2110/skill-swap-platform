import { useState, useEffect } from 'react'
import api, { extractError } from '../services/api'
import { skillName } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import StarRating from '../components/StarRating'
import ErrorAlert from '../components/ErrorAlert'
import Empty from '../components/Empty'
import { SkeletonCard } from '../components/Skeleton'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal]     = useState(0)
  // Tracks in-flight "Send Swap Request" calls per matched user, so each
  // card shows its own loading/error state instead of a shared modal.
  const [sendingId, setSendingId] = useState(null)
  const [sendErrors, setSendErrors] = useState({})
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

  // Send the swap request immediately using the skill pair the matching
  // algorithm already determined (profile.matchedSkills) — no modal, no
  // asking the user to pick skills again.
  const sendRequest = async (profile) => {
    const targetId = profile?.id || profile?._id
    const matched   = profile?.matchedSkills || {}
    setSendErrors(prev => ({ ...prev, [targetId]: '' }))

    if (!matched.offeredSkillId || !matched.wantedSkillId) {
      setSendErrors(prev => ({
        ...prev,
        [targetId]: 'No compatible skill pair found with this user.',
      }))
      return
    }

    setSendingId(targetId)
    try {
      await api.post('/swaps', {
        receiverId:     String(targetId),
        offeredSkillId: matched.offeredSkillId,
        wantedSkillId:  matched.wantedSkillId,
      })
      toast(`Swap request sent to ${profile.name || 'this user'}! 🎉`)
    } catch (err) {
      setSendErrors(prev => ({ ...prev, [targetId]: extractError(err) }))
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} />

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

                  {/* Exact skill pair the matching algorithm picked for a request */}
                  {profile.matchedSkills?.offeredSkillId && profile.matchedSkills?.wantedSkillId && (
                    <div className="text-xs text-ink-500 bg-ink-50 rounded-xl px-3 py-2">
                      You offer <span className="font-semibold text-ink-700">{profile.matchedSkills.offeredSkillName}</span>
                      {' '}for <span className="font-semibold text-ink-700">{profile.matchedSkills.wantedSkillName}</span>
                    </div>
                  )}

                  {sendErrors[pid] && (
                    <ErrorAlert message={sendErrors[pid]} onDismiss={() =>
                      setSendErrors(prev => ({ ...prev, [pid]: '' }))
                    } />
                  )}

                  <Button
                    className="w-full mt-auto"
                    size="sm"
                    loading={sendingId === pid}
                    disabled={!profile.matchedSkills?.offeredSkillId || !profile.matchedSkills?.wantedSkillId}
                    onClick={() => sendRequest(profile)}
                  >
                    Send Swap Request
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