
export function skillName(skill) {
  if (!skill) return '—'
  if (typeof skill === 'string') return skill.length === 24 ? `ID:${skill.slice(-4)}` : skill
  return skill.name 
}

/**
 * Safely get a skill's _id string regardless of object vs string form.
 */
export function skillId(skill) {
  if (!skill) return null
  if (typeof skill === 'string') return skill
  return String(skill._id || skill.id || '')
}