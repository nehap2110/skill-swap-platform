export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 animate-fade-in">
      <span className="text-base flex-shrink-0">⚠</span>
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-rose-400 hover:text-rose-700 flex-shrink-0">✕</button>}
    </div>
  )
}