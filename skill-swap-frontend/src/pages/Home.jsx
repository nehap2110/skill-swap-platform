import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SKILLS = [
  { icon: '💻', label: 'Web Dev' },
  { icon: '🎨', label: 'Design' },
  { icon: '🎵', label: 'Music' },
  { icon: '📸', label: 'Photography' },
  { icon: '🌍', label: 'Languages' },
  { icon: '🧘', label: 'Yoga' },
  { icon: '✍️', label: 'Writing' },
  { icon: '📊', label: 'Finance' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '📝',
    title: 'Create your profile',
    desc: 'List the skills you can teach and the skills you want to learn. The more specific, the better your matches.',
    color: 'bg-jade-50 border-jade-200 text-jade-600',
  },
  {
    step: '02',
    icon: '🤝',
    title: 'Get matched',
    desc: 'Our algorithm finds people who want what you offer and offer what you want — perfectly complementary pairs.',
    color: 'bg-sky-50 border-sky-200 text-sky-600',
  },
  {
    step: '03',
    icon: '💬',
    title: 'Send a request',
    desc: 'Propose a swap, explain what you\'d like to exchange, and wait for your partner to accept.',
    color: 'bg-amber-50 border-amber-200 text-amber-600',
  },
  {
    step: '04',
    icon: '🚀',
    title: 'Start learning',
    desc: 'Use the built-in chat to coordinate your sessions. Complete the swap and leave each other reviews.',
    color: 'bg-purple-50 border-purple-200 text-purple-600',
  },
]

const FEATURES = [
  { icon: '🎯', title: 'Smart Matching', desc: 'AI-powered matching finds the most complementary skill partners for you automatically.' },
  { icon: '🔒', title: 'Safe & Secure', desc: 'JWT authentication, verified profiles, and community ratings keep the platform trustworthy.' },
  { icon: '💬', title: 'Real-time Chat', desc: 'Built-in socket-powered messaging so you can coordinate your learning sessions instantly.' },
  { icon: '⭐', title: 'Review System', desc: 'Community-driven ratings and reviews help you pick the best teachers and build reputation.' },
  { icon: '📱', title: 'Works Everywhere', desc: 'Fully responsive design works beautifully on any device — phone, tablet, or desktop.' },
  { icon: '🆓', title: 'Completely Free', desc: 'No money changes hands — just skills. Trade knowledge freely and grow together.' },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    text: 'I swapped my UI design skills for Python lessons. Within a month I automated half my workflow. SkillSwap completely changed how I think about learning.',
    rating: 5,
  },
  {
    name: 'Marcus Chen',
    role: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    text: 'Traded React tutoring for guitar lessons. My match was patient, knowledgeable, and fun to work with. The chat feature made scheduling super easy.',
    rating: 5,
  },
  {
    name: 'Amara Okonkwo',
    role: 'Language Teacher',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
    text: 'I teach French and wanted to learn video editing. Found the perfect match in two days. The review system gave me confidence in who I was working with.',
    rating: 5,
  },
]

const STATS = [
  { value: '3,200+', label: 'Active members' },
  { value: '850+',   label: 'Skills listed' },
  { value: '12,000+',label: 'Swaps completed' },
  { value: '4.9 ★',  label: 'Average rating' },
]

function StarRow({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="text-amber-400 text-base">★</span>
      ))}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-ink-900 text-white overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-jade-500 opacity-10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-sky-500 opacity-10 rounded-full blur-3xl translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-jade-500/10 border border-jade-500/30 text-jade-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              🚀 Free skill exchange platform
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-bold leading-[1.05] mb-6">
              Swap Skills,<br />
              <em className="text-jade-400 not-italic">Learn Anything</em>
            </h1>
            <p className="text-ink-300 text-lg leading-relaxed mb-8 max-w-lg">
              Trade your expertise for knowledge you need — no money required.
              Connect with thousands of skilled people and grow together through
              the power of reciprocal learning.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/matches" className="btn-lg btn-jade">Find Matches 🤝</Link>
                  <Link to="/" className="btn-lg btn-outline border-white/20 text-white hover:bg-white/10">
                    My Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-lg btn-jade">Get Started Free</Link>
                  <Link to="/login" className="btn-lg btn-outline border-white/20 text-white hover:bg-white/10">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Skill pills */}
            <div className="mt-10 flex flex-wrap gap-2">
              {SKILLS.map(({ icon, label }) => (
                <span key={label}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-ink-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="relative hidden lg:block animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=500&fit=crop"
                alt="People collaborating and learning together"
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 to-transparent" />
            </div>
            {/* Floating card 1 */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-hover p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: '.3s' }}>
              <div className="w-10 h-10 bg-jade-100 rounded-xl flex items-center justify-center text-xl">🎯</div>
              <div>
                <p className="text-ink-900 font-semibold text-sm">Perfect match found!</p>
                <p className="text-ink-400 text-xs">Python ↔ UI Design</p>
              </div>
            </div>
            {/* Floating card 2 */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-hover p-4 animate-fade-in" style={{ animationDelay: '.5s' }}>
              <p className="text-ink-900 font-semibold text-sm mb-1">⭐ 4.9 / 5.0</p>
              <p className="text-ink-400 text-xs">Average swap rating</p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-3xl font-bold text-jade-400">{value}</p>
                <p className="text-ink-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="font-display text-4xl font-bold text-ink-900">How SkillSwap Works</h2>
            <p className="text-ink-400 mt-4 max-w-xl mx-auto leading-relaxed">
              Four simple steps to start exchanging knowledge and growing your skills — for free.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon, title, desc, color }) => (
              <div key={step} className={`card p-6 border ${color.split(' ')[1]} relative`}>
                <div className={`w-12 h-12 ${color} border rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                  {icon}
                </div>
                <span className="absolute top-4 right-4 font-mono text-xs font-bold text-ink-200">{step}</span>
                <h3 className="font-display font-bold text-ink-900 mb-2">{title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-ink-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">Why SkillSwap</p>
              <h2 className="font-display text-4xl font-bold text-ink-900 mb-6 leading-tight">
                Everything you need to learn and teach
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FEATURES.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl border border-ink-200 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold text-ink-800 text-sm">{title}</p>
                      <p className="text-ink-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=500&fit=crop"
                alt="Two people working together at a laptop"
                className="rounded-3xl shadow-hover w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-jade-500/5 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">Community love</p>
            <h2 className="font-display text-4xl font-bold text-ink-900">What our members say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, text, rating }) => (
              <div key={name} className="card p-6 flex flex-col gap-4 hover:shadow-hover transition-shadow">
                <StarRow count={rating} />
                <p className="text-ink-600 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-ink-50">
                  <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-ink-100" />
                  <div>
                    <p className="font-semibold text-ink-800 text-sm">{name}</p>
                    <p className="text-ink-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-jade-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to start swapping?
          </h2>
          <p className="text-jade-100 text-lg mb-8 leading-relaxed">
            Join thousands of learners and teachers. Create your free account and find your first match today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to={user ? '/matches' : '/register'}
              className="btn-lg bg-white text-jade-600 hover:bg-jade-50 font-bold shadow-lg hover:shadow-xl transition-all">
              {user ? 'Find Matches' : 'Create Free Account'}
            </Link>
            <Link to="/about"
              className="btn-lg bg-jade-600/50 text-white hover:bg-jade-600 border border-jade-400/50 transition-all">
              Learn More
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}