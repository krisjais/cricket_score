'use client'

import { cn } from '@/lib/utils'
import { STATUS_LABEL } from '@/lib/client'
import type { TimelineBall } from '@/lib/cricket'

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[#991B1B] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-xs',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      LIVE
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (status === 'LIVE') return <LiveBadge className={className} />
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-gray-100 text-gray-700 border border-gray-200',
    TOSS_DONE: 'bg-amber-50 text-amber-800 border border-amber-200',
    PAUSED: 'bg-orange-50 text-orange-800 border border-orange-200',
    INNINGS_BREAK: 'bg-blue-50 text-blue-800 border border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
    ABANDONED: 'bg-gray-100 text-gray-500 border border-gray-200',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        styles[status] ?? 'bg-gray-100 text-gray-700 border border-gray-200',
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
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  }

  if (logoUrl) {
    return (
      <span
        aria-hidden
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full shadow-xs ring-1 ring-gray-200 overflow-hidden bg-white',
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
            const target = e.currentTarget
            target.style.display = 'none'
            if (target.parentElement) {
              target.parentElement.style.backgroundColor = color || '#7A1426'
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
        'flex shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-xs ring-1 ring-black/10',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color || '#7A1426' }}
      title={name}
    >
      {shortName.slice(0, 4).toUpperCase()}
    </span>
  )
}

const BALL_STYLES: Record<string, string> = {
  W: 'bg-[#7A1426] text-white border border-[#5B0F1C] font-bold shadow-xs',
  '4': 'bg-[#14532D] text-white border border-[#0F3F22] font-bold shadow-xs',
  '6': 'bg-[#1E293B] text-white border border-[#0F172A] font-bold shadow-xs',
  run: 'bg-gray-100 text-gray-900 border border-gray-200 font-bold',
  dot: 'bg-gray-100 text-gray-500 border border-gray-200 font-semibold',
  extra: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
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
      ? 'h-9 w-9 text-xs font-bold'
      : 'h-8 w-8 text-xs'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold select-none transition-transform hover:scale-105',
        sizes,
        BALL_STYLES[ball.kind] ?? BALL_STYLES.run
      )}
      title={ball.label}
    >
      {ball.label === '•' ? '0' : ball.label}
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
  if (!balls.length) return <span className="text-xs text-gray-400 italic">No deliveries yet</span>
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {balls.map((b, i) => (
        <BallDot key={i} ball={b as never} size={size} />
      ))}
    </div>
  )
}
