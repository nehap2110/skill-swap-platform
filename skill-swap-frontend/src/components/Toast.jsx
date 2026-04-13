import { useEffect, useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }
  return { toasts, toast: add }
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(({ id, message, type }) => (
        <div key={id} className={`px-4 py-3 rounded-xl shadow-hover text-sm font-medium animate-slide-up flex items-center gap-2.5 ${
          type === 'error' ? 'bg-rose-600 text-white' :
          type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-jade-600 text-white'
        }`}>
          <span>{type === 'error' ? '✕' : type === 'warning' ? '⚠' : '✓'}</span>
          {message}
        </div>
      ))}
    </div>
  )
}