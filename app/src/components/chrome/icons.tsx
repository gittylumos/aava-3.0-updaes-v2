/* One icon system for the whole product.
 *
 * Rules, so the set reads as one hand rather than six:
 *   - 24x24 grid, rendered at 19px, drawn to a 4px margin
 *   - stroke 1.6, round caps and joins, no fills (the brand mark is the sole exception)
 *   - geometry snapped to whole/half units so strokes stay crisp at 19px
 *   - `currentColor` throughout, so state lives in the parent
 */

import aavaLogo from '../../assets/aava-logo.png'

type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/* Sidebar toggle — a panel with its left column filled in. Says "this column
   comes and goes", which a hamburger does not. */
export function IconPanel({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M9.5 4.5v15" />
    </svg>
  )
}

/** The same panel, mirrored — the workspace toggle on the other edge. */
export function IconRightPanel({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M14.5 4.5v15" />
    </svg>
  )
}

/** Disclosure chevron — points right when closed, rotated by the caller when open. */
export function IconChevron({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m10 7.5 4.5 4.5L10 16.5" />
    </svg>
  )
}

export function IconSearch({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  )
}

/* Pinned — an upright pushpin. The angled classic renders as a scribble at 19px;
   this one holds its silhouette. */
export function IconPinned({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 3.5h6" />
      <path d="M13.5 3.5v4.75c0 .95.54 1.82 1.4 2.24l1.35.66H7.75l1.35-.66c.86-.42 1.4-1.29 1.4-2.24V3.5" />
      <path d="M12 11.15V20.5" />
    </svg>
  )
}

/* New chat — a plus in a rounded square, matching the sketch's boxed "+". */
export function IconPlus({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

/** Chat — a single speech bubble, tail bottom-left. Pairs with IconTasks. */
export function IconChat({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20.5 12.25c0 3.87-3.58 7-8 7a9.3 9.3 0 0 1-2.35-.3L5.5 20.5l1.2-3.2a6.6 6.6 0 0 1-2.2-5.05c0-3.87 3.58-7 8-7s8 3.13 8 7Z" />
    </svg>
  )
}

export function IconBell({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 15.25V10.5a6 6 0 0 0-12 0v4.75L4.5 17.5h15Z" />
      <path d="M10 20.25a2.15 2.15 0 0 0 4 0" />
    </svg>
  )
}

/* Tasks — a checklist. Two ticks reading down the left, two rules to their right. */
export function IconTasks({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m3.75 7.5 2 2 4-4.25" />
      <path d="m3.75 16.5 2 2 4-4.25" />
      <path d="M13 7.75h7.25M13 16.75h7.25" />
    </svg>
  )
}

/* A folder — everything gathered under one task, not a single document. */
export function IconFolder({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 7a2 2 0 0 1 2-2h3.5l2 2.5h7.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    </svg>
  )
}

/* Two sliders — the filter control over Recents. */
export function IconFilter({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 4.75v5.5M9 13.75v5.5M15 4.75v3.5M15 11.75v7.5" />
      <path d="M6.75 12H11.25M12.75 9.75h4.5" />
    </svg>
  )
}

/* Sun / moon. One glyph swaps for the other so the control shows what you'll
   GET, not what you're in — the convention users actually expect. */
export function IconSun({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.75v2M12 19.25v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2.75 12h2M19.25 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

export function IconMoon({ size = 19, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.75 8.75 0 1 0 10.8 10.8Z" />
    </svg>
  )
}

export function IconClose({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

/* The real AAVA brand mark — the two-tone "A" on its black disc.
 *
 * Supplied as a 32x32 SVG that was really a 2500x2500 raster in a pattern fill
 * (107KB for a 19px glyph). Downsampled to a 96px asset (2.3KB, 3x the largest
 * on-screen use) and the disc is clipped with border-radius rather than an SVG
 * path, since CSS does that for free. */
export function BrandMark({ size = 18, className }: IconProps) {
  return (
    <img
      src={aavaLogo}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`shrink-0 rounded-full select-none ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  )
}
