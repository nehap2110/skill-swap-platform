/**
 * Skills.jsx
 *
 * Bug fixes applied:
 * 1. skillsOffered/skillsWanted IDs vs objects: use skillName() and skillId() everywhere.
 * 2. When saving to profile: send array of ID strings (not objects).
 * 3. Skill search: debounced, uses ?search= param.
 * 4. Profile skill update response is publicProfile — update state from it.
 * 5. "Objects not valid as React child" — guard all skill renders with skillName().
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { extractError } from '../services/api'
import { skillName, skillId } from '../utils/skillName'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import ErrorAlert from '../components/ErrorAlert'
import Empty from '../components/Empty'
import { useToast, ToastContainer } from '../components/Toast'

function SkillToggle({ skill, mode, active, onToggle }) {
  const name = skillName(skill)
  return (
    <button
      type="button"
      onClick={() => onToggle(skill)}
      className={`badge border transition-all cursor-pointer text-sm py-1 px-3 ${
        active
          ? mode === 'offered'
            ? 'bg-jade-500 text-white border-jade-500 shadow-sm'
            : 'bg-sky-500 text-white border-sky-500 shadow-sm'
          : 'bg-white text-ink-600 border-ink-200 hover:border-jade-400 hover:text-jade-700'
      }`}>
      {active ? '✓ ' : ''}{name}
    </button>
  )
}

export default function Skills() {
  const { user, refreshUser } = useAuth()
  const { toasts, toast }     = useToast()

  const [allSkills, setAllSkills]   = useState([])
  const [search, setSearch]         = useState('')
  const [newSkill, setNewSkill]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [addError, setAddError]     = useState('')
  const [tab, setTab]               = useState('browse')

  // Local selections — arrays of _id strings
  const [offered, setOffered] = useState([])
  const [wanted,  setWanted]  = useState([])

  // Seed from user profile on mount / user change
  useEffect(() => {
    if (!user) return
    setOffered((user.skillsOffered || []).map(s => skillId(s)).filter(Boolean))
    setWanted( (user.skillsWanted  || []).map(s => skillId(s)).filter(Boolean))
  }, [user?._id || user?.id]) // eslint-disable-line

  // Fetch skills with debounced search
  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const params = search.trim() ? { search: search.trim() } : {}
      const { data } = await api.get('/skills', { params })
      setAllSkills(data.data?.skills || [])
    } catch {
      setAllSkills([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchSkills, 300)
    return () => clearTimeout(t)
  }, [fetchSkills])

  const addSkill = async (e) => {
    e.preventDefault()
    if (!newSkill.trim()) return
    setAdding(true)
    setAddError('')
    try {
      await api.post('/skills', { name: newSkill.trim() })
      setNewSkill('')
      await fetchSkills()
      toast('Skill added!')
    } catch (err) {
      setAddError(extractError(err))
    } finally {
      setAdding(false)
    }
  }

  const deleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return
    try {
      await api.delete(`/skills/${id}`)
      await fetchSkills()
      toast('Skill deleted')
    } catch (err) {
      toast(extractError(err), 'error')
    }
  }

  const toggleOffered = (skill) => {
    const id = skillId(skill)
    if (!id) return
    setOffered(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleWanted = (skill) => {
    const id = skillId(skill)
    if (!id) return
    setWanted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Send arrays of ID strings — backend handles them as ObjectId refs
      await api.put('/users/me', { skillsOffered: offered, skillsWanted: wanted })
      await refreshUser()
      toast('Profile skills saved! ✅')
    } catch (err) {
      toast(extractError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  // Detect unsaved changes
  const savedOfferedIds = (user?.skillsOffered || []).map(s => skillId(s)).filter(Boolean)
  const savedWantedIds  = (user?.skillsWanted  || []).map(s => skillId(s)).filter(Boolean)
  const hasChanges =
    JSON.stringify([...offered].sort()) !== JSON.stringify([...savedOfferedIds].sort()) ||
    JSON.stringify([...wanted].sort())  !== JSON.stringify([...savedWantedIds].sort())

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Skills</h1>
          <p className="text-sm text-ink-400 mt-0.5">Browse, add, and assign skills to your profile</p>
        </div>
        <div className="flex gap-2 bg-ink-100 p-1 rounded-xl">
          {[['browse', '🔍 Browse'], ['manage', '⚙️ Manage']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === 'browse' && (
        <>
          {/* Add skill form */}
          <Card>
            <h2 className="font-medium text-ink-700 mb-3 text-sm">Add a new skill to the platform</h2>
            <form onSubmit={addSkill} className="flex gap-2">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                placeholder="e.g. Python, Piano, Photography…"
                className="input flex-1" />
              <Button type="submit" loading={adding}>Add</Button>
            </form>
            {addError && <ErrorAlert message={addError} className="mt-2" />}
          </Card>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search skills…" className="input pl-9" />
          </div>

          {/* Two-panel selector */}
          <Card>
            <div className="flex gap-4 mb-4 text-xs text-ink-500 flex-wrap">
              <p className="font-medium text-ink-600 text-sm">Click skills to add them to your profile:</p>
            </div>
            <div className="flex gap-6 mb-5 text-xs text-ink-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-jade-500 inline-block" /> Offered by you
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Wanted by you
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-8 rounded-full shimmer" />)}
              </div>
            ) : allSkills.length === 0 ? (
              <Empty icon="🎯" title="No skills found"
                description="Try a different search term or add a new skill above." />
            ) : (
              <div className="space-y-5">
                {/* Offered column */}
                <div>
                  <p className="text-xs font-bold text-jade-700 uppercase tracking-wide mb-2">
                    I can offer:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map(s => {
                      const id = skillId(s)
                      return (
                        <SkillToggle key={id} skill={s} mode="offered"
                          active={offered.includes(id)}
                          onToggle={() => toggleOffered(s)} />
                      )
                    })}
                  </div>
                </div>

                {/* Wanted column */}
                <div>
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-2">
                    I want to learn:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map(s => {
                      const id = skillId(s)
                      return (
                        <SkillToggle key={id} skill={s} mode="wanted"
                          active={wanted.includes(id)}
                          onToggle={() => toggleWanted(s)} />
                      )
                    })}
                  </div>
                </div>

                {/* Unsaved changes bar */}
                {hasChanges && (
                  <div className="flex items-center justify-between pt-4 border-t border-ink-100 animate-slide-up">
                    <p className="text-sm text-ink-500">You have unsaved changes</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setOffered(savedOfferedIds)
                        setWanted(savedWantedIds)
                      }}>
                        Revert
                      </Button>
                      <Button size="sm" loading={saving} onClick={saveProfile}>
                        Save to profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'manage' && (
        <Card>
          <h2 className="font-medium text-ink-700 mb-4">All platform skills</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl shimmer" />)}
            </div>
          ) : allSkills.length === 0 ? (
            <Empty icon="💡" title="No skills yet"
              description="Add the first skill using the Browse tab." />
          ) : (
            <div className="divide-y divide-ink-50">
              {allSkills.map(skill => {
                const id = skillId(skill)
                const nm = skillName(skill)
                return (
                  <div key={id} className="flex items-center justify-between py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-ink-800">{nm}</p>
                      {skill.createdBy?.name && (
                        <p className="text-xs text-ink-400">Added by {skill.createdBy.name}</p>
                      )}
                    </div>
                    <button onClick={() => deleteSkill(id)}
                      className="opacity-0 group-hover:opacity-100 btn-sm btn-danger transition-opacity">
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}