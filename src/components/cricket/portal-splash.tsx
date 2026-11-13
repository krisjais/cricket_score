'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, BarChart3, Radio, Sparkles, UserCheck } from 'lucide-react'
import { AplLogo } from '@/components/cricket/apl-logo'

const EMBER_PARTICLES = [
  { left: '16%', bottom: '20%', dx: '-18px', dur: '2.2s', delay: '0.05s', size: 'h-1.5 w-1.5', gold: true },
  { left: '24%', bottom: '15%', dx: '22px', dur: '2.6s', delay: '0.35s', size: 'h-1 w-1', gold: false },
  { left: '33%', bottom: '26%', dx: '-12px', dur: '2.0s', delay: '0.15s', size: 'h-2 w-2', gold: true },
  { left: '42%', bottom: '16%', dx: '16px', dur: '2.4s', delay: '0.5s', size: 'h-1 w-1', gold: true },
  { left: '51%', bottom: '12%', dx: '-20px', dur: '2.7s', delay: '0.25s', size: 'h-1.5 w-1.5', gold: false },
  { left: '59%', bottom: '24%', dx: '14px', dur: '2.1s', delay: '0.1s', size: 'h-1.5 w-1.5', gold: true },
  { left: '67%', bottom: '15%', dx: '-16px', dur: '2.5s', delay: '0.45s', size: 'h-1 w-1', gold: true },
  { left: '76%', bottom: '22%', dx: '20px', dur: '2.3s', delay: '0.2s', size: 'h-2 w-2', gold: false },
  { left: '84%', bottom: '17%', dx: '-14px', dur: '2.6s', delay: '0.6s', size: 'h-1.5 w-1.5', gold: true },
  { left: '47%', bottom: '30%', dx: '10px', dur: '1.9s', delay: '0.3s', size: 'h-1 w-1', gold: true },
] as const

const COMPASS_ANGLES = Array.from({ length: 36 }, (_, i) => i * 10)

/**
 * Lightweight pre-hydration stadium fallback matching PortalSplashScreen
 * so cold initial load is 100% opaque and matches the midnight arena theme.
 */
export function SplashLoadingFallback() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-[#070B16]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 42%, rgba(122, 20, 38, 0.36) 0%, rgba(20, 25, 40, 0.94) 48%, #070B16 100%)',
      }}
    >
      <div className="relative flex items-center justify-center mb-6">
        <div
          aria-hidden="true"
          className="absolute h-48 w-48 rounded-full border border-[#F5C451]/30 border-t-[#F5C451] motion-safe:animate-spin"
        />
        <AplLogo
          size="2xl"
          variant="dark"
          priority
          alt="APL Season 9 Crest"
          imgClassName="h-36 sm:h-44 xl:h-48"
        />
      </div>
      <p className="text-sm font-extrabold uppercase tracking-[0.26em] text-[#F5C451]">
        Alliance Premier League
      </p>
      <p className="mt-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300/80">
        Entering APL Season 9 Arena...
      </p>
    </div>
  )
}

