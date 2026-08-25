import './aurora.css'

/** The entire affordance for "recommended". No badge, no star, no size change. */
export function AuroraRing({ children }: { children: React.ReactNode }) {
  return <div className="aurora-ring">{children}</div>
}
