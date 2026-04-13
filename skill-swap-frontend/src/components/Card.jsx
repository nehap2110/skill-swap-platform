export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div className={`card p-5 ${hover ? 'transition-shadow hover:shadow-hover cursor-pointer' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}