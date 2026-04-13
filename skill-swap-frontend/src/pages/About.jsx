import { Link } from 'react-router-dom'

const TEAM = [
  {
    name: 'Sarah Mitchell',
    role: 'Co-founder & CEO',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    bio: 'Former educator turned tech founder. Sarah believes knowledge should flow freely between people.',
  },
  {
    name: 'David Park',
    role: 'Co-founder & CTO',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    bio: 'Full-stack engineer who taught himself to code through online communities and peer learning.',
  },
  {
    name: 'Zara Ahmed',
    role: 'Head of Community',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    bio: 'Community builder passionate about creating spaces where diverse people can connect and grow.',
  },
]

const VALUES = [
  { icon: '🌍', title: 'Accessibility', desc: 'Quality learning should be available to everyone, regardless of financial status.' },
  { icon: '🤝', title: 'Reciprocity', desc: 'The best exchanges benefit both parties equally — knowledge flows in both directions.' },
  { icon: '🔒', title: 'Trust', desc: 'A verified, reviewed community where every member feels safe to share and learn.' },
  { icon: '🌱', title: 'Growth', desc: 'We believe continuous learning is the key to personal and professional fulfilment.' },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-ink-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-jade-400 font-semibold text-sm uppercase tracking-widest mb-4">About us</p>
          <h1 className="font-display text-5xl font-bold mb-6">
            Learning is better<br />
            <em className="text-jade-400 not-italic">when it's shared</em>
          </h1>
          <p className="text-ink-300 text-lg leading-relaxed max-w-2xl mx-auto">
            SkillSwap was born from a simple idea: everyone knows something valuable.
            Instead of expensive courses or one-sided teaching, what if people simply
            traded their expertise with each other?
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">Our mission</p>
            <h2 className="font-display text-4xl font-bold text-ink-900 mb-6">
              Democratise learning through peer exchange
            </h2>
            <div className="space-y-4 text-ink-600 leading-relaxed">
              <p>
                Traditional education is expensive and often inaccessible. Online courses can feel
                impersonal and passive. We built SkillSwap to create something different — a human
                marketplace where knowledge is the currency.
              </p>
              <p>
                When a developer teaches programming to a designer who teaches them branding, both
                people grow. That reciprocal dynamic is at the heart of everything we build.
              </p>
              <p>
                Our platform handles the matching, coordination, and trust infrastructure so you
                can focus on what matters: learning and teaching.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/register" className="btn-md btn-jade">Join the community</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop"
              alt="Collaborative learning"
              className="rounded-2xl shadow-card h-48 object-cover w-full"
            />
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"
              alt="Online collaboration"
              className="rounded-2xl shadow-card h-48 object-cover w-full mt-8"
            />
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop"
              alt="People working together"
              className="rounded-2xl shadow-card h-48 object-cover w-full -mt-8"
            />
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop"
              alt="Learning technology"
              className="rounded-2xl shadow-card h-48 object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-ink-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">What drives us</p>
            <h2 className="font-display text-4xl font-bold text-ink-900">Our core values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6 text-center hover:shadow-hover transition-shadow">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-display font-bold text-ink-900 mb-2">{title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-jade-600 font-semibold text-sm uppercase tracking-widest mb-3">The people behind it</p>
            <h2 className="font-display text-4xl font-bold text-ink-900">Meet the team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM.map(({ name, role, avatar, bio }) => (
              <div key={name} className="card p-6 text-center hover:shadow-hover transition-shadow">
                <img src={avatar} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-ink-100" />
                <h3 className="font-display font-bold text-ink-900 text-lg">{name}</h3>
                <p className="text-jade-600 text-sm font-medium mb-3">{role}</p>
                <p className="text-ink-500 text-sm leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-jade-500">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Join our mission</h2>
          <p className="text-jade-100 mb-6">Be part of a community that believes in the power of shared knowledge.</p>
          <Link to="/register" className="btn-lg bg-white text-jade-600 hover:bg-jade-50 font-bold">
            Get started for free
          </Link>
        </div>
      </section>
    </div>
  )
}