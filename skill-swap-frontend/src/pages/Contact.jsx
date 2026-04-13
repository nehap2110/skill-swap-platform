import { useState } from 'react'
import Button from '../components/Button'
import ErrorAlert from '../components/ErrorAlert'

const CONTACT_INFO = [
  { icon: '📧', label: 'Email', value: 'hello@skillswap.io', href: 'mailto:hello@skillswap.io' },
  { icon: '🐦', label: 'Twitter', value: '@skillswapapp', href: 'https://twitter.com' },
  { icon: '💼', label: 'LinkedIn', value: 'SkillSwap', href: 'https://linkedin.com' },
  { icon: '📍', label: 'Location', value: 'San Francisco, CA', href: null },
]

const FAQ = [
  { q: 'Is SkillSwap completely free?', a: 'Yes! SkillSwap is 100% free. We believe knowledge should flow freely. No subscriptions, no hidden fees — just skills.' },
  { q: 'How does matching work?', a: 'Our algorithm compares what you offer with what others want, and vice versa. When there\'s overlap, you\'re matched and can request a swap.' },
  { q: 'What if a swap doesn\'t work out?', a: 'Either party can cancel at any time before completion. The review system helps surface any issues and maintain community standards.' },
  { q: 'Can I swap multiple skills?', a: 'Absolutely. You can list as many skills as you want on your profile and engage in multiple swaps simultaneously.' },
]

export default function Contact() {
  const [form, setForm]         = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState('')

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Simulate API call — replace with real endpoint if backend contact route is added
    await new Promise(r => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-jade-400 font-semibold text-sm uppercase tracking-widest mb-4">Get in touch</p>
          <h1 className="font-display text-4xl font-bold mb-4">We'd love to hear from you</h1>
          <p className="text-ink-300 leading-relaxed">
            Questions, feedback, partnership ideas, or just want to say hello — we read every message.
          </p>
        </div>
      </section>

      <section className="py-20 bg-ink-50">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-5 gap-12">

          {/* Contact info + FAQ */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display font-bold text-ink-900 text-xl mb-5">Contact details</h2>
              <div className="space-y-3">
                {CONTACT_INFO.map(({ icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl border border-ink-200 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs text-ink-400 font-medium">{label}</p>
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-jade-600 hover:underline font-medium">{value}</a>
                      ) : (
                        <p className="text-sm text-ink-700 font-medium">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display font-bold text-ink-900 text-xl mb-5">Frequently asked</h2>
              <div className="space-y-4">
                {FAQ.map(({ q, a }) => (
                  <details key={q} className="card p-4 cursor-pointer group">
                    <summary className="font-medium text-ink-800 text-sm list-none flex items-center justify-between gap-2">
                      {q}
                      <span className="text-ink-400 group-open:rotate-180 transition-transform flex-shrink-0">▾</span>
                    </summary>
                    <p className="text-ink-500 text-sm leading-relaxed mt-3 pt-3 border-t border-ink-50">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="card p-8">
              {submitted ? (
                <div className="text-center py-10 animate-scale-in">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="font-display text-2xl font-bold text-ink-900 mb-3">Message sent!</h2>
                  <p className="text-ink-500 leading-relaxed max-w-sm mx-auto">
                    Thanks for reaching out. We typically respond within 1–2 business days.
                  </p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="mt-6 btn-md btn-outline">
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display font-bold text-ink-900 text-xl mb-6">Send us a message</h2>
                  <ErrorAlert message={error} onDismiss={() => setError('')} />
                  {error && <div className="mb-4" />}
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Your name</label>
                        <input name="name" required value={form.name} onChange={handle}
                          placeholder="Alex Johnson" className="input" />
                      </div>
                      <div>
                        <label className="label">Email address</label>
                        <input name="email" type="email" required value={form.email} onChange={handle}
                          placeholder="you@example.com" className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <select name="subject" required value={form.subject} onChange={handle} className="input">
                        <option value="">Select a topic…</option>
                        <option value="General question">General question</option>
                        <option value="Bug report">Bug report</option>
                        <option value="Feature request">Feature request</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Press">Press inquiry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Message</label>
                      <textarea name="message" required value={form.message} onChange={handle}
                        rows={6} maxLength={2000}
                        placeholder="Tell us what's on your mind…"
                        className="input resize-none" />
                      <p className="text-xs text-ink-400 text-right mt-1">{form.message.length}/2000</p>
                    </div>
                    <Button type="submit" size="lg" className="w-full" loading={loading}>
                      Send message
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}