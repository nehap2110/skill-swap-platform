/**
 * Safely resolve the display name for a skill regardless of whether it is:
 *  - a populated object with { name } (Skill model newer field)
 *  - a populated object with { title } (Skill model as populated in swaps)
 *  - a raw MongoDB ObjectId string
 *  - null / undefined
 *
 * Backend populates swap skills as: 'title category level'
 * Backend populates user skills as: 'title category level' (getMatches)
 * Skill model stores: name (lowercase), title is NOT a separate field.
 *
 * Note: The Skill model uses `name` as the field. When populated in queries
 * that select 'title category level', name still comes through as 'name' because
 * that's what's stored. The populate projection 'title' selects a non-existent
 * field and returns undefined — so we must check name → title → _id.
 */
// export function skillName(skill) {
//   if (!skill) return '—'
//   if (typeof skill === 'string') return skill.length === 24 ? `ID:${skill.slice(-4)}` : skill
//   return skill.name || skill.title || String(skill._id || skill.id || '—')
// }

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