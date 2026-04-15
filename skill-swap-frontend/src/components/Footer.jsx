import { Link } from 'react-router-dom'

const LINKS = {
  Platform: [
    { label: 'Home',     to: '/landing' },
    { label: 'About',    to: '/about' },
    { label: 'Contact',  to: '/contact' },
    { label: 'Sign Up',  to: '/register' },
  ],
  Features: [
    { label: 'Skill Matching', to: '/matches' },
    { label: 'Swap Requests',  to: '/swaps' },
    { label: 'Real-time Chat', to: '/swaps' },
    { label: 'Reviews',        to: '/swaps' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Cookie Policy', to: '#' },
  ],
}

const SOCIALS = [
  { label: 'Twitter',  icon: '𝕏',  href: 'https://twitter.com' },
  { label: 'LinkedIn', icon: 'in', href: 'https://linkedin.com' },
  { label: 'GitHub',   icon: '⌥',  href: 'https://github.com' },
  { label: 'Discord',  icon: '⊞',  href: 'https://discord.com' },
]

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-ink-800">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-jade-500 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">S</div>
              <span className="font-display font-bold text-jade-400 text-xl">SkillSwap</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-ink-400">
              Trade your expertise for knowledge you need. No money, no barriers — just people learning from each other.
            </p>
            <div className="flex gap-2 mt-5">
              {SOCIALS.map(({ label, icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  title={label}
                  className="w-9 h-9 bg-ink-800 hover:bg-jade-600 rounded-lg flex items-center justify-center text-ink-300 hover:text-white transition-colors text-sm font-bold">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-gray-400 font-semibold text-sm mb-4">{category}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to}
                      className="text-sm text-ink-400 hover:text-jade-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <span className="text-rose-500">♥</span>
            <span>for learners everywhere</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-jade-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-jade-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-jade-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}