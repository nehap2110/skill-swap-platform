const SIZES = { xs: 'w-7 h-7 text-[10px]', sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' }
const COLORS = ['bg-jade-100 text-jade-700','bg-sky-100 text-sky-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-rose-100 text-rose-700']

export default function Avatar({ name = '?', src, size = 'md', className = '' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const color = COLORS[name?.charCodeAt(0) % COLORS.length] ?? COLORS[0]
  if (src) return <img src={src} alt={name} className={`${SIZES[size]} rounded-full object-cover ring-2 ring-white flex-shrink-0 ${className}`} />
  return (
    <div className={`${SIZES[size]} ${color} rounded-full flex items-center justify-center font-display font-semibold flex-shrink-0 ring-2 ring-white ${className}`}>
      {initials}
    </div>
  )
}