export function PortalSplashScreen({
  onFinished,
}: {
  onFinished?: () => void
}) {
  const [mounted, setMounted] = useState(true)
  const [closing, setClosing] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const leftGateRef = useRef<HTMLDivElement>(null)
  const rightGateRef = useRef<HTMLDivElement>(null)
  const dismissStartedRef = useRef(false)

  const startDismiss = useCallback(async () => {
    if (dismissStartedRef.current) return
    dismissStartedRef.current = true
    setClosing(true)

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const elements = [rootRef.current, leftGateRef.current, rightGateRef.current].filter(
      (el): el is HTMLDivElement => Boolean(el)
    )
    const exitAnimations = elements.flatMap((el) => el.getAnimations())

    if (exitAnimations.length > 0) {
      await Promise.race([
        Promise.allSettled(exitAnimations.map((anim) => anim.finished)),
        new Promise((resolve) => setTimeout(resolve, 640)),
      ])
    }

    setMounted(false)
    onFinished?.()
  }, [onFinished])

  useEffect(() => {
    if (!mounted) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const step1 = window.setTimeout(() => setStageIndex(1), reducedMotion ? 260 : 800)
    const step2 = window.setTimeout(() => setStageIndex(2), reducedMotion ? 520 : 1650)
    const autoClose = window.setTimeout(() => {
      void startDismiss()
    }, reducedMotion ? 900 : 2400)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void startDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(step1)
      window.clearTimeout(step2)
      window.clearTimeout(autoClose)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mounted, startDismiss])

  if (!mounted) return null

  const stages = [
    { label: 'Calibrating Pitch & Telemetry', pct: '38%' },
    { label: 'Syncing Live Scoreboards', pct: '76%' },
    { label: 'Arena Ready • Welcome to Season 9', pct: '100%' },
  ]
  const currentStage = stages[stageIndex]

  return (
    <div
      ref={rootRef}
      data-closing={closing ? 'true' : 'false'}
      role="region"
      aria-label="APL Season 9 Arena Intro"
      className="portal-splash-root fixed inset-0 z-[100] flex flex-col overflow-hidden select-none"
    >
      {/* Solid Opaque Left & Right Parting Stadium Tunnel Gates (overlap slightly by 1px to avoid seam bleed) */}
      <div
        ref={leftGateRef}
        aria-hidden="true"
        className="portal-splash-gate-left absolute inset-y-0 left-0 w-[50.4%] overflow-hidden bg-[#070B16]"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 100% 42%, rgba(122, 20, 38, 0.48) 0%, rgba(20, 25, 40, 0.92) 48%, #070B16 100%)',
          }}
        />
        {/* Left Upper Stadium Floodlight Cone */}
        <div
          className="splash-beam absolute -top-28 -left-20 h-[140%] w-64 sm:w-[420px] origin-top pointer-events-none blur-2xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(245, 196, 81, 0.22) 0%, rgba(245, 196, 81, 0.05) 55%, transparent 100%)',
          }}
        />
        {/* Subtle Crimson Ambient Flood */}
        <div className="absolute -bottom-24 -left-16 h-80 w-64 rounded-full bg-[#7A1426]/30 blur-3xl" />
      </div>

      <div
        ref={rightGateRef}
        aria-hidden="true"
        className="portal-splash-gate-right absolute inset-y-0 right-0 w-[50.4%] overflow-hidden bg-[#070B16]"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 0% 42%, rgba(122, 20, 38, 0.48) 0%, rgba(20, 25, 40, 0.92) 48%, #070B16 100%)',
          }}
        />
        {/* Right Upper Stadium Floodlight Cone */}
        <div
          className="splash-beam absolute -top-28 -right-20 h-[140%] w-64 sm:w-[420px] origin-top pointer-events-none blur-2xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(158, 28, 51, 0.34) 0%, rgba(245, 196, 81, 0.08) 58%, transparent 100%)',
            animationDelay: '-2.4s',
          }}
        />
        <div className="absolute -top-16 -right-16 h-80 w-64 rounded-full bg-[#F5C451]/12 blur-3xl" />
      </div>

      {/* Subtle Stadium Pitch Texture Dot Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgba(245, 196, 81, 0.45) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Navigation / Skip Arena Button */}
      <div className="relative z-20 shrink-0 flex items-center justify-between gap-2.5 px-3.5 sm:px-8 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-slate-300 whitespace-nowrap min-w-0">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate">Season 9 Live Portal</span>
        </div>
        <button
          type="button"
          onClick={() => void startDismiss()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F5C451]/35 bg-[#141928]/85 backdrop-blur-md px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold tracking-wide text-white hover:bg-[#7A1426] hover:border-[#F5C451] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5C451] transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>Enter Arena</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#F5C451]" aria-hidden="true" />
        </button>
      </div>

      {/* Center Broadcast Crest Stage */}
      <div className="portal-splash-core relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-8 text-center">
        {/* Horizontal Stadium Horizon Glow Line Behind Stage */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-12 flex items-center justify-center"
        >
          <div className="h-px w-[92vw] max-w-4xl bg-gradient-to-r from-transparent via-[#F5C451]/35 to-transparent" />
        </div>

        {/* Rising Gold & Crimson Stadium Embers */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {EMBER_PARTICLES.map((p, idx) => (
            <span
              key={idx}
              className={`splash-ember absolute rounded-full ${p.size} ${
                p.gold
                  ? 'bg-[#F5C451] shadow-[0_0_12px_rgba(245,196,81,0.95)]'
                  : 'bg-[#E11D48] shadow-[0_0_12px_rgba(225,29,72,0.85)]'
              }`}
              style={{
                left: p.left,
                bottom: p.bottom,
                ['--ember-dx' as string]: p.dx,
                ['--ember-dur' as string]: p.dur,
                ['--ember-delay' as string]: p.delay,
              }}
            />
          ))}
        </div>

        {/* Orbital Telemetry Rings + Oversized APL Season 9 Crest */}
        <div className="relative flex items-center justify-center h-[270px] w-[270px] sm:h-[340px] sm:w-[340px]">
          {/* Shockwave Ripples */}
          <span
            aria-hidden="true"
            className="splash-shockwave-1 absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full border border-[#F5C451]/45 pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="splash-shockwave-2 absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full border border-[#9E1C33]/55 pointer-events-none"
          />

          {/* Outer Rotating Stadium Azimuth Ticks */}
          <svg
            aria-hidden="true"
            viewBox="0 0 320 320"
            className="splash-orbit-cw absolute inset-0 h-full w-full pointer-events-none"
          >
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="rgba(245, 196, 81, 0.24)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            {COMPASS_ANGLES.map((deg) => (
              <line
                key={deg}
                x1="160"
                y1="14"
                x2="160"
                y2={deg % 90 === 0 ? '24' : '19'}
                stroke={deg % 90 === 0 ? '#F5C451' : 'rgba(245, 196, 81, 0.4)'}
                strokeWidth={deg % 90 === 0 ? '2' : '1.1'}
                transform={`rotate(${deg} 160 160)`}
              />
            ))}
          </svg>

          {/* Mid Counter-Rotating Crimson + Gold Energy Arcs */}
          <svg
            aria-hidden="true"
            viewBox="0 0 260 260"
            className="splash-orbit-ccw absolute h-[82%] w-[82%] pointer-events-none"
          >
            <defs>
              <linearGradient id="splash-arc-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="55%" stopColor="#F5C451" />
                <stop offset="100%" stopColor="#F5C451" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="splash-arc-crimson" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="65%" stopColor="#7A1426" />
                <stop offset="100%" stopColor="#7A1426" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke="url(#splash-arc-gold)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="190 560"
            />
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke="url(#splash-arc-crimson)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="150 600"
              strokeDashoffset="-375"
            />
          </svg>

          {/* Subtle Inner Geometric Shield Halo */}
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="splash-orbit-slow absolute h-[66%] w-[66%] pointer-events-none"
          >
            <polygon
              points="100,8 179,54 179,146 100,192 21,146 21,54"
              fill="none"
              stroke="rgba(245, 196, 81, 0.22)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Warm Stadium Halo Under Crest */}
          <div
            aria-hidden="true"
            className="absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full blur-2xl pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 196, 81, 0.34) 0%, rgba(122, 20, 38, 0.38) 58%, transparent 100%)',
            }}
          />

          {/* Central Command APL Season 9 Logo + Specular Metallic Sheen */}
          <div className="splash-crest-impact relative overflow-hidden rounded-3xl p-2">
            <AplLogo
              size="2xl"
              variant="dark"
              priority
              alt="APL Season 9 Official Crest"
              imgClassName="h-44 sm:h-52 xl:h-56 drop-shadow-[0_16px_38px_rgba(245,196,81,0.42)]"
            />
            <div
              aria-hidden="true"
              className="splash-sheen pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/45 to-transparent"
            />
          </div>
        </div>

        {/* Staggered Broadcast Lockup */}
        <div
          className="splash-text-reveal mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#F5C451]/45 bg-[#7A1426]/80 px-3 sm:px-4 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-[#FDE68A] shadow-md whitespace-nowrap"
          style={{ ['--reveal-delay' as string]: '0.12s' }}
        >
          <Sparkles className="w-3 h-3 shrink-0 text-[#F5C451]" aria-hidden="true" />
          <span>Season 9 Championship Edition</span>
        </div>

        <p
          className="splash-text-reveal mt-3 font-serif text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-white leading-none"
          style={{ ['--reveal-delay' as string]: '0.24s' }}
        >
          <span className="bg-gradient-to-r from-white via-[#FDE68A] to-[#F5C451] bg-clip-text text-transparent">
            Alliance Premier League
          </span>
        </p>

        {/* Feature Chips */}
        <div
          className="splash-text-reveal mt-3.5 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200"
          style={{ ['--reveal-delay' as string]: '0.36s' }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
            <Radio className="w-3 h-3 text-rose-400" aria-hidden="true" />
            Live Scoring
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
            <BarChart3 className="w-3 h-3 text-[#F5C451]" aria-hidden="true" />
            Points &amp; Leaders
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
            <UserCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Player Profiles
          </span>
        </div>

        {/* High-Contrast Calibration Bar */}
        <div
          className="splash-text-reveal mt-6 w-full max-w-xs sm:max-w-sm space-y-2"
          style={{ ['--reveal-delay' as string]: '0.45s' }}
        >
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px] border border-white/15">
            <div
              className="splash-progress-bar h-full w-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #7A1426 0%, #9E1C33 48%, #F5C451 100%)',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-300">
            <span>{currentStage.label}</span>
            <span className="font-mono font-bold text-[#F5C451]">{currentStage.pct}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
