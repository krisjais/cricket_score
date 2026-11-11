'use client'

import { useCallback, useId, useRef, useState, type CSSProperties, type ToggleEvent } from 'react'
import {
  BadgeCheck,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PlayerSession } from '@/lib/client'
import { formatCricketLabel } from './player-types'
import { cn } from '@/lib/utils'

interface PopoverFallbackCoords {
  top: number
  left: number
}

/**
 * Signed-in player header dropdown built on a native `popover="auto"` panel
 * with CSS Anchor Positioning + viewport-clamped fixed fallback positioning.
 */
export function PlayerAccountMenu({
  playerSession,
  activeKey,
  navigate,
}: {
  playerSession: PlayerSession
  activeKey: string
  navigate: (to: string) => void
}) {
  const player = playerSession.player
  const reactId = useId()
  const sanitizedId = reactId.replace(/[^a-zA-Z0-9_-]/g, '')
  const menuId = `player-menu-${sanitizedId}`
  const anchorName = `--pa-trigger-${sanitizedId}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [fallbackCoords, setFallbackCoords] = useState<PopoverFallbackCoords | null>(null)

  const updateFallbackCoords = useCallback(() => {
    if (typeof window === 'undefined' || typeof CSS !== 'undefined' && CSS.supports?.('position-area: block-end')) {
      setFallbackCoords(null)
      return
    }
    const trigger = triggerRef.current
    const popover = popoverRef.current
    if (!trigger || !popover) return

    const rect = trigger.getBoundingClientRect()
    const gap = 8
    const popWidth = popover.offsetWidth || 288
    const popHeight = popover.offsetHeight || 280

    const maxLeft = Math.max(8, window.innerWidth - popWidth - 8)
    const left = Math.min(maxLeft, Math.max(8, rect.right - popWidth))
    const fitsBelow = rect.bottom + gap + popHeight <= window.innerHeight - 8
    const top = fitsBelow ? rect.bottom + gap : Math.max(8, rect.top - popHeight - gap)

    setFallbackCoords({ top, left })
  }, [])

  const handleToggle = useCallback(
    (e: ToggleEvent<HTMLDivElement>) => {
      const nextOpen = e.newState === 'open'
      setOpen(nextOpen)
      if (nextOpen) {
        updateFallbackCoords()
      }
    },
    [updateFallbackCoords]
  )

  if (!playerSession.isAuthenticated || !player) {
    return null
  }

  const firstName = player.name.trim().split(/\s+/)[0] || player.name
  const initials = player.name.trim().slice(0, 2).toUpperCase() || 'PL'
  const publicSlug = player.id

  function closeAndGo(to: string) {
    try {
      popoverRef.current?.hidePopover?.()
    } catch {
      // Ignore if already closed
    }
    navigate(to)
  }

  async function handleSignOut() {
    try {
      popoverRef.current?.hidePopover?.()
    } catch {
      // Ignore if already closed
    }
    await playerSession.logout().catch(() => undefined)
    toast.success('Signed out')
    navigate('/')
  }

  const triggerStyle = { anchorName } as CSSProperties
  const popoverStyle: CSSProperties = fallbackCoords
    ? ({
        positionAnchor: anchorName,
        top: `${fallbackCoords.top}px`,
        left: `${fallbackCoords.left}px`,
      } as CSSProperties)
    : ({ positionAnchor: anchorName } as CSSProperties)

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-expanded={open}
        aria-label={`Player account menu for ${player.name}`}
        style={triggerStyle}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border pl-1.5 pr-2.5 py-1 text-xs font-bold transition-colors cursor-pointer shadow-2xs',
          activeKey === 'player' || open
            ? 'border-[#7A1426]/40 bg-[#7A1426]/5 text-[#7A1426]'
            : 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
        )}
      >
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt=""
            aria-hidden="true"
            className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-full bg-[#7A1426] text-white text-[10px] font-black flex items-center justify-center shrink-0"
          >
            {initials}
          </span>
        )}
        <span className="max-w-[96px] sm:max-w-[130px] truncate">{firstName}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <div
        ref={popoverRef}
        id={menuId}
        popover="auto"
        onToggle={handleToggle}
        style={popoverStyle}
        className="player-account-popover w-72 rounded-2xl border border-gray-200 bg-white p-2 text-[#111827] shadow-xl"
      >
        <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] px-3 py-2.5 mb-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-extrabold text-[#111827] truncate">{player.name}</p>
                {player.isVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified player" />
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                {playerSession.currentMembership?.team?.name
                  ? `${playerSession.currentMembership.team.name} • ${formatCricketLabel(player.role)}`
                  : formatCricketLabel(player.role)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => closeAndGo('/player/dashboard')}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-[#7A1426] shrink-0" aria-hidden="true" />
            My Career Hub
          </button>
          <button
            type="button"
            onClick={() => closeAndGo('/player/dashboard?tab=profile')}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#111827] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => closeAndGo(`/players/${publicSlug}`)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#111827] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            Public Player Card
          </button>
        </div>

        <div className="my-1.5 border-t border-gray-100" />

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

