'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Hand-crafted SVG Cricket Bat
 */
export function CricketBatIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Cricket Bat"
    >
      {/* Handle Grip */}
      <rect x="18.5" y="2.5" width="2.5" height="6.5" rx="1.2" transform="rotate(45 18.5 2.5)" fill="#c59b27" stroke="#8d6e1b" strokeWidth="0.8" />
      {/* Rubber Grip Ribs */}
      <line x1="17.2" y1="4.2" x2="19.2" y2="6.2" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.8" />
      <line x1="15.8" y1="5.6" x2="17.8" y2="7.6" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.8" />
      {/* Splice Joint */}
      <polygon points="15.5,8 13.5,6 12,7.5 14,9.5" fill="#a77a28" />
      {/* Willow Blade */}
      <path
        d="M13.5 8.5L5.5 16.5C4.8 17.2 4.2 18.2 4.5 19.5C4.8 20.8 5.8 21.2 6.8 20.8L15 12.8L13.5 8.5Z"
        fill="#e8cb93"
        stroke="#8b6528"
        strokeWidth="1"
      />
      {/* Blade spine shadow */}
      <path d="M12.8 10L6 16.8L5.2 18.5L7.2 18.2L14 11.4L12.8 10Z" fill="#d4b476" opacity="0.6" />
      {/* Red Toe Guard */}
      <path d="M4.5 19.5C4.7 20.4 5.4 20.8 6.2 20.6L5.2 21.2C4.3 21.2 3.8 20.4 4.5 19.5Z" fill="#b91c1c" />
    </svg>
  )
}

/**
 * Hand-crafted SVG Cricket Stumps with Bails
 */
export function CricketStumpsIcon({
  className,
  size = 18,
  broken = false,
}: {
  className?: string
  size?: number
  broken?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Cricket Stumps"
    >
      {broken ? (
        <>
          {/* Ground base */}
          <line x1="2" y1="22" x2="22" y2="22" stroke="#8b6528" strokeWidth="1.5" strokeLinecap="round" />
          {/* Flying Left Bail */}
          <rect x="2" y="3" width="7" height="1.6" rx="0.8" transform="rotate(-35 2 3)" fill="#e5b842" stroke="#8b6528" strokeWidth="0.6" />
          {/* Flying Right Bail */}
          <rect x="15" y="2" width="7" height="1.6" rx="0.8" transform="rotate(40 15 2)" fill="#e5b842" stroke="#8b6528" strokeWidth="0.6" />
          {/* Upright Stump 1 */}
          <rect x="5.5" y="8" width="2" height="14" rx="0.8" fill="#d4b476" stroke="#8b6528" strokeWidth="0.8" />
          {/* Tilted Middle Stump */}
          <rect x="11.5" y="8" width="2" height="14" rx="0.8" transform="rotate(18 11.5 8)" fill="#d4b476" stroke="#8b6528" strokeWidth="0.8" />
          {/* Upright Stump 3 */}
          <rect x="16.5" y="8" width="2" height="14" rx="0.8" fill="#d4b476" stroke="#8b6528" strokeWidth="0.8" />
          {/* Red ball impact spark */}
          <circle cx="12" cy="7" r="2.5" fill="#dc2626" />
        </>
      ) : (
        <>
          {/* Bails on top */}
          <rect x="4.5" y="5" width="7" height="1.8" rx="0.9" fill="#e5b842" stroke="#8b6528" strokeWidth="0.6" />
          <rect x="12.5" y="5" width="7" height="1.8" rx="0.9" fill="#e5b842" stroke="#8b6528" strokeWidth="0.6" />
          {/* Three Stumps */}
          <rect x="5.5" y="6.8" width="2.2" height="15.2" rx="0.8" fill="#e8cb93" stroke="#8b6528" strokeWidth="0.8" />
          <rect x="10.9" y="6.8" width="2.2" height="15.2" rx="0.8" fill="#e8cb93" stroke="#8b6528" strokeWidth="0.8" />
          <rect x="16.3" y="6.8" width="2.2" height="15.2" rx="0.8" fill="#e8cb93" stroke="#8b6528" strokeWidth="0.8" />
          {/* Pitch crease base */}
          <line x1="3" y1="22" x2="21" y2="22" stroke="#8b6528" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/**
 * Hand-crafted SVG Cricket Ball with Real Stitched Seam
 */
export function CricketBallIcon({
  className,
  size = 18,
  variant = 'red',
}: {
  className?: string
  size?: number
  variant?: 'red' | 'white' | 'gold' | 'pink'
}) {
  const colors = {
    red: { fill: '#b91c1c', stroke: '#7f1d1d', seam: '#ffffff', glow: '#ef4444' },
    white: { fill: '#f8fafc', stroke: '#cbd5e1', seam: '#0f172a', glow: '#ffffff' },
    gold: { fill: '#c59b27', stroke: '#854d0e', seam: '#ffffff', glow: '#eab308' },
    pink: { fill: '#db2777', stroke: '#831843', seam: '#ffffff', glow: '#ec4899' },
  }[variant]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className)}
      aria-label="Cricket Ball"
    >
      <circle cx="12" cy="12" r="10" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.2" />
      {/* Light sheen reflection */}
      <path
        d="M6 7C8 4.5 12 4 14 5C10 5.5 8 8 6 7Z"
        fill="#ffffff"
        fillOpacity="0.45"
      />
      {/* Center prominent raised seam */}
      <path
        d="M4.5 17C8.5 15 15.5 9 19.5 7"
        stroke={colors.seam}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Cross-stitch marks along seam */}
      <line x1="6" y1="14.5" x2="7.5" y2="16.5" stroke={colors.seam} strokeWidth="0.8" />
      <line x1="9" y1="12.5" x2="10.5" y2="14.5" stroke={colors.seam} strokeWidth="0.8" />
      <line x1="12" y1="10.5" x2="13.5" y2="12.5" stroke={colors.seam} strokeWidth="0.8" />
      <line x1="15" y1="8.5" x2="16.5" y2="10.5" stroke={colors.seam} strokeWidth="0.8" />
      <line x1="17.5" y1="6.5" x2="19" y2="8.5" stroke={colors.seam} strokeWidth="0.8" />
    </svg>
  )
}

