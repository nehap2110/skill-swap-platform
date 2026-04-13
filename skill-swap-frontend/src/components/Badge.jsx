const STYLES = {
  jade:   'bg-jade-50 text-jade-700 border border-jade-200',
  rose:   'bg-rose-50 text-rose-700 border border-rose-200',
  amber:  'bg-amber-50 text-amber-700 border border-amber-200',
  sky:    'bg-sky-50 text-sky-700 border border-sky-200',
  ink:    'bg-ink-100 text-ink-600 border border-ink-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
}

export default function Badge({ children, color = 'ink', className = '' }) {
  return (
    <span className={`badge ${STYLES[color] ?? STYLES.ink} ${className}`}>{children}</span>
  )
}