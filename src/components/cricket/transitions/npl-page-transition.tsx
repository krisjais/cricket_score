'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Award,
  Crown,
  LogIn,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { AplLogo } from '@/components/cricket/apl-logo'
import { cn } from '@/lib/utils'

export type NplTransitionType = 'awards' | 'login'

interface NplPageTransitionProps {
  type: NplTransitionType
  onCommitRoute: () => void
  onFinished: () => void
}

const AWARDS_EMBERS = [
  { left: '18%', bottom: '22%', dx: '-16px', dur: '1.8s', delay: '0.05s', size: 'h-1.5 w-1.5' },
  { left: '26%', bottom: '16%', dx: '20px', dur: '2.2s', delay: '0.2s', size: 'h-1 w-1' },
  { left: '35%', bottom: '28%', dx: '-10px', dur: '1.9s', delay: '0.1s', size: 'h-2 w-2' },
  { left: '44%', bottom: '18%', dx: '14px', dur: '2.1s', delay: '0.3s', size: 'h-1 w-1' },
  { left: '53%', bottom: '14%', dx: '-18px', dur: '2.3s', delay: '0.15s', size: 'h-1.5 w-1.5' },
  { left: '62%', bottom: '26%', dx: '12px', dur: '1.8s', delay: '0.25s', size: 'h-2 w-2' },
  { left: '71%', bottom: '16%', dx: '-14px', dur: '2.0s', delay: '0.05s', size: 'h-1.5 w-1.5' },
  { left: '80%', bottom: '24%', dx: '18px', dur: '2.2s', delay: '0.35s', size: 'h-1 w-1' },
  { left: '48%', bottom: '32%', dx: '8px', dur: '1.7s', delay: '0.1s', size: 'h-1.5 w-1.5' },
] as const

