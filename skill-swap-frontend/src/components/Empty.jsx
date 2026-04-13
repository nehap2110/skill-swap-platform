export default function Empty({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="font-display text-lg font-semibold text-ink-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-400 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}