import Badge from './Badge'
const MAP = {
  pending:   { color: 'amber',  dot: '🟡', label: 'Pending' },
  accepted:  { color: 'jade',   dot: '🟢', label: 'Accepted' },
  rejected:  { color: 'rose',   dot: '🔴', label: 'Rejected' },
  completed: { color: 'sky',    dot: '🔵', label: 'Completed' },
  cancelled: { color: 'ink',    dot: '⚫', label: 'Cancelled' },
}
export default function StatusBadge({ status }) {
  const { color, label } = MAP[status] ?? { color: 'ink', label: status ?? 'Unknown' }
  return (
    <Badge color={color}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${
        color === 'jade' ? 'bg-jade-500' : color === 'amber' ? 'bg-amber-500' : color === 'rose' ? 'bg-rose-500' : color === 'sky' ? 'bg-sky-500' : 'bg-ink-400'
      }`} />
      {label}
    </Badge>
  )
}