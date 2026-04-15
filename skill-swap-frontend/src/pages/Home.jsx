import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Zap, Shield, MessageSquare, Star, Users,
  Repeat2, BadgeCheck, Code2, Palette, Music, Camera,
  Globe2, Dumbbell, PenLine, TrendingUp, ChevronRight,
  Sparkles, CheckCircle2, Clock, LockKeyhole, Infinity
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Animation presets ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function Section({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={staggerContainer} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div variants={fadeUp} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Scroll ticker ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { Icon: Code2,     label: 'Web Development' },
  { Icon: Palette,   label: 'UI & Design' },
  { Icon: Music,     label: 'Music Production' },
  { Icon: Camera,    label: 'Photography' },
  { Icon: Globe2,    label: 'Languages' },
  { Icon: Dumbbell,  label: 'Fitness' },
  { Icon: PenLine,   label: 'Creative Writing' },
  { Icon: TrendingUp,label: 'Finance' },
  { Icon: Code2,     label: 'Python & AI' },
  { Icon: Palette,   label: 'Illustration' },
]

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="relative overflow-hidden py-5">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink-950 to-transparent z-10 pointer-events-none" />
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {items.map(({ Icon, label }, i) => (
          <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-ink-300 text-sm font-medium whitespace-nowrap flex-shrink-0 hover:border-jade-500/40 hover:text-jade-400 transition-colors cursor-default">
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Floating card mockup ──────────────────────────────────────────────────────
function MockupCard() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* Glow */}
      <div className="absolute inset-0 rounded-3xl bg-jade-500 opacity-[0.15] blur-2xl scale-95 translate-y-4" />

      {/* Main card */}
      <motion.div
        className="relative bg-ink-900/90 backdrop-blur-xl border border-white/[0.12] rounded-3xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Match found badge */}
        <motion.div
          className="flex items-center gap-2 bg-jade-500/15 border border-jade-500/30 text-jade-400 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
        >
          <Sparkles size={12} />
          Perfect match found
        </motion.div>

        {/* Swap visual */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 bg-ink-800/60 rounded-2xl p-4 border border-white/[0.07]">
            <p className="text-[10px] text-ink-500 font-semibold uppercase tracking-wider mb-2">You offer</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-jade-500/20 flex items-center justify-center">
                <Code2 size={15} className="text-jade-400" strokeWidth={2} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">React Dev</p>
                <p className="text-ink-500 text-[11px]">Advanced</p>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border border-jade-500/40 flex items-center justify-center flex-shrink-0"
          >
            <Repeat2 size={14} className="text-jade-500" strokeWidth={2} />
          </motion.div>

          <div className="flex-1 bg-ink-800/60 rounded-2xl p-4 border border-white/[0.07]">
            <p className="text-[10px] text-ink-500 font-semibold uppercase tracking-wider mb-2">You get</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Palette size={15} className="text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">UX Design</p>
                <p className="text-ink-500 text-[11px]">Intermediate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Matched user */}
        <div className="flex items-center gap-3 bg-ink-800/40 rounded-2xl p-3 mb-4 border border-white/[0.06]">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face"
            alt="Match"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-jade-500/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Priya Sharma</p>
            <p className="text-ink-400 text-xs">Senior UX Designer · Mumbai</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded-lg">
            <Star size={10} fill="currentColor" strokeWidth={0} />
            4.9
          </div>
        </div>

        {/* CTA button */}
        <motion.button
          className="w-full py-3 bg-jade-500 hover:bg-jade-400 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Request Swap
          <ArrowRight size={16} strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* Floating badge: notification */}
      <motion.div
        className="absolute -top-4 -right-4 bg-ink-800 border border-white/[0.12] rounded-xl px-3 py-2 shadow-xl text-xs text-white font-medium flex items-center gap-2"
        initial={{ opacity: 0, scale: 0.7, x: 10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260 }}
      >
        <div className="w-2 h-2 bg-jade-400 rounded-full animate-pulse" />
        Chat active
      </motion.div>

      {/* Floating badge: rating */}
      <motion.div
        className="absolute -bottom-4 -left-4 bg-ink-800 border border-white/[0.12] rounded-xl px-3 py-2 shadow-xl"
        initial={{ opacity: 0, scale: 0.7, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 260 }}
      >
        <p className="text-xs font-bold text-white">12,400+ swaps</p>
        <div className="flex gap-0.5 mt-0.5">
          {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-amber-400" fill="currentColor" strokeWidth={0} />)}
        </div>
      </motion.div>
    </div>
  )
}

// ─── How it works bento ────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    Icon: BadgeCheck,
    title: 'Build your profile',
    desc: 'List skills you can teach and skills you want to learn. The richer your profile, the better your matches.',
    color: 'text-jade-400',
    bg: 'bg-jade-500/10 border-jade-500/20',
    span: 'md:col-span-1',
  },
  {
    number: '02',
    Icon: Zap,
    title: 'Get instantly matched',
    desc: "Our algorithm cross-references your skillsOffered and skillsWanted with thousands of members to find perfect reciprocal pairs — in seconds.",
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    span: 'md:col-span-2',
  },
  {
    number: '03',
    Icon: MessageSquare,
    title: 'Chat & coordinate',
    desc: 'Use the built-in real-time chat to schedule sessions and stay in sync.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    span: 'md:col-span-2',
  },
  {
    number: '04',
    Icon: Star,
    title: 'Review & grow',
    desc: 'After your swap, leave a review. Build your reputation and unlock better matches.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    span: 'md:col-span-1',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Zap,        title: 'Smart matching',    desc: 'Bidirectional skill overlap matching — you get shown to the right people automatically.', color: 'text-jade-400' },
  { Icon: Shield,     title: 'Verified profiles', desc: 'Community ratings, review history, and email verification build platform trust.', color: 'text-sky-400' },
  { Icon: MessageSquare, title: 'Real-time chat', desc: 'Socket.io powered messaging — coordinate sessions without leaving the platform.', color: 'text-amber-400' },
  { Icon: Infinity,   title: 'No money, ever',   desc: 'Completely free. Swap your knowledge instead of paying for it.', color: 'text-rose-400' },
  { Icon: LockKeyhole,title: 'Secure & private',  desc: 'JWT authentication, hashed passwords, and strict route guards protect your account.', color: 'text-purple-400' },
  { Icon: Clock,      title: 'Works async',       desc: 'Coordinate across timezones. Chat, schedule, and complete swaps on your schedule.', color: 'text-orange-400' },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcus Chen', role: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=72&h=72&fit=crop&crop=face',
    text: 'Swapped React lessons for guitar coaching. Three months later I can play 10 songs and my match is now a full-stack dev. This is the best ROI I have ever gotten from "learning."',
    skill1: 'React', 
    skill2: 'Guitar',
  },
  {
    name: 'Priya Sharma', role: 'UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=72&h=72&fit=crop&crop=face',
    text: 'I needed Python for data visualization. Found a developer who wanted UX mentoring. We swapped for 6 weeks — I automated half my workflow. Completely changed my career trajectory.',
    skill1: 'UX Design', skill2: 'Python',
  },
  {
    name: 'Amara Okonkwo', role: 'Language Teacher',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=72&h=72&fit=crop&crop=face',
    text: 'Teaching French, learning video editing. My match was professional, punctual, and incredibly skilled. The review system made me confident he was the right person to work with.',
    skill1: 'French', skill2: 'Video Editing',
  },
]

