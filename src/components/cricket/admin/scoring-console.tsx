'use client'

/**
 * Admin scoring console — full ball-by-ball control for one match.
 * Covers: toss, innings starts, runs, extras (wide / no-ball / bye / leg-bye),
 * all wicket types, undo, new batsman / new bowler prompts, swap strike,
 * pause / resume, end innings and abandon.
 * Every mutation returns the fresh match payload which is applied instantly;
 * concurrent audience screens receive the same state via Socket.IO.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Coins,
  PauseCircle,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
  Undo2,
  Vibrate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BallDotsRow, StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { StartInningsDialog, TossDialog } from '@/components/cricket/admin/matches-admin'
import {
  CricketGroundBackdrop,
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'
import { api, useMatchChannel, type MatchSummary } from '@/lib/client'
import type { MatchStatePayload } from '@/lib/match-state'
import type { BallEventInput, ExtraType, WicketType } from '@/lib/cricket'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const WICKET_LABELS: Array<[WicketType, string]> = [
  ['BOWLED', 'Bowled'],
  ['CAUGHT', 'Caught'],
  ['CAUGHT_AND_BOWLED', 'Caught & bowled'],
  ['LBW', 'LBW'],
  ['RUN_OUT', 'Run out'],
  ['STUMPED', 'Stumped'],
  ['HIT_WICKET', 'Hit wicket'],
]

interface SquadPlayer {
  id: string
  name: string
  role: string
  jerseyNumber: number | null
}

export function ScoringConsole({
  matchId,
  matches,
  navigate,
}: {
  matchId: string
  matches: MatchSummary[]
  navigate: (to: string) => void
}) {
  const { toast } = useToast()
  const { state: payload, setLiveState, connected } = useMatchChannel(matchId, null)
  const [busy, setBusy] = useState(false)

  const [tossOpen, setTossOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [wicketOpen, setWicketOpen] = useState(false)
  const [extraDialog, setExtraDialog] = useState<ExtraType | null>(null)
  const [undoOpen, setUndoOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'END_INNINGS' | 'ABANDON' | null>(null)

  const m = payload?.match
  const summary = matches.find((x) => x.id === matchId)
  const current = useMemo(
    () => (Array.isArray(payload?.innings) ? payload.innings.find((i) => i.number === m?.currentInnings) : null) ?? null,
    [payload, m]
  )
  const live = payload?.live ?? null
  const ballsBowled = current?.totalDeliveries ?? 0
  const scoringBlocked =
    !live || busy || !!live.needsNewBatsman || live.overComplete || m?.status !== 'LIVE'

  const call = async (
    path: string,
    init: RequestInit & { json?: unknown },
    okMsg?: string
  ): Promise<boolean> => {
    setBusy(true)
    try {
      const p = await api<any>(path, init)
      if (p && p.match && Array.isArray(p.innings)) {
        setLiveState(p as MatchStatePayload)
      } else {
        const fresh = await api<MatchStatePayload>(`/api/matches/${matchId}`).catch(() => null)
        if (fresh) setLiveState(fresh)
      }
      if (okMsg) toast({ title: okMsg })
      return true
    } catch (e) {
      toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const record = (input: BallEventInput) =>
    call(`/api/matches/${matchId}/ball`, { method: 'POST', json: input })

  const action = (act: string, playerId?: string, okMsg?: string) =>
    call(`/api/matches/${matchId}/action`, { method: 'POST', json: { action: act, playerId } }, okMsg)

  // ---------------------------------------------------------------- loading
  if (!payload || !m) {
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
  }

  const striker = current?.batting.find((b) => b.id === live?.strikerId)
  const nonStriker = current?.batting.find((b) => b.id === live?.nonStrikerId)
  const bowlerCard = current?.bowling.find((b) => b.id === live?.bowlerId)
  const bowlerOption = live?.bowlers.find((b) => b.id === live?.bowlerId)
  const bowlerName = bowlerCard?.name ?? bowlerOption?.name ?? null
  const bowlerFigures = bowlerCard
    ? `${bowlerCard.overs}-${bowlerCard.maidens}-${bowlerCard.runsConceded}-${bowlerCard.wickets}`
    : bowlerOption
    ? `${bowlerOption.overs}-0-${bowlerOption.runs}-${bowlerOption.wickets}`
    : null
  const isActivePlay = m.status === 'LIVE' || m.status === 'PAUSED'

  const renderTeamSide = (team: typeof m.teamA, align: 'left' | 'right') => {
    const isBatting = isActivePlay && current?.battingTeamId === team.id
    const sideScores = m.scores.filter(
      (s) => s.battingTeamId === team.id && !(isActivePlay && s.number === current?.number)
    )
    return (
      <div className={cn('flex items-center gap-2.5 min-w-0', align === 'right' && 'flex-row-reverse text-right')}>
        <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="lg" />
        <div className="min-w-0">
          <div className={cn('flex items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
            <span className="text-sm sm:text-base font-bold text-white truncate">{team.shortName}</span>
            {isBatting && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/40 text-emerald-300">
                Bat
              </span>
            )}
          </div>
          <div className="hidden sm:block text-[11px] text-white/60 truncate">{team.name}</div>
          {sideScores.map((s) => (
            <div key={s.number} className="text-xs font-bold tabular-nums text-emerald-200/90 mt-0.5">
              {s.runs}/{s.wickets} <span className="text-[10px] font-normal text-white/60">({s.overs} ov)</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ---------------- scoreboard header (Cricket Ground Backdrop) ---------------- */}
      <CricketGroundBackdrop className="border border-[#c59b27]/40 shadow-xl" showPitch={false}>
        <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-black/55 via-black/35 to-black/60 backdrop-blur-[2px]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/75">
            <span className="flex items-center gap-2 font-medium tracking-wide uppercase">
              <button
                className="rounded focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none cursor-pointer"
                onClick={() => navigate(`/match/${m.id}`)}
                aria-label="Open public match view"
              >
                {m.format === 'CUSTOM' ? `${m.totalOvers} ov` : m.format}
                {m.venue ? ` • ${m.venue}` : ''}
              </button>
            </span>
            <span className="flex items-center gap-2">
              {connected ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/35 text-emerald-300 font-bold text-[11px]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/35 text-amber-300 font-bold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> reconnecting
                </span>
              )}
              <StatusBadge status={m.status} />
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {renderTeamSide(m.teamA, 'left')}

            {/* Middle Centerpiece: Runs, Over & Run Rate (when active) or VS */}
            {current && isActivePlay ? (
              <div className="flex flex-col items-center justify-center text-center bg-black/50 px-5 py-2 rounded-2xl border border-[#c59b27]/40 backdrop-blur-xs shadow-md shrink-0">
                <div className="text-2xl sm:text-3xl font-serif font-black text-white tabular-nums tracking-tight leading-none">
                  {current.runs}/{current.wickets}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono font-bold tabular-nums">
                  <span className="text-emerald-300">
                    {current.oversDisplay} ov
                  </span>
                  <span className="text-white/25">•</span>
                  <span className="text-[#c59b27]">
                    RR <span className="text-white font-black">{current.runRate.toFixed(2)}</span>
                  </span>
                  {live?.requiredRunRate !== null && live?.requiredRunRate !== undefined && (
                    <>
                      <span className="text-white/25">•</span>
                      <span className="text-amber-300">
                        RRR <span className="text-white font-black">{live.requiredRunRate}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center bg-black/45 px-4 py-1.5 rounded-xl border border-[#c59b27]/30 backdrop-blur-xs shadow-sm shrink-0">
                <span className="text-[11px] font-serif font-black text-white/60 tracking-widest uppercase">
                  VS
                </span>
              </div>
            )}

            {renderTeamSide(m.teamB, 'right')}
          </div>

          {(m.status !== 'LIVE' || m.target) && (
            <div className="text-xs text-white/85">
              {m.status === 'LIVE' && current && live && m.target && (
                <div className="bg-black/35 rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-center font-mono text-[#c59b27] font-bold">
                  Target: {m.target} • Need {Math.max(m.target - current.runs, 0)} runs off {live.ballsRemaining ?? 0} balls
                </div>
              )}
              {m.status === 'SCHEDULED' && <span className="text-white/60">Match scheduled — awaiting toss and innings start</span>}
              {m.status === 'TOSS_DONE' && <span className="text-amber-200 font-bold">Toss complete — start match when teams take the field</span>}
              {m.status === 'INNINGS_BREAK' && <span className="text-[#c59b27] font-bold">Innings Break — Chasing target: {m.target}</span>}
              {m.status === 'COMPLETED' && <span className="text-[#f8f6f0] font-bold">{m.resultText}</span>}
              {m.status === 'PAUSED' && <span className="text-orange-200 font-bold">Match paused — resume to continue scoring.</span>}
              {m.status === 'ABANDONED' && <span className="text-zinc-300 font-bold">Match abandoned.</span>}
            </div>
          )}
        </div>
      </CricketGroundBackdrop>

      {/* ---------------- pre-match setup ---------------- */}
      {m.status === 'SCHEDULED' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <Coins className="h-6 w-6 text-[#c59b27]" aria-hidden />
            <p className="text-sm text-muted-foreground">The match is scheduled. Record the toss to unlock scoring.</p>
            <Button className="bg-[#0d3a24] hover:bg-[#154d32] text-white font-bold rounded-xl shadow-xs" onClick={() => setTossOpen(true)}>
              <Coins className="h-4 w-4 text-[#c59b27]" aria-hidden /> Record toss
            </Button>
          </CardContent>
        </Card>
      )}
      {m.status === 'TOSS_DONE' && (
        <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <Play className="h-6 w-6 text-[#0d3a24]" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Toss done — pick the two openers and the opening bowler to start.
            </p>
            <Button className="bg-[#0d3a24] hover:bg-[#154d32] text-white font-bold rounded-xl shadow-xs" onClick={() => setStartOpen(true)}>
              <Play className="h-4 w-4 text-[#c59b27]" aria-hidden /> Start match
            </Button>
          </CardContent>
        </Card>
      )}
      {m.status === 'INNINGS_BREAK' && (
        <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <Play className="h-6 w-6 text-[#c59b27]" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Innings 1 closed. Chasing target: <b>{m.target}</b>. Start the second innings.
            </p>
            <Button className="bg-[#0d3a24] hover:bg-[#154d32] text-white font-bold rounded-xl shadow-xs" onClick={() => setStartOpen(true)}>
              <Play className="h-4 w-4 text-[#c59b27]" aria-hidden /> Start innings 2
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---------------- live scoring pad ---------------- */}
      {(m.status === 'LIVE' || m.status === 'PAUSED') && live && current && (
        <>
          {/* pending prompts */}
          {(live.needsNewBatsman || live.overComplete) && m.status === 'LIVE' && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {live.needsNewBatsman
                    ? `Wicket! Select the new ${live.needsNewBatsman === 'STRIKER' ? 'striker' : 'non-striker'}`
                    : 'Over complete — select the bowler for the next over'}
                </p>
                {live.needsNewBatsman ? (
                  <BatsmanPrompt
                    yetToBat={live.yetToBat}
                    disabled={busy}
                    onPick={(pid) => void action('NEW_BATSMAN', pid, 'New batsman in')}
                  />
                ) : (
                  <BowlerPrompt
                    bowlers={live.bowlers}
                    disabled={busy}
                    onPick={(pid) => void action('NEW_BOWLER', pid, 'Bowler set')}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {m.status === 'PAUSED' && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                  <PauseCircle className="h-4 w-4" aria-hidden /> Scoring is paused.
                </p>
                <Button
                  size="sm"
                  className="bg-emerald-800 hover:bg-emerald-900"
                  disabled={busy}
                  onClick={() => void action('RESUME', undefined, 'Match resumed')}
                >
                  <Play className="h-4 w-4" aria-hidden /> Resume
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ---------------- UPPER SECTION: Batters at the Crease & Active Bowler ---------------- */}
          <Card className="rounded-2xl border-[#e8e2d5] bg-white shadow-xs">
            <CardContent className="p-4 grid gap-4 md:grid-cols-12 items-center">
              {/* Batters (Left) */}
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#6b7280] uppercase">
                  <span className="flex items-center gap-1.5 text-[#0d3a24]">
                    <CricketBatIcon size={13} />
                    <span>Batters at the Crease</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#9ca3af]">R (B)</span>
                </div>

                <div className="grid gap-1.5 sm:grid-cols-2">
                  {[striker, nonStriker].map((b, i) => {
                    const onStrike = i === 0 && !!live.strikerId
                    return (
                      <div
                        key={b?.id ?? i}
                        className={cn(
                          'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                          onStrike ? 'bg-emerald-50/80 border border-emerald-200/80' : 'bg-[#faf8f5] border border-[#e8e2d5]/60'
                        )}
                      >
                        <span className="flex items-center gap-2 font-bold text-[#111827] min-w-0 pr-2">
                          {b ? (
                            <>
                              <span className="truncate">{b.name}</span>
                              {onStrike && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#0d3a24] text-[#c59b27] text-[10px] font-black uppercase tracking-wider shrink-0">
                                  * Strike
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground font-normal italic">Awaiting batter</span>
                          )}
                        </span>
                        <span className={cn('font-mono tabular-nums shrink-0 text-xs sm:text-sm', onStrike ? 'font-black text-[#0d3a24]' : 'font-semibold text-[#6b7280]')}>
                          {b ? `${b.runs} (${b.balls})` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Active Bowler (Right) */}
              <div className="md:col-span-5 md:border-l border-[#e8e2d5] md:pl-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#6b7280] uppercase">
                  <span className="flex items-center gap-1.5 text-[#0d3a24]">
                    <CricketBallIcon size={13} variant="red" />
                    <span>Active Bowler</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#9ca3af]">O-M-R-W</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#faf8f5] border border-[#e8e2d5]/60 px-3 py-2 text-sm">
                  <span className="font-bold text-[#111827] truncate pr-2">
                    {bowlerName ?? '—'}
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#0d3a24] bg-white px-2.5 py-1 rounded-lg border border-[#e8e2d5] shadow-2xs shrink-0">
                    {bowlerFigures ?? '0.0-0-0-0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---------------- MIDDLE SECTION: Scoring Keypad (Runs, Extras & Controls) ---------------- */}
          <Card className="rounded-2xl border-[#e8e2d5] bg-white shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#6b7280] uppercase">
                <span>Record Delivery • Runs & Extras</span>
                {scoringBlocked && m.status === 'LIVE' && (
                  <span className="text-amber-700 font-bold">Select batter/bowler above to resume</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    disabled={scoringBlocked}
                    onClick={() => void record({ runsOffBat: r, extraType: null, extraRuns: 0 })}
                    className={cn(
                      'flex h-16 flex-col items-center justify-center rounded-2xl border-2 transition-all cursor-pointer shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0d3a24] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                      r === 4
                        ? 'border-emerald-500 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white font-black text-2xl shadow-emerald-900/20'
                        : r === 6
                        ? 'border-amber-400 bg-gradient-to-br from-amber-500 via-[#c59b27] to-amber-800 text-white font-black text-2xl shadow-amber-900/20 ring-1 ring-amber-400/40'
                        : 'border-[#e8e2d5] bg-white hover:bg-[#f4efe6] text-[#0d3a24] font-black text-2xl'
                    )}
                    aria-label={`Record ${r === 0 ? 'dot ball' : `${r} run${r > 1 ? 's' : ''}`}`}
                  >
                    <span>{r === 0 ? '•' : r}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">
                      {r === 0 ? 'Dot' : r === 4 ? 'Four' : r === 6 ? 'Six' : 'Run'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                <button
                  type="button"
                  disabled={scoringBlocked}
                  onClick={() => void record({ runsOffBat: 0, extraType: 'WIDE', extraRuns: 1 })}
                  className="bg-[#f4efe6] hover:bg-[#e8e2d5] text-[#0d3a24] border border-[#e8e2d5] font-bold rounded-xl py-2.5 text-xs shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Wide (+1)
                </button>
                <button
                  type="button"
                  disabled={scoringBlocked}
                  onClick={() => setExtraDialog('NO_BALL')}
                  className="bg-[#f4efe6] hover:bg-[#e8e2d5] text-[#0d3a24] border border-[#e8e2d5] font-bold rounded-xl py-2.5 text-xs shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  No Ball
                </button>
                <button
                  type="button"
                  disabled={scoringBlocked}
                  onClick={() => setExtraDialog('BYE')}
                  className="bg-[#f4efe6] hover:bg-[#e8e2d5] text-[#0d3a24] border border-[#e8e2d5] font-bold rounded-xl py-2.5 text-xs shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Bye
                </button>
                <button
                  type="button"
                  disabled={scoringBlocked}
                  onClick={() => setExtraDialog('LEG_BYE')}
                  className="bg-[#f4efe6] hover:bg-[#e8e2d5] text-[#0d3a24] border border-[#e8e2d5] font-bold rounded-xl py-2.5 text-xs shadow-2xs active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Leg Bye
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  className="bg-gradient-to-br from-red-600 via-rose-700 to-rose-900 hover:from-red-700 hover:to-rose-950 text-white font-black rounded-xl py-3 text-xs shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-red-500/80"
                  disabled={scoringBlocked}
                  onClick={() => setWicketOpen(true)}
                >
                  <CricketStumpsIcon size={18} broken={true} />
                  <span>Wicket Fallen</span>
                </button>
                <button
                  type="button"
                  className="bg-amber-50 hover:bg-amber-100 text-[#916922] border border-[#c59b27] font-bold rounded-xl py-3 text-xs shadow-xs active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  disabled={scoringBlocked}
                  onClick={() => setExtraDialog('WIDE')}
                  aria-label="Wide with additional runs"
                >
                  <CricketBallIcon size={14} variant="gold" />
                  <span>Wide + Extra Runs</span>
                </button>
              </div>

              {/* control row */}
              <div className="flex flex-wrap gap-2 border-t border-[#e8e2d5] pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#e8e2d5] hover:bg-[#f4efe6] text-[#0d3a24] font-bold text-xs"
                  disabled={busy || ballsBowled === 0}
                  onClick={() => setUndoOpen(true)}
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo Last Delivery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#e8e2d5] hover:bg-[#f4efe6] text-[#0d3a24] font-bold text-xs flex items-center gap-1.5"
                  disabled={busy || m.status !== 'LIVE' || !live.strikerId || !live.nonStrikerId}
                  onClick={() => void action('SWAP_STRIKE', undefined, 'Strike swapped')}
                >
                  <CricketBatIcon size={14} />
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Swap Strike
                </Button>
                {m.status === 'LIVE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-[#e8e2d5] hover:bg-[#f4efe6] text-[#0d3a24] font-bold text-xs"
                    disabled={busy}
                    onClick={() => void action('PAUSE', undefined, 'Match paused')}
                  >
                    <PauseCircle className="h-3.5 w-3.5" aria-hidden /> Pause Match
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#e8e2d5] hover:bg-[#f4efe6] text-[#0d3a24] font-bold text-xs"
                  disabled={busy}
                  onClick={() => setConfirmAction('END_INNINGS')}
                >
                  <Save className="h-3.5 w-3.5" aria-hidden /> End Innings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto rounded-xl border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs"
                  disabled={busy}
                  onClick={() => setConfirmAction('ABANDON')}
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Abandon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ---------------- LOWER SECTION: This Over Ball Tracker & Extras ---------------- */}
          <Card className="rounded-2xl border-[#e8e2d5] bg-white shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#6b7280] uppercase">
                <span>This over</span>
                <span className="tabular-nums font-mono text-[#0d3a24]">
                  Over {Math.floor(current.legalBalls / 6) + (live.overComplete ? 0 : 1)}
                </span>
              </div>
              <BallDotsRow balls={live.thisOver} />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#e8e2d5]/80 text-xs">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#0d3a24]">
                  Extras:{' '}
                  <span className="font-mono font-black text-sm text-[#111827] ml-1">
                    {current.extras.total}
                  </span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[#6b7280] bg-[#faf8f5] px-2.5 py-1 rounded-lg border border-[#e8e2d5]/70">
                  wd {current.extras.wides} • nb {current.extras.noBalls} • b {current.extras.byes} • lb {current.extras.legByes}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ---------------- completed / abandoned ---------------- */}
      {(m.status === 'COMPLETED' || m.status === 'ABANDONED') && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <Badge variant="secondary" className="text-xs">{m.status === 'COMPLETED' ? 'Result' : 'Abandoned'}</Badge>
            <p className="text-base font-bold">{m.resultText ?? '—'}</p>
            {ballsBowled > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setUndoOpen(true)}
                title="Removes the last delivery and re-opens the match for corrections"
              >
                <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo last ball & re-open
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------- dialogs ---------------- */}
      {tossOpen && summary && (
        <TossDialog
          match={summary}
          onClose={() => setTossOpen(false)}
          onSubmit={async (data) => {
            const done = await call(`/api/matches/${matchId}/toss`, { method: 'POST', json: data }, 'Toss recorded')
            if (done) setTossOpen(false)
          }}
        />
      )}
      {startOpen && summary && (
        <StartInningsDialog
          match={summary}
          onClose={() => setStartOpen(false)}
          onSubmit={async (data) => {
            const done = await call(
              `/api/matches/${matchId}/start`,
              { method: 'POST', json: data },
              m.status === 'INNINGS_BREAK' ? 'Innings 2 started' : 'Match started'
            )
            if (done) setStartOpen(false)
          }}
        />
      )}
      {wicketOpen && live && (
        <WicketDialog
          bowlingTeamId={live.bowlingTeamId}
          strikerId={live.strikerId}
          nonStrikerId={live.nonStrikerId}
          strikerName={striker?.name ?? 'striker'}
          nonStrikerName={nonStriker?.name ?? 'non-striker'}
          busy={busy}
          onClose={() => setWicketOpen(false)}
          onSubmit={async (input) => {
            const done = await record(input)
            if (done) {
              setWicketOpen(false)
              toast({ title: 'Wicket recorded' })
            }
          }}
        />
      )}
      {extraDialog && (
        <ExtrasDialog
          kind={extraDialog}
          busy={busy}
          onClose={() => setExtraDialog(null)}
          onSubmit={async (input) => {
            const done = await record(input)
            if (done) setExtraDialog(null)
          }}
        />
      )}

      <AlertDialog open={undoOpen} onOpenChange={(o) => !o && setUndoOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo the last delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              The most recent ball is removed and the match state is restored to just before it. If the match had
              ended on that ball, it is re-opened. The audience scoreboard updates automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              onClick={async () => {
                const done = await call(`/api/matches/${matchId}/undo`, { method: 'POST' }, 'Last ball undone')
                setUndoOpen(false)
                void done
              }}
            >
              Undo ball
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'END_INNINGS' ? 'End the innings now?' : 'Abandon this match?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'END_INNINGS'
                ? m.currentInnings === 1
                  ? 'Innings 1 will be closed (declaration) and the innings break begins with the target set.'
                  : 'Innings 2 will be closed and the match result finalized from the current scores.'
                : 'Scoring stops permanently and the match is marked as abandoned.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === 'ABANDON' ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-800 hover:bg-emerald-900'}
              onClick={async () => {
                const kind = confirmAction
                setConfirmAction(null)
                if (kind) await action(kind, undefined, kind === 'ABANDON' ? 'Match abandoned' : 'Innings ended')
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pending prompt: new batsman
// ---------------------------------------------------------------------------

function BatsmanPrompt({
  yetToBat,
  disabled,
  onPick,
}: {
  yetToBat: { id: string; name: string; jerseyNumber: number | null }[]
  disabled: boolean
  onPick: (playerId: string) => void
}) {
  const [pid, setPid] = useState('')
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value={pid || undefined} onValueChange={setPid}>
        <SelectTrigger className="flex-1" aria-label="New batsman">
          <SelectValue placeholder={yetToBat.length ? 'Select new batsman' : 'No batters left'} />
        </SelectTrigger>
        <SelectContent>
          {yetToBat.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.jerseyNumber ? `${p.jerseyNumber}. ` : ''}
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="bg-emerald-800 hover:bg-emerald-900" disabled={disabled || !pid} onClick={() => onPick(pid)}>
        Send in
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pending prompt: new bowler
// ---------------------------------------------------------------------------

function BowlerPrompt({
  bowlers,
  disabled,
  onPick,
}: {
  bowlers: { id: string; name: string; overs: string; runs: number; wickets: number; blocked: boolean; blockedReason: string | null }[]
  disabled: boolean
  onPick: (playerId: string) => void
}) {
  const [pid, setPid] = useState('')
  const chosen = bowlers.find((b) => b.id === pid && !b.blocked)
  return (
    <div className="space-y-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {bowlers.map((b) => (
          <button
            key={b.id}
            disabled={disabled || b.blocked}
            onClick={() => onPick(b.id)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45',
              pid === b.id ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200 bg-white hover:border-emerald-400'
            )}
          >
            <span className="font-medium">{b.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {b.overs} ov • {b.runs} r • {b.wickets} w
              {b.blocked ? ` • ${b.blockedReason ?? 'unavailable'}` : ''}
            </span>
          </button>
        ))}
      </div>
      {chosen && (
        <Button className="bg-emerald-800 hover:bg-emerald-900" disabled={disabled} onClick={() => onPick(chosen.id)}>
          Give the ball to {chosen.name}
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wicket dialog
// ---------------------------------------------------------------------------

function WicketDialog({
  bowlingTeamId,
  strikerId,
  nonStrikerId,
  strikerName,
  nonStrikerName,
  busy,
  onClose,
  onSubmit,
}: {
  bowlingTeamId: string
  strikerId: string | null
  nonStrikerId: string | null
  strikerName: string
  nonStrikerName: string
  busy: boolean
  onClose: () => void
  onSubmit: (input: BallEventInput) => void
}) {
  const [wicketType, setWicketType] = useState<WicketType>('BOWLED')
  const [dismissed, setDismissed] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER')
  const [assistId, setAssistId] = useState('')
  const [fielders, setFielders] = useState<SquadPlayer[]>([])

  const needsAssist = ['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(wicketType)

  useEffect(() => {
    let alive = true
    api<{ players: SquadPlayer[] }>(`/api/teams/${bowlingTeamId}`)
      .then((t) => alive && setFielders(t.players))
      .catch(() => alive && setFielders([]))
    return () => {
      alive = false
    }
  }, [bowlingTeamId])

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record wicket</DialogTitle>
          <DialogDescription>How was the batter out?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dismissal type</Label>
            <Select value={wicketType} onValueChange={(v) => { setWicketType(v as WicketType); setAssistId('') }}>
              <SelectTrigger aria-label="Wicket type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WICKET_LABELS.map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {wicketType === 'RUN_OUT' && (
            <div className="space-y-2">
              <Label>Which batter is out?</Label>
              <Select value={dismissed} onValueChange={(v) => setDismissed(v as 'STRIKER' | 'NON_STRIKER')}>
                <SelectTrigger aria-label="Dismissed batter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRIKER">{strikerName} (striker)</SelectItem>
                  <SelectItem value="NON_STRIKER">{nonStrikerName} (non-striker)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {needsAssist && (
            <div className="space-y-2">
              <Label>
                {wicketType === 'STUMPED'
                  ? 'Wicket-keeper'
                  : wicketType === 'RUN_OUT'
                  ? 'Fielder who effected Run Out'
                  : 'Fielder who took the Catch'}
              </Label>
              <Select value={assistId || undefined} onValueChange={setAssistId}>
                <SelectTrigger aria-label="Fielder"><SelectValue placeholder="Select fielder (recommended)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not recorded</SelectItem>
                  {fielders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.jerseyNumber ? `${f.jerseyNumber}. ` : ''}
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Credited automatically toward Best Fielder awards.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="bg-red-700 hover:bg-red-800"
            disabled={busy}
            onClick={() =>
              onSubmit({
                runsOffBat: 0,
                extraType: null,
                extraRuns: 0,
                wicketType,
                dismissedId:
                  wicketType === 'RUN_OUT' && dismissed === 'NON_STRIKER'
                    ? nonStrikerId
                    : strikerId,
                assistId: assistId && assistId !== 'none' ? assistId : null,
              })
            }
          >
            Confirm wicket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Extras dialog (wide+runs, no-ball with bat runs, byes, leg-byes)
// ---------------------------------------------------------------------------

function ExtrasDialog({
  kind,
  busy,
  onClose,
  onSubmit,
}: {
  kind: ExtraType
  busy: boolean
  onClose: () => void
  onSubmit: (input: BallEventInput) => void
}) {
  const [n, setN] = useState('1')
  const config: Record<ExtraType, { title: string; desc: string; min: number; max: number; note: string }> = {
    WIDE: {
      title: 'Wide',
      desc: 'Total wide runs including the 1 penalty run.',
      min: 1,
      max: 7,
      note: 'Wide — ball is re-bowled; not counted as a ball faced.',
    },
    NO_BALL: {
      title: 'No ball',
      desc: 'Runs off the bat after the no-ball (the 1 penalty run is added automatically).',
      min: 0,
      max: 6,
      note: 'No-ball — counts as a ball faced but the over is re-bowled.',
    },
    BYE: {
      title: 'Byes',
      desc: 'Bye runs (1–4).',
      min: 1,
      max: 4,
      note: 'Byes — legal ball, runs do not go to the batter.',
    },
    LEG_BYE: {
      title: 'Leg byes',
      desc: 'Leg-bye runs (1–4).',
      min: 1,
      max: 4,
      note: 'Leg-byes — legal ball, runs do not go to the batter.',
    },
  }
  const c = config[kind]
  const value = Math.min(Math.max(Number(n) || c.min, c.min), c.max)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: c.max - c.min + 1 }, (_, i) => c.min + i).map((v) => (
              <button
                key={v}
                onClick={() => setN(String(v))}
                className={cn(
                  'h-11 rounded-lg border-2 text-base font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none',
                  value === v ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-zinc-200 hover:border-emerald-400'
                )}
                aria-pressed={value === v}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{c.note}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-800 hover:bg-emerald-900"
            disabled={busy}
            onClick={() =>
              onSubmit(
                kind === 'NO_BALL'
                  ? { runsOffBat: value, extraType: 'NO_BALL', extraRuns: 1 }
                  : { runsOffBat: 0, extraType: kind, extraRuns: value }
              )
            }
          >
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
