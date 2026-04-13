export default function StarRating({ value = 0, max = 5, onChange, size = 'md', showCount, count }) {
  const sz = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <div className="flex items-center gap-1">
      <div className={`flex gap-0.5 ${sz}`}>
        {Array.from({ length: max }, (_, i) => i + 1).map(s => (
          <button key={s} type="button" onClick={() => onChange?.(s)} disabled={!onChange}
            className={`transition-all ${onChange ? 'hover:scale-125 cursor-pointer' : 'cursor-default'} ${s <= Math.round(value) ? 'text-amber-400' : 'text-ink-200'}`}>
            ★
          </button>
        ))}
      </div>
      {showCount && <span className="text-xs text-ink-400 font-mono">{(+value || 0).toFixed(1)} ({count || 0})</span>}
    </div>
  )
}