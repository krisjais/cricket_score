'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_LABEL } from '@/lib/client'
import type { TimelineBall } from '@/lib/cricket'

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      Live
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (status === 'LIVE') return <LiveBadge className={className} />
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-[#f4efe6] text-[#916922] border border-[#e8e2d5]',
    TOSS_DONE: 'bg-amber-100 text-amber-900 border border-amber-200',
    PAUSED: 'bg-orange-100 text-orange-900 border border-orange-200',
    INNINGS_BREAK: 'bg-teal-100 text-teal-900 border border-teal-200',
    COMPLETED: 'bg-[#f4efe6] text-[#0d3a24] border border-[#c59b27]/40 font-bold',
    ABANDONED: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        styles[status] ?? 'bg-zinc-100 text-zinc-700 border border-zinc-200',
        className
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function TeamLogo({
  name,
  shortName,
  color,
  logoUrl,
  size = 'md',
  className,
}: {
  name: string
  shortName: string
  color?: string
  logoUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-18 w-18 text-xl',
  }

  if (logoUrl) {
    return (
      <span
        aria-hidden
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-[#e8e2d5] overflow-hidden bg-white border border-[#e8e2d5]',
          sizes[size],
          className
        )}
        title={name}
      >
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // fallback to initials on broken image link
            const target = e.currentTarget
            target.style.display = 'none'
            if (target.parentElement) {
              target.parentElement.style.backgroundColor = color || '#0d3a24'
              target.parentElement.innerText = shortName.slice(0, 4).toUpperCase()
              target.parentElement.style.color = '#ffffff'
            }
          }}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm ring-2 ring-white',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color || '#0d3a24' }}
      title={name}
    >
      {shortName.slice(0, 4).toUpperCase()}
    </span>
  )
}

const BALL_STYLES: Record<string, string> = {
  W: 'bg-gradient-to-br from-red-600 via-rose-700 to-rose-900 text-white border border-red-400 shadow-sm ring-1 ring-red-500/30 font-black',
  '4': 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white border border-emerald-300 shadow-sm font-black',
  '6': 'bg-gradient-to-br from-[#f59e0b] via-[#c59b27] to-[#78350f] text-white border border-amber-300 shadow-sm font-black ring-1 ring-amber-400/40',
  run: 'bg-gradient-to-br from-white via-[#faf8f5] to-[#f4efe6] text-[#0d3a24] border border-[#d6cebf] font-black shadow-2xs',
  dot: 'bg-gradient-to-br from-[#f4efe6] to-[#e8e2d5] text-[#6b7280] border border-[#d6cebf] font-bold shadow-2xs',
  extra: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-white border border-amber-300 font-black shadow-xs',
}

export function BallDot({
  ball,
  size = 'md',
}: {
  ball: Pick<TimelineBall, 'label' | 'kind'>
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes =
    size === 'sm'
      ? 'h-6 w-6 text-[10px]'
      : size === 'lg'
      ? 'h-10 w-10 text-sm font-black'
      : 'h-8 w-8 text-xs'

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-bold select-none transition-transform hover:scale-105 active:scale-95 overflow-hidden',
        sizes,
        BALL_STYLES[ball.kind] ?? BALL_STYLES.run
      )}
      title={ball.label}
    >
      {/* 3D Curved Light Reflection Sheen */}
      <span className="absolute top-0.5 left-1/4 w-1/2 h-1/3 bg-white/35 rounded-full blur-[0.4px] pointer-events-none" />
      <span className="relative z-10">{ball.label}</span>
    </span>
  )
}

export function BallDotsRow({
  balls,
  size = 'md',
}: {
  balls: Array<{ label: string; kind: string; runs: number }>
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!balls.length) return <span className="text-xs text-[#6b7280] italic">No deliveries yet</span>
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {balls.map((b, i) => (
        <BallDot key={i} ball={b as never} size={size} />
      ))}
    </div>
  )
}
