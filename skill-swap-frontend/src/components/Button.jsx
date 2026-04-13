export default function Button({
  children, variant = 'jade', size = 'md', loading = false, className = '', ...props
}) {
  const v = { jade: 'btn-jade', ink: 'btn-ink', ghost: 'btn-ghost', danger: 'btn-danger', outline: 'btn-outline' }
  const s = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' }
  return (
    <button className={`${s[size] ?? s.md} ${v[variant] ?? v.jade} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />}
      {children}
    </button>
  )
}