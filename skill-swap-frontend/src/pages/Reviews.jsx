/**
 * Reviews.jsx
 *
 * Bug fixes applied:
 * 1. swap.sender / swap.receiver are populated objects — check both .id and ._id.
 * 2. senderReviewed / receiverReviewed: only present on detailed swap fetch (/swaps/:id).
 *    Guard with !! to safely treat undefined as false.
 * 3. skillName for offeredSkill / wantedSkill (populated as 'title category level').
 * 4. GET /reviews/user/:id — optional endpoint; don't crash if it 404s.
 * 5. Review rating must be integer 1-5.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import { skillName } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import StarRating from '../components/StarRating'
import Avatar from '../components/Avatar'
import ErrorAlert from '../components/ErrorAlert'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
const RATING_COLORS = ['', 'text-rose-600', 'text-amber-600', 'text-amber-500', 'text-jade-500', 'text-jade-600']

function ReviewCard({ review }) {
  const name = review.reviewer?.name || 'Anonymous'
  return (
    <div className="flex items-start gap-3 py-4 border-b border-ink-50 last:border-0">
      <Avatar name={name} src={review.reviewer?.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-medium text-ink-800 text-sm">{name}</p>
          <div className="flex items-center gap-2">
            <StarRating value={review.rating || 0} size="sm" />
            <span className="text-xs text-ink-400 font-mono">
              {review.createdAt
                ? new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : ''}
            </span>
          </div>
        </div>
        {review.comment && (
          <p className="text-sm text-ink-600 mt-1 leading-relaxed">{review.comment}</p>
        )}
        {review.isEdited && <p className="text-[10px] text-ink-300 mt-1 italic">Edited</p>}
      </div>
    </div>
  )
}

export default function Reviews() {
  const { swapId } = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [swap, setSwap]                   = useState(null)
  const [existingReviews, setExistingReviews] = useState([])
  const [loading, setLoading]             = useState(true)
  const [pageError, setPageError]         = useState('')
  const [submitted, setSubmitted]         = useState(false)
  const [rating, setRating]               = useState(0)
  const [comment, setComment]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [formError, setFormError]         = useState('')

  // Resolve current user ID — publicProfile uses 'id', Mongoose doc uses '_id'
  const userId = user?._id || user?.id

  useEffect(() => {
    const init = async () => {
      try {
        const { data: swapData } = await api.get(`/swaps/${swapId}`)
        const s = swapData.data?.swap
        if (!s) { setPageError('Swap not found.'); return }
        setSwap(s)

        if (s.status !== 'completed') {
          setPageError(
            `Reviews are only available for completed swaps. This swap is "${s.status}".`
          )
          return
        }

        // Determine if current user has already reviewed
        const senderId   = s.sender?._id || s.sender?.id || s.sender
        const receiverId = s.receiver?._id || s.receiver?.id || s.receiver
        const mine = String(senderId) === String(userId)

        // Guard: senderReviewed / receiverReviewed may be undefined on list endpoint
        const alreadyReviewed = mine ? !!s.senderReviewed : !!s.receiverReviewed
        if (alreadyReviewed) setSubmitted(true)

        // Load partner's recent reviews (non-critical)
        const partnerId = mine ? String(receiverId) : String(senderId)
        if (partnerId) {
          api.get(`/reviews/user/${partnerId}?limit=5`)
            .then(({ data }) => setExistingReviews(data.data?.reviews || []))
            .catch(() => {})   // endpoint optional
        }
      } catch (err) {
        setPageError(extractError(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [swapId, userId])

  const submit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setFormError('Please select a rating before submitting.'); return }
    setSaving(true)
    setFormError('')
    try {
      await api.post('/reviews', {
        swapId,
        rating:  parseInt(rating, 10),   // backend validates integer 1-5
        comment: comment.trim() || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  // Resolve parties from populated objects
  const senderId = swap?.sender?._id || swap?.sender?.id || swap?.sender
  const mine     = swap ? String(senderId) === String(userId) : false
  const partner  = swap ? (mine ? swap.receiver : swap.sender) : null

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-10 h-10 rounded-full border-4 border-ink-100 border-t-jade-500 animate-spin" />
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────────────────
  if (pageError) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center px-6">
      <span className="text-5xl">⚠️</span>
      <h2 className="font-display text-xl font-bold text-ink-800">Cannot Leave Review</h2>
      <p className="text-sm text-ink-500 max-w-xs leading-relaxed">{pageError}</p>
      <Button variant="outline" onClick={() => navigate('/swaps')}>← Back to Swaps</Button>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/swaps')}
        className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-jade-600 transition-colors font-medium">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Swaps
      </button>

      {/* Swap context */}
      {swap && partner && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={partner?.name || '?'} src={partner?.avatar} size="md" />
            <div>
              <p className="text-xs text-ink-400 mb-0.5">Reviewing your swap with</p>
              <p className="font-semibold text-ink-800">{partner?.name || 'Unknown'}</p>
            </div>
            <div className="ml-auto flex gap-1.5 flex-wrap">
              <Badge color="jade">{skillName(swap.offeredSkill)}</Badge>
              <span className="text-ink-300 text-xs self-center">↔</span>
              <Badge color="sky">{skillName(swap.wantedSkill)}</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Review form / success */}
      <Card>
        {submitted ? (
          <div className="text-center py-8 space-y-4 animate-scale-in">
            <div className="text-6xl">🎉</div>
            <h2 className="font-display text-xl font-bold text-ink-900">Review submitted!</h2>
            <p className="text-sm text-ink-500 max-w-xs mx-auto leading-relaxed">
              Your feedback helps build trust in the SkillSwap community.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button onClick={() => navigate('/swaps')} variant="outline">Back to Swaps</Button>
              <Button onClick={() => navigate('/matches')}>Find more matches</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              {partner && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <Avatar name={partner?.name || '?'} src={partner?.avatar} size="lg" />
                  <p className="font-display font-semibold text-ink-800 text-lg">
                    {partner?.name || 'Unknown'}
                  </p>
                  <StarRating
                    value={partner?.rating || 0}
                    size="sm"
                    showCount
                    count={partner?.reviewCount || 0}
                  />
                </div>
              )}
              <h1 className="font-display text-xl font-bold text-ink-900">Leave a Review</h1>
              <p className="text-sm text-ink-400 mt-1">
                How was your experience with {partner?.name || 'your swap partner'}?
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <ErrorAlert message={formError} onDismiss={() => setFormError('')} />

              {/* Star picker */}
              <div className="text-center">
                <label className="label text-center block mb-3">Your rating</label>
                <div className="flex justify-center">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
                {rating > 0 && (
                  <p className={`text-sm font-semibold mt-2 ${RATING_COLORS[rating]}`}>
                    {RATING_LABELS[rating]}
                  </p>
                )}
                {rating === 0 && (
                  <p className="text-xs text-ink-300 mt-2">Click a star to rate</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="label">
                  Comment <span className="text-ink-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience with this skill swap…"
                  rows={4}
                  maxLength={600}
                  className="input resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-ink-300">Be honest and constructive</p>
                  <p className="text-xs text-ink-400 font-mono">{comment.length}/600</p>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={saving}
                disabled={rating === 0}>
                Submit Review
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* Partner's recent reviews */}
      {existingReviews.length > 0 && !submitted && (
        <Card>
          <h2 className="font-display font-semibold text-ink-800 mb-1">
            {partner?.name}'s recent reviews
          </h2>
          <p className="text-xs text-ink-400 mb-4">What others have said</p>
          <div className="divide-y divide-ink-50">
            {existingReviews.map(r => <ReviewCard key={r._id} review={r} />)}
          </div>
        </Card>
      )}
    </div>
  )
}