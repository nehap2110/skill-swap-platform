export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-full shimmer w-1/2" />
          <div className="h-3 rounded-full shimmer w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }, (_, i) => (
        <div key={i} className={`h-3 rounded-full shimmer ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`h-3.5 rounded-full shimmer ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  )
}