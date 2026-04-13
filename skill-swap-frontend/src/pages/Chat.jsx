import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import {
  getSocket,
  joinRoom,
  leaveRoom,
  sendSocketMessage,
  emitTyping,
} from '../socket/socket'
import Avatar from '../components/Avatar'
import Button from '../components/Button'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now   = new Date()
  const diff  = now - date
  if (diff < 60_000)    return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-ink-100" />
      <span className="text-[10px] font-medium text-ink-300 uppercase tracking-wide">
        {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </span>
      <div className="flex-1 h-px bg-ink-100" />
    </div>
  )
}

function TypingBubble({ name }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center text-[10px] text-ink-500 font-bold">
        {name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="px-4 py-3 bg-white border border-ink-100 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-pulse-dot"
              style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Group messages by calendar day, inserting divider nodes. */
function buildGroups(messages) {
  const out = []
  let lastDay = null
  for (const msg of messages) {
    const day = msg.createdAt ? new Date(msg.createdAt).toDateString() : null
    if (day && day !== lastDay) { out.push({ type: 'divider', date: msg.createdAt }); lastDay = day }
    out.push({ type: 'msg', data: msg })
  }
  return out
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Chat() {
  const { swapId }  = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)

  const [messages, setMessages]       = useState([])
  const [content, setContent]         = useState('')
  const [swap, setSwap]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [sendingHttp, setSendingHttp] = useState(false)
  const [pageError, setPageError]     = useState('')
  const [msgError, setMsgError]       = useState('')
  const [typingUser, setTypingUser]   = useState(null) // { name }
  const [roomJoined, setRoomJoined]   = useState(false)
  const [socketOk, setSocketOk]       = useState(false)

  const userId = user?._id || user?.id

  // ── Scroll helper ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // ── Deduplicated message merge ───────────────────────────────────────────────
  const mergeMessages = useCallback((incoming) => {
    setMessages(prev => {
      const existingIds = new Set(prev.filter(m => !m._optimistic).map(m => m._id))
      const newOnes = incoming.filter(m => !existingIds.has(m._id))
      if (!newOnes.length) return prev
      // Replace optimistic placeholders with server-confirmed copies
      const withoutOptimistic = prev.filter(m => !m._optimistic)
      const merged = [...withoutOptimistic, ...newOnes].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      return merged
    })
  }, [])

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [{ data: swapData }, { data: msgData }] = await Promise.all([
          api.get(`/swaps/${swapId}`),
          api.get(`/chat/${swapId}/messages`),
        ])
        setSwap(swapData.data?.swap)
        setMessages(msgData.data?.messages || [])
      } catch (err) {
        setPageError(err.response?.data?.message || 'Chat unavailable. Swap may not be accepted.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [swapId])

  useEffect(() => {
    if (!loading && messages.length) scrollToBottom(false)
  }, [loading]) // eslint-disable-line

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || pageError) return   // don't attach until swap is confirmed

    const socket = getSocket()
    if (!socket) {
      setSocketOk(false)
      return
    }

    setSocketOk(socket.connected)

    // Connection events
    const onConnect    = () => { setSocketOk(true);  joinRoom(swapId) }
    const onDisconnect = () => { setSocketOk(false); setRoomJoined(false) }

    socket.on('connect',    onConnect)
    socket.on('disconnect', onDisconnect)

    // Room confirmation
    const onRoomJoined = ({ swapId: rid }) => {
      if (rid === swapId) setRoomJoined(true)
    }
    socket.on('room_joined', onRoomJoined)

    // Incoming real-time message
    // Backend emits: { success, data: { message: populatedDoc } }
    const onReceiveMessage = (payload) => {
      const msg = payload?.data?.message
      if (!msg) return
      setMessages(prev => {
        // Drop the matching optimistic placeholder if any
        const withoutOpt = prev.filter(
          m => !(m._optimistic && m.content === msg.content &&
                 (m.sender?._id || m.sender?.id || m.sender) === (msg.sender?._id || msg.sender?.id || msg.sender))
        )
        const alreadyIn = withoutOpt.some(m => m._id === msg._id)
        if (alreadyIn) return withoutOpt
        return [...withoutOpt, msg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      })
      setTimeout(() => scrollToBottom(), 60)
    }
    socket.on('receive_message', onReceiveMessage)

    // Typing indicator
    const onTyping = ({ name, isTyping }) => {
      setTypingUser(isTyping ? { name } : null)
      if (isTyping) {
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingUser(null), 3000)
      }
    }
    socket.on('typing', onTyping)

    // Socket error
    const onError = (err) => {
      if (import.meta.env.DEV) console.warn('[Socket error]', err)
    }
    socket.on('error', onError)

    // Join if already connected
    if (socket.connected) joinRoom(swapId)

    return () => {
      socket.off('connect',         onConnect)
      socket.off('disconnect',      onDisconnect)
      socket.off('room_joined',     onRoomJoined)
      socket.off('receive_message', onReceiveMessage)
      socket.off('typing',          onTyping)
      socket.off('error',           onError)
      leaveRoom(swapId)
      setRoomJoined(false)
    }
  }, [loading, pageError, swapId, scrollToBottom])

  // ── Typing indicator emission ─────────────────────────────────────────────────
  const handleInput = (e) => {
    setContent(e.target.value)
    setMsgError('')
    const socket = getSocket()
    if (socket?.connected && roomJoined) {
      emitTyping(swapId, true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => emitTyping(swapId, false), 1500)
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  const send = async (e) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return

    setMsgError('')
    setContent('')
    inputRef.current?.focus()
    emitTyping(swapId, false)

    const socket = getSocket()
    const useSocket = socket?.connected && roomJoined

    // Optimistic message shown immediately
    const tempId = `opt_${Date.now()}`
    const optimistic = {
      _id: tempId,
      _optimistic: true,
      content: text,
      sender: { _id: userId, name: user?.name, avatar: user?.avatar },
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => scrollToBottom(), 40)

    if (useSocket) {
      // ── Real-time path: socket handles persistence + fan-out ──────────────
      sendSocketMessage(swapId, text)
      // The 'receive_message' listener will replace the optimistic copy.
      // If it doesn't arrive within 5 s, fall back to HTTP fetch.
      const fallbackTimer = setTimeout(async () => {
        try {
          const { data } = await api.get(`/chat/${swapId}/messages`)
          mergeMessages(data.data?.messages || [])
        } catch {}
      }, 5000)
      // Clean up timer if component unmounts
      return () => clearTimeout(fallbackTimer)
    } else {
      // ── HTTP fallback ─────────────────────────────────────────────────────
      setSendingHttp(true)
      try {
        await api.post(`/chat/${swapId}/message`, { content: text })
        const { data } = await api.get(`/chat/${swapId}/messages`)
        mergeMessages(data.data?.messages || [])
        // Mark unread messages read
        api.patch(`/chat/${swapId}/read`).catch(() => {})
      } catch (err) {
        setMessages(prev => prev.filter(m => m._id !== tempId))
        setContent(text)
        setMsgError(extractError(err))
      } finally {
        setSendingHttp(false)
      }
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const partner = swap
    ? ((swap.sender?._id || swap.sender?.id) === userId ? swap.receiver : swap.sender)
    : null

  const grouped = buildGroups(messages)

  // ── Render: loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-ink-100 border-t-jade-500 animate-spin" />
        <p className="text-sm text-ink-400 font-mono tracking-wide">Connecting…</p>
      </div>
    </div>
  )

  // ── Render: error ─────────────────────────────────────────────────────────────
  if (pageError) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center px-6">
      <span className="text-5xl">🔒</span>
      <h2 className="font-display text-xl font-bold text-ink-800">Chat unavailable</h2>
      <p className="text-sm text-ink-500 max-w-xs leading-relaxed">{pageError}</p>
      <p className="text-xs text-ink-400">Chat is only available for accepted swaps.</p>
      <Button variant="outline" onClick={() => navigate('/swaps')}>← Back to Swaps</Button>
    </div>
  )

  // ── Render: chat ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100 shadow-sm flex-shrink-0 z-10">
        <button onClick={() => navigate('/swaps')}
          className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors text-ink-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <Avatar name={partner?.name || '?'} src={partner?.avatar} size="sm" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-800 text-sm truncate">{partner?.name || 'Chat'}</p>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              socketOk && roomJoined ? 'bg-jade-500' : 'bg-ink-300'
            }`} />
            <p className="text-xs text-ink-400">
              {socketOk && roomJoined ? 'Real-time · Connected' : socketOk ? 'Connecting to room…' : 'HTTP mode'}
            </p>
          </div>
        </div>

        {swap?.status === 'accepted' && (
          <div className="flex gap-1.5">
            <Link to={`/swaps`}
              className="text-xs text-ink-500 hover:text-jade-600 transition-colors font-medium px-2">
              Swaps
            </Link>
          </div>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-ink-50 space-y-0.5" id="msg-container">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
            <span className="text-4xl">💬</span>
            <p className="font-medium text-ink-600">Start the conversation!</p>
            <p className="text-xs text-ink-400 max-w-xs">
              Messages are private between swap participants.
              {socketOk && roomJoined && ' Real-time chat is active.'}
            </p>
          </div>
        )}

        {grouped.map((item, idx) => {
          if (item.type === 'divider') {
            return <DateDivider key={`div_${idx}`} date={item.date} />
          }

          const msg       = item.data
          const mine      = (msg.sender?._id || msg.sender?.id || msg.sender) === userId
          const prevItem  = idx > 0 ? grouped[idx - 1] : null
          const prevMsg   = prevItem?.type === 'msg' ? prevItem.data : null
          const sameSender = prevMsg &&
            (prevMsg.sender?._id || prevMsg.sender?.id || prevMsg.sender) ===
            (msg.sender?._id || msg.sender?.id || msg.sender)

          return (
            <div key={msg._id}
              className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}>

              {/* Avatar (other user only, first message in a cluster) */}
              {!mine && (
                <div className="flex-shrink-0 self-end mb-1">
                  {!sameSender
                    ? <Avatar name={msg.sender?.name || '?'} src={msg.sender?.avatar} size="xs" />
                    : <div className="w-7" />
                  }
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                {!sameSender && !mine && (
                  <p className="text-[10px] text-ink-400 mb-1 px-1 font-medium">{msg.sender?.name}</p>
                )}
                <div className={`px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                  mine
                    ? `bg-jade-500 text-white shadow-sm ${sameSender ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm'}`
                    : `bg-white text-ink-800 border border-ink-100 shadow-sm ${sameSender ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm'}`
                } ${msg._optimistic ? 'opacity-60' : ''}`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[10px] text-ink-300">
                    {msg._optimistic ? '…' : fmtTime(msg.createdAt)}
                  </span>
                  {mine && !msg._optimistic && (
                    <span className="text-[10px] text-jade-400">✓</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div className="mt-3 animate-fade-in">
            <TypingBubble name={typingUser.name} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error bar ── */}
      {msgError && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-700 flex items-center justify-between flex-shrink-0">
          <span className="flex items-center gap-1.5"><span>⚠</span>{msgError}</span>
          <button onClick={() => setMsgError('')} className="text-rose-400 hover:text-rose-700 transition-colors">✕</button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="px-4 py-3 bg-white border-t border-ink-100 flex-shrink-0">
        <form onSubmit={send} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleInput}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) }
            }}
            placeholder={
              socketOk && roomJoined
                ? 'Type a message… (Enter to send, Shift+Enter for newline)'
                : 'Type a message…'
            }
            rows={1}
            maxLength={2000}
            disabled={sendingHttp}
            className="input flex-1 resize-none min-h-[42px] max-h-32 overflow-y-auto py-2.5 text-sm leading-relaxed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!content.trim() || sendingHttp}
            className="w-10 h-10 flex-shrink-0 bg-jade-500 text-white rounded-xl flex items-center justify-center hover:bg-jade-600 active:bg-jade-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title={socketOk && roomJoined ? 'Send via socket (real-time)' : 'Send via HTTP'}
          >
            {sendingHttp
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )
            }
          </button>
        </form>

        {/* Status row */}
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1 h-1 rounded-full ${socketOk && roomJoined ? 'bg-jade-400' : 'bg-ink-300'}`} />
            <span className="text-[10px] text-ink-300">
              {socketOk && roomJoined ? 'Real-time active' : 'HTTP fallback'}
            </span>
          </div>
          {content.length > 1800 && (
            <span className="text-[10px] text-amber-500">{2000 - content.length} chars left</span>
          )}
        </div>
      </div>
    </div>
  )
}