export function NplPageTransition({
  type,
  onCommitRoute,
  onFinished,
}: NplPageTransitionProps) {
  const [phase, setPhase] = useState<'entering' | 'holding' | 'leaving'>('entering')
  const committedRef = useRef(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      const commitTimer = window.setTimeout(() => {
        if (!committedRef.current) {
          committedRef.current = true
          onCommitRoute()
        }
      }, 40)
      const finishTimer = window.setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true
          onFinished()
        }
      }, 150)
      return () => {
        window.clearTimeout(commitTimer)
        window.clearTimeout(finishTimer)
      }
    }

    // Step 1: Gates finish entering at 260ms; commit the route
    const holdTimer = window.setTimeout(() => {
      setPhase('holding')
      if (!committedRef.current) {
        committedRef.current = true
        onCommitRoute()
      }
    }, 260)

    // Step 2: Begin parting gates to reveal the destination page at 400ms
    const leaveTimer = window.setTimeout(() => {
      setPhase('leaving')
    }, 400)

    // Step 3: Animation complete; unmount at 740ms
    const finishTimer = window.setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true
        onFinished()
      }
    }, 740)

    // Safety fallback
    const safetyTimer = window.setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true
        onFinished()
      }
    }, 1200)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!committedRef.current) {
          committedRef.current = true
          onCommitRoute()
        }
        if (!finishedRef.current) {
          finishedRef.current = true
          onFinished()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(holdTimer)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(finishTimer)
      window.clearTimeout(safetyTimer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onCommitRoute, onFinished])

  const isLeaving = phase === 'leaving'
  const isEntering = phase === 'entering'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        type === 'awards'
          ? 'Navigating to Tournament Awards and Honors'
          : 'Navigating to Account Portal'
      }
      className={cn(
        'fixed inset-0 z-[120] flex items-center justify-center overflow-hidden select-none transition-opacity duration-300',
        isLeaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      {/* ==================== LEFT PARTING STADIUM GATE ==================== */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-[50.5%] will-change-transform z-10',
          type === 'awards'
            ? 'bg-gradient-to-br from-[#070B16] via-[#15070B] to-[#0B101D] border-r border-[#F5C451]/50 shadow-[8px_0_32px_rgba(245,196,81,0.25)]'
            : 'bg-gradient-to-br from-[#070B16] via-[#16070B] to-[#0B101D] border-r border-[#7A1426]/80 shadow-[8px_0_32px_rgba(122,20,38,0.4)]',
          isEntering && 'npl-transition-gate-left-in',
          isLeaving && 'npl-transition-gate-left-out'
        )}
      >
        {/* Stadium lighting overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              type === 'awards'
                ? 'radial-gradient(ellipse at 100% 50%, rgba(245, 196, 81, 0.22) 0%, transparent 65%)'
                : 'radial-gradient(ellipse at 100% 50%, rgba(122, 20, 38, 0.35) 0%, transparent 65%)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* ==================== RIGHT PARTING STADIUM GATE ==================== */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 w-[50.5%] will-change-transform z-10',
          type === 'awards'
            ? 'bg-gradient-to-bl from-[#070B16] via-[#15070B] to-[#0B101D] border-l border-[#F5C451]/50 shadow-[-8px_0_32px_rgba(245,196,81,0.25)]'
            : 'bg-gradient-to-bl from-[#070B16] via-[#16070B] to-[#0B101D] border-l border-[#7A1426]/80 shadow-[-8px_0_32px_rgba(122,20,38,0.4)]',
          isEntering && 'npl-transition-gate-right-in',
          isLeaving && 'npl-transition-gate-right-out'
        )}
      >
        {/* Stadium lighting overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              type === 'awards'
                ? 'radial-gradient(ellipse at 0% 50%, rgba(245, 196, 81, 0.22) 0%, transparent 65%)'
                : 'radial-gradient(ellipse at 0% 50%, rgba(122, 20, 38, 0.35) 0%, transparent 65%)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* ==================== CENTER COMMAND CORE ==================== */}
      <div
        className={cn(
          'relative z-20 flex flex-col items-center justify-center px-4 text-center max-w-lg mx-auto will-change-transform',
          isEntering && 'npl-transition-core-in',
          isLeaving && 'npl-transition-core-out'
        )}
      >
        {type === 'awards' ? (
          /* ======================================================== */
          /*                     AWARDS TRANSITION                     */
          /* ======================================================== */
          <>
            {/* Ambient Gold Halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-24 rounded-full blur-3xl opacity-70"
              style={{
                background:
                  'radial-gradient(circle, rgba(245, 196, 81, 0.38) 0%, rgba(122, 20, 38, 0.42) 55%, transparent 75%)',
              }}
            />

            {/* Floating Golden Sparks / Embers */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {AWARDS_EMBERS.map((ember, i) => (
                <span
                  key={i}
                  className={cn(
                    'npl-ember-float-anim absolute rounded-full bg-gradient-to-t from-amber-400 to-[#F5C451]',
                    ember.size
                  )}
                  style={{
                    left: ember.left,
                    bottom: ember.bottom,
                    ['--ember-dx' as string]: ember.dx,
                    ['--ember-dur' as string]: ember.dur,
                    ['--ember-delay' as string]: ember.delay,
                  }}
                />
              ))}
            </div>

            {/* Central Trophy Medallion */}
            <div className="relative flex items-center justify-center mb-4">
              {/* Rotating outer orbit ring */}
              <div
                aria-hidden="true"
                className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-dashed border-[#F5C451]/35 animate-spin"
                style={{ animationDuration: '20s' }}
              />

              {/* Fast rotating golden energy ring */}
              <div
                aria-hidden="true"
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-[#F5C451]/55 border-t-[#FDE68A] animate-spin"
                style={{ animationDuration: '6s' }}
              />

              {/* Gold Crest Medallion with Specular Sheen */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2B1B0E]/80 to-[#12070A]/95 p-6 sm:p-7 border border-[#F5C451]/60 shadow-[0_16px_48px_rgba(245,196,81,0.38)]">
                {/* Crown floating on top */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                  <Crown className="w-6 h-6 text-amber-300 drop-shadow-[0_2px_10px_rgba(245,196,81,0.9)]" />
                </div>

                <Trophy
                  className="w-14 h-14 sm:w-16 sm:h-16 text-[#F5C451] drop-shadow-[0_4px_22px_rgba(245,196,81,0.7)]"
                  aria-hidden="true"
                />

                {/* Specular sheen beam */}
                <div
                  aria-hidden="true"
                  className="npl-sheen-sweep-anim pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </div>
            </div>

            {/* Broadcast Category Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F5C451]/50 bg-[#7A1426]/85 px-3.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FDE68A] shadow-md">
              <Award className="w-3.5 h-3.5 text-[#F5C451]" aria-hidden="true" />
              <span>APL Season 9 • Honors &amp; Awards</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            </div>

            {/* Cinematic Headline */}
            <h2 className="mt-2.5 font-serif text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              <span className="bg-gradient-to-r from-white via-[#FDE68A] to-[#F5C451] bg-clip-text text-transparent">
                Tournament Awards &amp; Leaders
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-1.5 text-xs sm:text-sm text-amber-100/80 font-medium max-w-sm">
              Celebrating Outstanding Batting, Bowling &amp; MVP Excellence
            </p>

            {/* Gold Velocity Energy Bar */}
            <div className="mt-4 w-full max-w-xs h-1 rounded-full overflow-hidden bg-white/10 p-[1px] border border-[#F5C451]/30">
              <div
                className="h-full w-full rounded-full animate-pulse"
                style={{
                  background:
                    'linear-gradient(90deg, #7A1426 0%, #F5C451 50%, #FDE68A 100%)',
                }}
              />
            </div>
          </>
        ) : (
          /* ======================================================== */
          /*                      LOGIN TRANSITION                     */
          /* ======================================================== */
          <>
            {/* Ambient Stadium Maroon Halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-24 rounded-full blur-3xl opacity-75"
              style={{
                background:
                  'radial-gradient(circle, rgba(122, 20, 38, 0.5) 0%, rgba(15, 23, 42, 0.95) 55%, transparent 75%)',
              }}
            />

            {/* Sweeping Stadium Spotlight Beams */}
            <div
              aria-hidden="true"
              className="npl-beam-sweep-anim pointer-events-none absolute -top-32 -left-24 h-96 w-48 bg-gradient-to-r from-transparent via-[#7A1426]/35 to-transparent blur-2xl transform -rotate-12"
            />
            <div
              aria-hidden="true"
              className="npl-beam-sweep-anim pointer-events-none absolute -top-32 -right-24 h-96 w-48 bg-gradient-to-l from-transparent via-[#9E1C33]/30 to-transparent blur-2xl transform rotate-12"
              style={{ animationDelay: '1.2s' }}
            />

            {/* Central APL Crest Lockup */}
            <div className="relative flex items-center justify-center mb-4">
              {/* Rotating outer ring */}
              <div
                aria-hidden="true"
                className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-[#7A1426]/40 border-t-[#F5C451] animate-spin"
                style={{ animationDuration: '10s' }}
              />

              {/* Pulsing arena core */}
              <div
                aria-hidden="true"
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent animate-pulse"
              />

              {/* APL 3D Crest with Specular Sheen */}
              <div className="relative overflow-hidden rounded-3xl p-3">
                <AplLogo
                  size="2xl"
                  variant="dark"
                  priority
                  alt="APL Season 9 Crest"
                  imgClassName="h-32 sm:h-38 drop-shadow-[0_12px_36px_rgba(122,20,38,0.85)]"
                />

                {/* Specular sheen beam */}
                <div
                  aria-hidden="true"
                  className="npl-sheen-sweep-anim pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </div>
            </div>

            {/* Broadcast Category Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7A1426]/60 bg-[#7A1426]/80 px-3.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FDE68A] shadow-md">
              <Shield className="w-3.5 h-3.5 text-[#F5C451]" aria-hidden="true" />
              <span>Nexcore Premier League • Portal</span>
              <LogIn className="w-3.5 h-3.5 text-rose-300" aria-hidden="true" />
            </div>

            {/* Cinematic Headline */}
            <h2 className="mt-2.5 font-serif text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
                Account Portal Gateway
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-medium max-w-sm">
              Player Career Hub &bull; League Admin Console
            </p>

            {/* Stadium Velocity Energy Bar */}
            <div className="mt-4 w-full max-w-xs h-1 rounded-full overflow-hidden bg-white/10 p-[1px] border border-[#7A1426]/40">
              <div
                className="h-full w-full rounded-full animate-pulse"
                style={{
                  background:
                    'linear-gradient(90deg, #7A1426 0%, #9E1C33 50%, #F5C451 100%)',
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
