/** The people who can be signed in. One source of truth so the rail avatar, the
 *  account popover, the sidebar footer and the greeting can never drift apart.
 *  The demo ships two: Deepak (an admin whose home is a board of live tasks) and
 *  Raman (a product manager whose home is empty until he starts something). */
export interface Profile {
  /** Stable key for anything stored per user — threads, pins, task state. */
  id: ProfileId
  name: string
  role: string
  org: string
  /** Shown inside the avatar circle. */
  initials: string
}

export type ProfileId = 'deepak' | 'raman'

export const PROFILES: Record<ProfileId, Profile> = {
  deepak: { id: 'deepak', name: 'Deepak', role: 'Admin', org: 'HP', initials: 'D' },
  raman: { id: 'raman', name: 'Raman', role: 'Product Manager', org: 'HP', initials: 'R' },
}

/** The profile the demo opens on. */
export const DEFAULT_PROFILE: ProfileId = 'deepak'

/** Back-compat default for anything not yet profile-aware. */
export const USER = PROFILES[DEFAULT_PROFILE]