/**
 * Full Cricket Stadium Ground Background
 * Features:
 * - Floodlight beams in the top corners
 * - Mowed outfield rings (alternating dark green turf stripes)
 * - 30-yard fielding circle
 * - Central 22-yard clay pitch strip with popping crease & stumps
 * - Boundary rope with white markers
 */
export function CricketGroundBackdrop({
  className,
  children,
  showPitch = false,
}: {
  className?: string
  children?: React.ReactNode
  showPitch?: boolean
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-[#062315]', className)}>
      {/* Stadium Outfield SVG Art */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-85">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Floodlight Gradients */}
            <radialGradient id="floodlight-left" cx="5%" cy="5%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="35%" stopColor="#c59b27" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#062315" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="floodlight-right" cx="95%" cy="5%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="35%" stopColor="#c59b27" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#062315" stopOpacity="0" />
            </radialGradient>

            {/* Stadium Outfield Radial Turf */}
            <radialGradient id="turf-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#0f442b" />
              <stop offset="45%" stopColor="#0d3a24" />
              <stop offset="75%" stopColor="#092d1c" />
              <stop offset="100%" stopColor="#062315" />
            </radialGradient>

            {/* Subtle Mower grass pattern */}
            <pattern id="mower-stripes" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
              <rect width="24" height="48" fill="#ffffff" fillOpacity="0.015" />
              <rect x="24" width="24" height="48" fill="#000000" fillOpacity="0.025" />
            </pattern>
          </defs>

          {/* Base Turf */}
          <rect width="1000" height="500" fill="url(#turf-glow)" />
          {/* Mower pattern overlay */}
          <rect width="1000" height="500" fill="url(#mower-stripes)" />

          {/* Outfield Oval Rings */}
          <ellipse cx="500" cy="250" rx="460" ry="210" stroke="#c59b27" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="8 6" />
          <ellipse cx="500" cy="250" rx="420" ry="190" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />
          
          {/* 30-Yard Circle (Fielding Restriction) */}
          <ellipse cx="500" cy="250" rx="260" ry="120" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.2" strokeDasharray="8 8" />

          {/* Optional Central 22-Yard Pitch Strip */}
          {showPitch && (
            <g transform="translate(465, 150)">
              <rect x="0" y="0" width="70" height="200" rx="4" fill="#dec492" stroke="#8f7247" strokeWidth="1" opacity="0.4" />
              <line x1="8" y1="25" x2="62" y2="25" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
              <line x1="3" y1="42" x2="67" y2="42" stroke="#ffffff" strokeWidth="1.8" opacity="0.6" />
              <line x1="3" y1="158" x2="67" y2="158" stroke="#ffffff" strokeWidth="1.8" opacity="0.6" />
              <line x1="8" y1="175" x2="62" y2="175" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            </g>
          )}

          {/* Corner Floodlight Beams */}
          <rect width="1000" height="500" fill="url(#floodlight-left)" />
          <rect width="1000" height="500" fill="url(#floodlight-right)" />
        </svg>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/**
 * Interactive 22-Yard Pitch Visualizer
 * Displays current striker, non-striker, bowler, pitch crease, and last ball telemetry!
 */
export function PitchCreaseVisualizer({
  strikerName,
  strikerRuns,
  strikerBalls,
  nonStrikerName,
  nonStrikerRuns,
  nonStrikerBalls,
  bowlerName,
  bowlerFigures,
  lastBallLabel,
}: {
  strikerName?: string | null
  strikerRuns?: number | null
  strikerBalls?: number | null
  nonStrikerName?: string | null
  nonStrikerRuns?: number | null
  nonStrikerBalls?: number | null
  bowlerName?: string | null
  bowlerFigures?: string | null
  lastBallLabel?: string | null
}) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#0b3521] via-[#0d3a24] to-[#072416] border border-[#c59b27]/30 p-4 text-white shadow-md overflow-hidden">
      {/* Background Grass Sheen */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="relative flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#c59b27]">
          <CricketBatIcon size={16} />
          <span>22 Yards Live Pitch Center</span>
        </span>
        {lastBallLabel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-[#c59b27]/40 text-xs font-mono font-bold text-white">
            <CricketBallIcon size={12} variant="red" />
            <span>Last delivery: <b className="text-[#c59b27]">{lastBallLabel}</b></span>
          </span>
        )}
      </div>

      {/* Crease Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-center">
        {/* Batting End (Striker & Non-Striker) */}
        <div className="space-y-2.5 md:col-span-2">
          {/* Striker */}
          <div className="flex items-center justify-between bg-white/10 border border-[#c59b27]/50 rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c59b27] text-white flex items-center justify-center font-black shadow-xs">
                <CricketBatIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                  <span>{strikerName || 'Striker'}</span>
                  <span className="text-[#c59b27] font-black">*</span>
                  <span className="text-[10px] font-mono uppercase bg-[#c59b27]/25 text-[#c59b27] px-1.5 py-0.2 rounded font-bold">
                    On Strike
                  </span>
                </div>
                <div className="text-[11px] text-[#f8f6f0]/70">Batting Crease</div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-black text-white">{strikerRuns ?? 0}</span>
              <span className="text-xs text-[#f8f6f0]/60 ml-1">({strikerBalls ?? 0}b)</span>
            </div>
          </div>

          {/* Non-Striker */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-white/70 flex items-center justify-center font-bold">
                <span className="text-[11px] font-mono">NS</span>
              </div>
              <div>
                <div className="font-bold text-xs text-white/90">{nonStrikerName || 'Non-Striker'}</div>
                <div className="text-[10px] text-[#f8f6f0]/60">Popping Crease</div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-white/90">{nonStrikerRuns ?? 0}</span>
              <span className="text-xs text-[#f8f6f0]/60 ml-1">({nonStrikerBalls ?? 0}b)</span>
            </div>
          </div>
        </div>

        {/* Bowling End */}
        <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c59b27] flex items-center gap-1.5">
              <CricketBallIcon size={14} variant="red" />
              <span>Active Bowler</span>
            </span>
            <CricketStumpsIcon size={16} />
          </div>
          <div>
            <div className="font-serif font-black text-sm text-white">{bowlerName || 'Awaiting Bowler'}</div>
            <div className="text-xs font-mono font-bold text-[#c59b27] mt-0.5">
              {bowlerFigures || '0-0-0-0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
