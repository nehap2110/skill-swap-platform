/**
 * Swaps.jsx
 *
 * Bug fixes applied:
 * 1. isMine: swap.sender is a populated object → check both .id and ._id vs userId
 * 2. skillName: populated as 'title category level' but Skill stores 'name'.
 *    Use skillName() utility which checks name → title → id.
 * 3. PATCH /swaps/:id/status correct — was already correct.
 * 4. Tab counts from GET /swaps/stats (already correct).
 * 5. canCancelActive: only the current user who accepted can cancel an active swap;
 *    actually EITHER party can cancel an accepted swap per backend transition rules.
 * 6. senderReviewed / receiverReviewed: these come back on the swap doc from GET /swaps/:id
 *    but NOT necessarily from GET /swaps list. Guard safely.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import { skillName } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import StatusBadge from '../components/StatusBadge'
import Avatar from '../components/Avatar'
import Empty from '../components/Empty'
import { SkeletonCard } from '../components/Skeleton'
import { useToast, ToastContainer } from '../components/Toast'

const TABS = [
  { key: 'all',       label: 'All',       icon: '📋' },
  { key: 'pending',   label: 'Pending',   icon: '⏳' },
  { key: 'accepted',  label: 'Active',    icon: '⚡' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Other',     icon: '📁' },
]

export default function Swaps() {
  const { user }          = useAuth()
  const navigate          = useNavigate()
  const { toasts, toast } = useToast()

  const [swaps, setSwaps]       = useState([])
  const [tab, setTab]           = useState('all')
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState('')
  const [counts, setCounts]     = useState({})
  const [pageError, setPageError] = useState('')

  // Resolve the current user's ID — backend may return _id or id
  const userId = user?._id || user?.id

  // ── Fetch swaps ─────────────────────────────────────────────────────────────
  const fetchSwaps = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const params = tab !== 'all' ? { status: tab, role: 'all' } : { role: 'all' }
      const { data } = await api.get('/swaps', { params })
      setSwaps(data.data?.swaps || [])
    } catch (err) {
      setPageError(extractError(err))
      setSwaps([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  // ── Fetch stats for tab badges ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/swaps/stats')
      .then(({ data }) => setCounts(data.data?.stats || {}))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchSwaps() }, [fetchSwaps])

  // ── Status action ───────────────────────────────────────────────────────────
  const act = async (id, status, successMsg) => {
    setActing(id + status)
    try {
      await api.patch(`/swaps/${id}/status`, { status })
      toast(successMsg)
      await fetchSwaps()
      // Refresh counts
      api.get('/swaps/stats').then(({ data }) => setCounts(data.data?.stats || {})).catch(() => {})
    } catch (err) {
      toast(extractError(err), 'error')
    } finally {
      setActing('')
    }
  }

  // ── Hard delete ─────────────────────────────────────────────────────────────
  const deleteSwap = async (id) => {
    if (!window.confirm('Delete this swap request? This cannot be undone.')) return
    setActing(id + 'delete')
    try {
      await api.delete(`/swaps/${id}`)
      toast('Request deleted')
      await fetchSwaps()
    } catch (err) {
      toast(extractError(err), 'error')
    } finally {
      setActing('')
    }
  }

  // ── Is the current user the sender? ─────────────────────────────────────────
  // swap.sender is a populated object: { _id, name, avatar, rating, reviewCount }
  const isMine = (swap) => {
    const senderId = swap?.sender?._id || swap?.sender?.id || swap?.sender
    return String(senderId) === String(userId)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Swap Requests</h1>
          <p className="text-sm text-ink-400 mt-0.5">Manage your skill exchange requests</p>
        </div>
        <Link to="/matches" className="btn-sm btn-jade">Find new matches →</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              tab === key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}>
            <span>{icon}</span>
            <span>{label}</span>
            {key !== 'all' && counts[key] > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                tab === key ? 'bg-jade-500 text-white' : 'bg-ink-300 text-white'
              }`}>{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Page error */}
      {pageError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          ⚠ {pageError}
        </div>
      )}

      {/* Swap list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : swaps.length === 0 ? (
        <Empty
          icon="📭"
          title="No swap requests"
          description={tab !== 'all' ? `No ${tab} requests found.` : 'Start by finding a match and sending a request.'}
          action={tab === 'all' ? <Link to="/matches" className="btn-md btn-jade">Find matches</Link> : null}
        />
      ) : (
        <div className="space-y-3">
          {swaps.map(swap => {
            const mine  = isMine(swap)
            const other = mine ? swap.receiver : swap.sender
            const isActing = (s) => acting === swap._id + s

            // Action guards (match backend state machine)
            const canAcceptReject  = !mine && swap.status === 'pending'
            const canCancelPending = mine  && swap.status === 'pending'
            const canCancel        = swap.status === 'accepted'   // either party
            const canComplete      = swap.status === 'accepted'   // either party
            const canDelete        = mine  && swap.status === 'pending'
            const canChat          = swap.status === 'accepted'
            const canReview        = swap.status === 'completed'

            // Has this user already reviewed?
            const alreadyReviewed = mine ? !!swap.senderReviewed : !!swap.receiverReviewed

            return (
              <Card key={swap._id} className="relative overflow-hidden">
                {/* Status accent stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                  swap.status === 'accepted'  ? 'bg-jade-500'  :
                  swap.status === 'pending'   ? 'bg-amber-400' :
                  swap.status === 'completed' ? 'bg-sky-500'   : 'bg-ink-200'
                }`} />

                <div className="pl-4 flex flex-col sm:flex-row gap-4 items-start">
                  {/* Other party */}
                  <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
                    <Avatar name={other?.name || '?'} src={other?.avatar} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-800 text-sm truncate max-w-[140px]">
                        {other?.name || 'Unknown user'}
                      </p>
                      <p className="text-xs text-ink-400">{mine ? 'You sent ↑' : 'Received ↓'}</p>
                    </div>
                  </div>

                  {/* Skill exchange info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-ink-400 text-xs">Offering</span>
                      {/* offeredSkill populated as 'title category level'
                          Skill model stores field as 'name'. skillName() handles both. */}
                      <Badge color="jade">{skillName(swap.offeredSkill)}</Badge>
                      <span className="text-ink-300 text-xs">↔</span>
                      <span className="text-ink-400 text-xs">for</span>
                      <Badge color="sky">{skillName(swap.wantedSkill)}</Badge>
                    </div>

                    {swap.message && (
                      <p className="text-xs text-ink-400 italic truncate max-w-xs">
                        "{swap.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={swap.status} />
                      <span className="text-xs text-ink-300">
                        {new Date(swap.updatedAt || swap.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0 items-start">
                    {canChat && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${swap._id}`)}>
                        💬 Chat
                      </Button>
                    )}
                    {canReview && !alreadyReviewed && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/reviews/${swap._id}`)}>
                        ⭐ Review
                      </Button>
                    )}
                    {canReview && alreadyReviewed && (
                      <span className="text-xs text-ink-400 italic self-center">Reviewed ✓</span>
                    )}

                    {canAcceptReject && (
                      <>
                        <Button size="sm"
                          loading={isActing('accepted')}
                          onClick={() => act(swap._id, 'accepted', 'Swap accepted! 🎉')}>
                          Accept
                        </Button>
                        <Button size="sm" variant="danger"
                          loading={isActing('rejected')}
                          onClick={() => act(swap._id, 'rejected', 'Swap rejected')}>
                          Reject
                        </Button>
                      </>
                    )}

                    {canComplete && (
                      <Button size="sm" variant="outline"
                        loading={isActing('completed')}
                        onClick={() => act(swap._id, 'completed', 'Marked as completed! ✅')}>
                        ✅ Complete
                      </Button>
                    )}

                    {canCancelPending && (
                      <Button size="sm" variant="danger"
                        loading={isActing('cancelled')}
                        onClick={() => act(swap._id, 'cancelled', 'Request cancelled')}>
                        Cancel
                      </Button>
                    )}

                    {canCancel && !canCancelPending && (
                      <Button size="sm" variant="danger"
                        loading={isActing('cancelled')}
                        onClick={() => act(swap._id, 'cancelled', 'Swap cancelled')}>
                        Cancel
                      </Button>
                    )}

                    {canDelete && (
                      <Button size="sm" variant="ghost"
                        loading={isActing('delete')}
                        onClick={() => deleteSwap(swap._id)}
                        className="text-ink-400 hover:text-rose-600">
                        🗑
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}