const STATS = [
  { value: '3.2k+', label: 'Active members', Icon: Users },
  { value: '850+',  label: 'Skills listed',  Icon: BadgeCheck },
  { value: '12k+',  label: 'Swaps done',     Icon: Repeat2 },
  { value: '4.9',   label: 'Avg rating',     Icon: Star },
]

// ─── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  const { user }   = useAuth()
  const heroRef    = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY      = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const heroOpacity= useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div className="bg-ink-950 text-white overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-20">
        {/* Background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(22,165,121,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)' }} />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            {/* Pill badge */}
            <motion.div
              className="inline-flex items-center gap-2 border border-jade-500/30 bg-jade-500/10 text-jade-400 text-xs font-semibold px-4 py-2 rounded-full mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={13} strokeWidth={2} />
              Free skill exchange platform · No subscriptions
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="font-display text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              Swap skills,{' '}
              <br />
              <em className="text-jade-400 not-italic">learn anything</em>
            </motion.h1>

            {/* Sub */}
            <motion.p
              className="text-ink-300 text-xl leading-relaxed mb-10 max-w-lg"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
            >
              Trade your expertise for knowledge you need.
              No money changes hands — just people{' '}
              <span className="text-white font-medium">learning from each other</span>.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-3 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={user ? '/matches' : '/register'}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-jade-500 hover:bg-jade-400 text-white font-bold text-base rounded-2xl transition-colors shadow-[0_0_32px_rgba(22,165,121,0.4)] hover:shadow-[0_0_48px_rgba(22,165,121,0.5)]"
                >
                  {user ? 'Find Matches' : 'Start Swapping Free'}
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/[0.15] hover:border-white/30 text-ink-300 hover:text-white font-semibold text-base rounded-2xl transition-colors"
                >
                  Learn more
                  <ChevronRight size={18} strokeWidth={2} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=40&h=40&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face',
                ].map((src, i) => (
                  <img key={i} src={src} alt="member" className="w-9 h-9 rounded-full ring-2 ring-ink-950 object-cover" />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400" fill="currentColor" strokeWidth={0} />)}
                </div>
                <p className="text-ink-400 text-xs"><span className="text-white font-semibold">3,200+</span> learners already swapping</p>
              </div>
            </motion.div>
          </div>

          {/* Right: mockup */}
          <div className="hidden lg:flex justify-center">
            <MockupCard />
          </div>
        </motion.div>

        {/* Ticker */}
        <div className="relative border-t border-white/[0.06]">
          <Ticker />
        </div>
      </section>

      {/* ══ STATS ════════════════════════════════════════════════════════════ */}
      <section className="py-20 border-y border-white/[0.06] bg-ink-900/40">
        <Section className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, Icon }, i) => (
            <FadeUp key={label} delay={i * 0.08} className="text-center">
              <div className="w-12 h-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Icon size={20} strokeWidth={1.5} className="text-jade-400" />
              </div>
              <p className="font-display text-4xl font-bold text-white mb-1">{value}</p>
              <p className="text-ink-400 text-sm">{label}</p>
            </FadeUp>
          ))}
        </Section>
      </section>

      {/* ══ HOW IT WORKS — bento ═════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <Section>
            <FadeUp className="text-center mb-16">
              <p className="text-jade-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">How it works</p>
              <h2 className="font-display text-5xl font-bold text-gray-400 leading-tight">
                From zero to swap<br />
                <span className="text-ink-400">in four steps</span>
              </h2>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-4">
              {STEPS.map(({ number, Icon, title, desc, color, bg, span }, i) => (
                <FadeUp key={title} delay={i * 0.1} className={span}>
                  <motion.div
                    className={`h-full border rounded-3xl p-7 ${bg} group cursor-default`}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>
                        <Icon size={22} strokeWidth={1.8} className={color} />
                      </div>
                      <span className="font-mono text-xs font-bold text-ink-600">{number}</span>
                    </div>
                    <h3 className="font-display font-bold text-white text-xl mb-2.5">{title}</h3>
                    <p className="text-ink-400 text-sm leading-relaxed">{desc}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-ink-900/40 border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5">
          <Section>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <FadeUp>
                <p className="text-jade-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Platform features</p>
                <h2 className="font-display text-5xl font-bold text-ink-400 leading-tight mb-6">
                  Built for real{' '}
                  <span className="text-ink-400">knowledge exchange</span>
                </h2>
                <p className="text-ink-400 text-lg leading-relaxed mb-8">
                  Every feature is designed to make skill swapping seamless — from first match to final review.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-jade-400 font-semibold hover:text-jade-300 transition-colors group"
                >
                  Start for free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </FadeUp>

              <div className="grid sm:grid-cols-2 gap-4">
                {FEATURES.map(({ Icon, title, desc, color }, i) => (
                  <FadeUp key={title} delay={i * 0.07}>
                    <motion.div
                      className="bg-ink-900/60 border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] transition-colors"
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    >
                      <Icon size={22} strokeWidth={1.8} className={`${color} mb-3`} />
                      <p className="font-semibold text-white text-sm mb-1.5">{title}</p>
                      <p className="text-ink-500 text-xs leading-relaxed">{desc}</p>
                    </motion.div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <Section>
            <FadeUp className="text-center mb-16">
              <p className="text-jade-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Community stories</p>
              <h2 className="font-display text-5xl font-bold text-ink-400">
                Real swaps,{' '}
                <span className="text-ink-400">real results</span>
              </h2>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ name, role, avatar, text, skill1, skill2 }, i) => (
                <FadeUp key={name} delay={i * 0.12}>
                  <motion.div
                    className="bg-ink-900/60 border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5 hover:border-white/[0.16] transition-colors"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={13} className="text-amber-400" fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>

                    {/* Swap tags */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-jade-500/10 border border-jade-500/20 text-jade-400 rounded-full font-medium">{skill1}</span>
                      <Repeat2 size={12} className="text-ink-600" />
                      <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full font-medium">{skill2}</span>
                    </div>

                    {/* Quote */}
                    <p className="text-ink-300 text-sm leading-relaxed flex-1">"{text}"</p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                      <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.08]" />
                      <div>
                        <p className="text-white font-semibold text-sm">{name}</p>
                        <p className="text-ink-500 text-xs">{role}</p>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-jade-500/[0.08]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(22,165,121,0.2) 0%, transparent 70%)' }} />
        </div>

        <Section className="relative max-w-4xl mx-auto px-5 text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-2 bg-jade-500/10 border border-jade-500/20 text-jade-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
              <CheckCircle2 size={13} strokeWidth={2.5} />
              Free forever · No credit card needed
            </div>
            <h2 className="font-display text-6xl font-bold text-white mb-6 leading-tight">
              Ready to swap your{' '}
              <em className="text-jade-400 not-italic">first skill?</em>
            </h2>
            <p className="text-ink-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners and teachers. Create your profile, list your skills, and find your first match — all in under 5 minutes.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={user ? '/matches' : '/register'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-jade-500 hover:bg-jade-400 text-white font-bold text-lg rounded-2xl transition-colors shadow-[0_0_48px_rgba(22,165,121,0.45)]"
                >
                  {user ? 'Find my next match' : 'Create free account'}
                  <ArrowRight size={20} strokeWidth={2.5} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-white/[0.15] hover:border-white/30 text-ink-300 hover:text-white font-semibold text-lg rounded-2xl transition-colors"
                >
                  Learn more
                </Link>
              </motion.div>
            </div>
          </FadeUp>
        </Section>
      </section>

    </div>
  )
}