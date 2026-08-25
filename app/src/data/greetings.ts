/** Start headline. Plain greeting by local time of day — no variants, no jokes. */

export type DayPart = 'morning' | 'afternoon' | 'evening'

export function dayPart(date = new Date()): DayPart {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

const LABEL: Record<DayPart, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
}

export function pickGreeting(name: string, date = new Date()): string {
  return `${LABEL[dayPart(date)]}, ${name}`
}
