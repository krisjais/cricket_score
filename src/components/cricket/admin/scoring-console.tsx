'use client'

/**
 * Umpire / Scorer Panel — Panel 4 UI matching the 4-panel NPL reference.
 * Full ball-by-ball control wired to MongoDB + Socket.IO real-time updates.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Ban,
  Coins,
  Flag,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Undo2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { BallDot, BallDotsRow, LiveBadge, StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { StartInningsDialog, TossDialog } from '@/components/cricket/admin/matches-admin'
import { api, fmtDate, useMatchChannel, type MatchSummary } from '@/lib/client'
import type { MatchStatePayload } from '@/lib/match-state'
import type { BallEventInput, ExtraType, WicketType } from '@/lib/cricket'
import type { ScorerSubView } from '@/components/cricket/admin/admin-sidebar'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const WICKET_LABELS: Array<[WicketType, string]> = [
  ['BOWLED', 'Bowled'],
  ['CAUGHT', 'Caught'],
  ['RUN_OUT', 'Run Out'],
  ['STUMPED', 'Stump Out'],
  ['CAUGHT_AND_BOWLED', 'Caught & Bowled'],
  ['HIT_WICKET', 'Hit Wicket'],
]

const WIDE_ALLOWED_WICKETS = new Set<WicketType>(['STUMPED', 'RUN_OUT', 'HIT_WICKET'])

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
  scorerSubView = 'score',
  onSelectSubView,
  onSelectMatch,
}: {
  matchId: string
  matches: MatchSummary[]
  navigate: (to: string) => void
  scorerSubView?: ScorerSubView
  onSelectSubView?: (view: ScorerSubView) => void
  onSelectMatch?: (id: string) => void
}) {
  const { toast } = useToast()
  const { state: payload, setLiveState, connected } = useMatchChannel(matchId, null)
  const [busy, setBusy] = useState(false)

  const [tossOpen, setTossOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [wicketDialog, setWicketDialog] = useState<'NORMAL' | 'WIDE' | null>(null)
  const [bowlerDialogOpen, setBowlerDialogOpen] = useState(false)
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

  if (!payload || !m) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#070B14]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A1426] border-t-transparent" />
      </div>
    )
  }

  const battingTeam = current ? (current.battingTeamId === m.teamA.id ? m.teamA : m.teamB) : m.teamA
  const striker = current?.batting.find((b) => b.id === live?.strikerId)
  const nonStriker = current?.batting.find((b) => b.id === live?.nonStrikerId)
  const bowlerCard = current?.bowling.find((b) => b.id === live?.bowlerId)
  const bowlerOption = live?.bowlers.find((b) => b.id === live?.bowlerId)
  const bowlerName = bowlerCard?.name ?? bowlerOption?.name ?? '—'
  const bowlerOvers = bowlerCard?.overs ?? bowlerOption?.overs ?? '0.0'
  const bowlerRuns = bowlerCard?.runsConceded ?? bowlerOption?.runs ?? 0
  const bowlerWickets = bowlerCard?.wickets ?? bowlerOption?.wickets ?? 0
  const tossTeam = m.tossWinnerId ? (m.tossWinnerId === m.teamA.id ? m.teamA : m.teamB) : null

  return (
    <div className="h-full w-full bg-[#070B14] text-white flex flex-col overflow-hidden">
      {/* ===================== SCORER SUB-VIEWS (Details / Log / Switch) ===================== */}
      {scorerSubView === 'details' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full">
          <div className="rounded-2xl border border-[#172136] bg-[#0D1526] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#172136] pb-3">
              <h2 className="text-base font-bold text-white">Match Information</h2>
              {onSelectSubView && (
                <button
                  type="button"
                  onClick={() => onSelectSubView('score')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Back to Scoring
                </button>
              )}
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <dt className="font-bold text-slate-400 uppercase">Teams</dt>
                <dd className="font-bold text-sm text-white mt-0.5">{m.teamA.name} vs {m.teamB.name}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-400 uppercase">Venue / Turf</dt>
                <dd className="font-semibold text-white mt-0.5">{m.venue || 'Main Ground'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-400 uppercase">Format</dt>
                <dd className="font-semibold text-white mt-0.5">{m.format} ({m.totalOvers} overs)</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-400 uppercase">Toss Decision</dt>
                <dd className="font-semibold text-white mt-0.5">
                  {tossTeam ? `${tossTeam.name} elected to ${m.tossDecision?.toLowerCase()}` : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-400 uppercase">Started</dt>
                <dd className="font-semibold text-white mt-0.5">{fmtDate(m.startedAt)}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-400 uppercase">Status</dt>
                <dd className="font-bold text-[#F43F5E] mt-0.5">{m.status.replace('_', ' ')}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {scorerSubView === 'log' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full">
          <div className="rounded-2xl border border-[#172136] bg-[#0D1526] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0B1120] border-b border-[#172136] flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-[#F43F5E]" />
                <span>Match Ball-by-Ball Log</span>
              </span>
              {onSelectSubView && (
                <button
                  type="button"
                  onClick={() => onSelectSubView('score')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Back to Scoring
                </button>
              )}
            </div>
            <div className="divide-y divide-[#172136] max-h-[500px] overflow-y-auto">
              {payload.innings.every((i) => i.commentary.length === 0) ? (
                <div className="p-10 text-center text-xs text-slate-400">No deliveries logged yet.</div>
              ) : (
                [...payload.innings].reverse().map((inn) =>
                  inn.commentary.map((c) => (
                    <div key={`${inn.number}-${c.sequence}`} className="px-4 py-2.5 flex items-center gap-2.5 text-xs hover:bg-slate-800/40">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">Inn {inn.number}</span>
                      <span className="font-mono font-bold text-slate-400 w-9">{c.overDisplay}</span>
                      <DarkBallDot ball={{ label: c.kind === 'W' ? 'W' : c.kind === '4' ? '4' : c.kind === '6' ? '6' : String(c.runs), kind: c.kind, runs: c.runs }} />
                      <span className="text-slate-200 flex-1">{c.text}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {scorerSubView === 'switch' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full">
          <div className="rounded-2xl border border-[#172136] bg-[#0D1526] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#172136] pb-3">
              <h2 className="text-base font-bold text-white">Switch Active Match</h2>
              {onSelectSubView && (
                <button
                  type="button"
                  onClick={() => onSelectSubView('score')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectMatch?.(item.id)
                    onSelectSubView?.('score')
                  }}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all cursor-pointer flex items-center justify-between gap-3',
                    item.id === matchId
                      ? 'border-[#F43F5E] bg-[#F43F5E]/10'
                      : 'border-[#172136] hover:border-slate-700 bg-[#070B14]'
                  )}
                >
                  <div>
                    <div className="font-bold text-sm text-white">
                      {item.teamA.shortName} vs {item.teamB.shortName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.venue || 'Turf 01'} &bull; {item.format}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MAIN SCORING VIEW ===================== */}
      {scorerSubView === 'score' && (
        <>
          {/* Pre-match Setup States */}
          {m.status === 'SCHEDULED' && (
            <div className="m-auto max-w-md w-full p-6 bg-[#0D1526] border border-[#172136] rounded-2xl text-center space-y-3">
              <Coins className="h-8 w-8 text-[#F43F5E] mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Match is scheduled. Record the toss to unlock live scoring.
              </p>
              <Button
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                onClick={() => setTossOpen(true)}
              >
                <Coins className="h-4 w-4 mr-1.5" /> Record Toss
              </Button>
            </div>
          )}

          {m.status === 'TOSS_DONE' && (
            <div className="m-auto max-w-md w-full p-6 bg-[#0D1526] border border-[#172136] rounded-2xl text-center space-y-3">
              <Play className="h-8 w-8 text-[#F43F5E] mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Toss done &mdash; pick the two openers and the opening bowler to start play.
              </p>
              <Button
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                onClick={() => setStartOpen(true)}
              >
                <Play className="h-4 w-4 mr-1.5" /> Start Match
              </Button>
            </div>
          )}

          {m.status === 'INNINGS_BREAK' && (
            <div className="m-auto max-w-md w-full p-6 bg-[#0D1526] border border-[#172136] rounded-2xl text-center space-y-3">
              <Play className="h-8 w-8 text-[#F43F5E] mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Innings 1 closed. Target: <b className="text-[#F43F5E]">{m.target}</b>. Start the second innings.
              </p>
              <Button
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                onClick={() => setStartOpen(true)}
              >
                <Play className="h-4 w-4 mr-1.5" /> Start Innings 2
              </Button>
            </div>
          )}

          {(m.status === 'COMPLETED' || m.status === 'ABANDONED') && (
            <div className="m-auto max-w-md w-full p-6 bg-[#0D1526] border border-[#172136] rounded-2xl text-center space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                {m.status === 'COMPLETED' ? 'Match Completed' : 'Abandoned'}
              </span>
              <p className="text-base font-bold text-white">{m.resultText ?? '—'}</p>
              {ballsBowled > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setUndoOpen(true)}
                  className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Undo last ball &amp; re-open
                </Button>
              )}
            </div>
          )}

          {/* ===================== LIVE / PAUSED SCORING COCKPIT ===================== */}
          {(m.status === 'LIVE' || m.status === 'PAUSED') && live && current && (
            <>
              {/* PHONE / MOBILE VIEW (lg:hidden) — STRICTLY UNCHANGED AS REQUESTED */}
              <div className="lg:hidden h-full w-full max-w-md mx-auto flex flex-col p-2 overflow-hidden select-none gap-2">
                {/* TOP STATUS LINE (Matches Image 3 + Pause & End Innings buttons) */}
                <div className="flex items-center justify-between gap-1 px-0.5 shrink-0">
                  <div className="flex items-center gap-1 min-w-0">
                    {matches.length > 1 ? (
                      <select
                        value={m.id}
                        onChange={(e) => onSelectMatch?.(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-200 border-none outline-none cursor-pointer truncate max-w-[160px] hover:text-white"
                        title="Switch match"
                      >
                        {matches.map((item) => (
                          <option key={item.id} value={item.id} className="bg-[#0D1526] text-white">
                            {item.teamA.shortName} vs {item.teamB.shortName} · {item.totalOvers} Ov · Inn {current?.number ?? 1}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {m.teamA.shortName} vs {m.teamB.shortName} · {m.totalOvers} Ov · Inn {current.number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pause / Resume Button */}
                    {m.status === 'PAUSED' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void action('RESUME', undefined, 'Match resumed')}
                        className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer animate-pulse"
                        title="Resume Scoring"
                      >
                        <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || m.status !== 'LIVE'}
                        onClick={() => void action('PAUSE', undefined, 'Match paused')}
                        className="px-2 py-1 rounded-lg bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                        title="Pause Inning"
                      >
                        <Pause className="w-3 h-3 text-amber-400" />
                        <span>Pause</span>
                      </button>
                    )}

                    {/* End Innings Button */}
                    <button
                      type="button"
                      disabled={busy || (m.status !== 'LIVE' && m.status !== 'PAUSED')}
                      onClick={() => setConfirmAction('END_INNINGS')}
                      className="px-2 py-1 rounded-lg bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      title="End Current Innings"
                    >
                      <Flag className="w-3 h-3 text-[#F43F5E]" />
                      <span>End</span>
                    </button>

                    {/* LIVE Badge */}
                    {m.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#32070F] border border-[#5B0E1D] text-rose-500 font-extrabold text-[10px] tracking-wide">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        LIVE
                      </span>
                    ) : m.status === 'PAUSED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 font-extrabold text-[10px] tracking-wide">
                        PAUSED
                      </span>
                    ) : (
                      <StatusBadge status={m.status} />
                    )}
                  </div>
                </div>

                {/* CARD 1: MAIN SCORE CARD */}
                <div className="bg-[#0D1526] border border-[#172136] rounded-2xl px-4 py-3 sm:py-3.5 shrink-0 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {battingTeam.name}
                    </span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      {current.oversDisplay} / {m.totalOvers} ov
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                      {current.runs}/{current.wickets}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400 tabular-nums">
                        CRR {current.runRate.toFixed(2)}
                      </div>
                      {m.target && (
                        <div className="text-[11px] font-bold text-amber-400 mt-0.5 tabular-nums">
                          Target {m.target}
                          <span className="text-slate-400 ml-1">
                            (Need {Math.max(0, m.target - current.runs)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 2: BATTERS & BOWLER TABLE */}
                <div className="bg-[#0D1526] border border-[#172136] rounded-2xl px-4 py-3 shadow-sm text-xs flex-1 min-h-[160px] flex flex-col justify-between">
                  <div>
                    {/* Batters Header */}
                    <div className="flex items-center justify-between text-slate-400 font-medium mb-1.5 px-0.5">
                      <span>Batter</span>
                      <div className="flex items-center gap-2 sm:gap-3 text-right tabular-nums">
                        <span className="w-6 sm:w-7 text-right">R</span>
                        <span className="w-6 sm:w-7 text-right">B</span>
                        <span className="w-6 sm:w-7 text-right">4s</span>
                        <span className="w-6 sm:w-7 text-right">6s</span>
                      </div>
                    </div>

                    {/* Striker Row (Highlighted in Crimson/Rose) */}
                    <div className="flex items-center justify-between py-1 px-0.5">
                      <span className="font-bold text-[#F43F5E] truncate pr-2">
                        {striker ? `${striker.name} *` : <span className="text-slate-500 italic">Select striker</span>}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 text-right font-bold text-white tabular-nums">
                        <span className="w-6 sm:w-7 text-right">{striker?.runs ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{striker?.balls ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{striker?.fours ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{striker?.sixes ?? 0}</span>
                      </div>
                    </div>

                    {/* Non-Striker Row */}
                    <div className="flex items-center justify-between py-1 px-0.5">
                      <span className="font-medium text-slate-200 truncate pr-2">
                        {nonStriker ? nonStriker.name : <span className="text-slate-500 italic">Select non-striker</span>}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 text-right font-bold text-white tabular-nums">
                        <span className="w-6 sm:w-7 text-right">{nonStriker?.runs ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{nonStriker?.balls ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{nonStriker?.fours ?? 0}</span>
                        <span className="w-6 sm:w-7 text-right">{nonStriker?.sixes ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Divider */}
                    <div className="border-t border-[#172136] my-1.5" />

                    {/* Bowler Header */}
                    <div className="flex items-center justify-between text-slate-400 font-medium mb-1.5 px-0.5">
                      <span>Bowler</span>
                      <div className="flex items-center gap-2 sm:gap-3 text-right tabular-nums">
                        <span className="w-6 sm:w-7 text-right">O</span>
                        <span className="w-6 sm:w-7 text-right">R</span>
                        <span className="w-6 sm:w-7 text-right">W</span>
                      </div>
                    </div>

                    {/* Bowler Row */}
                    <div className="flex items-center justify-between py-1 px-0.5">
                      <span className="font-medium text-slate-200 truncate pr-2">
                        {bowlerName !== '—' ? bowlerName : <span className="text-slate-500 italic">Select bowler</span>}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 text-right font-bold text-white tabular-nums">
                        <span className="w-6 sm:w-7 text-right">{bowlerOvers}</span>
                        <span className="w-6 sm:w-7 text-right">{bowlerRuns}</span>
                        <span className="w-6 sm:w-7 text-right">{bowlerWickets}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: THIS OVER STRIP */}
                <div className="bg-[#0D1526] border border-[#172136] rounded-xl px-3.5 py-2 flex items-center justify-between shrink-0 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
                    <span className="text-xs font-medium text-slate-400 shrink-0">This over</span>
                    {!live.thisOver.length ? (
                      <span className="text-xs text-slate-400 font-normal">No deliveries yet</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {live.thisOver.map((b, i) => (
                          <DarkBallDot key={i} ball={b} />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0 pl-2">
                    Extras: {current.extras.total}
                  </span>
                </div>

                {/* CARD 4: QUICK ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy || m.status !== 'LIVE' || !live.strikerId || !live.nonStrikerId}
                    onClick={() => void action('SWAP_STRIKE', undefined, 'Strike swapped')}
                    className="h-10 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-98 disabled:opacity-40"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change striker</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || m.status !== 'LIVE'}
                    onClick={() => setBowlerDialogOpen(true)}
                    className="h-10 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-98 disabled:opacity-40"
                  >
                    <span>Change bowler</span>
                  </button>
                </div>

                {/* CARD 5: KEYPAD */}
                <div className="flex-[1.5] flex flex-col gap-1.5 min-h-0 pt-0.5">
                  {/* Row 1: 0, 1, 2, 3 */}
                  <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-[42px]">
                    {[0, 1, 2, 3].map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={scoringBlocked}
                        onClick={() => void record({ runsOffBat: r, extraType: null, extraRuns: 0 })}
                        className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-white text-xl sm:text-2xl font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Row 2: 4, 6, Wicket, Undo */}
                  <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-[42px]">
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => void record({ runsOffBat: 4, extraType: null, extraRuns: 0 })}
                      className="h-full rounded-xl bg-[#4A0E18] hover:bg-[#5E0E1D] border border-[#6B1424]/60 text-white text-xl sm:text-2xl font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      4
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => void record({ runsOffBat: 6, extraType: null, extraRuns: 0 })}
                      className="h-full rounded-xl bg-[#4A0E18] hover:bg-[#5E0E1D] border border-[#6B1424]/60 text-white text-xl sm:text-2xl font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      6
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setWicketDialog('NORMAL')}
                      className="h-full rounded-xl bg-[#28060D] hover:bg-[#380912] border border-[#4C0D18]/80 text-[#EF4444] font-extrabold text-sm sm:text-base flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Wicket
                    </button>
                    <button
                      type="button"
                      disabled={busy || ballsBowled === 0}
                      onClick={() => setUndoOpen(true)}
                      className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Undo</span>
                    </button>
                  </div>

                  {/* Row 3: Wide, No ball, Bye, Leg bye */}
                  <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-[40px]">
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('WIDE')}
                      className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-200 leading-tight">Wide</span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-tight">Wd</span>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('NO_BALL')}
                      className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-200 leading-tight">No ball</span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-tight">Nb</span>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('BYE')}
                      className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-200 leading-tight">Bye</span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-tight">B</span>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('LEG_BYE')}
                      className="h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-200 leading-tight">Leg bye</span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-tight">LB</span>
                    </button>
                  </div>

                  {/* Row 4: End over & Next ball */}
                  <div className="grid grid-cols-12 gap-1.5 flex-1 min-h-[42px]">
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE'}
                      onClick={() => setBowlerDialogOpen(true)}
                      className="col-span-5 h-full rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                    >
                      End over
                    </button>
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE' || (scoringBlocked && !live.overComplete)}
                      onClick={() => {
                        if (live.overComplete) {
                          setBowlerDialogOpen(true)
                        } else if (!scoringBlocked) {
                          void record({ runsOffBat: 0, extraType: null, extraRuns: 0 })
                        }
                      }}
                      className="col-span-7 h-full rounded-xl bg-[#5B0E1D] hover:bg-[#6E1224] border border-[#7A1426]/60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 disabled:opacity-40"
                    >
                      <span>{live.overComplete ? 'Pick Next Bowler' : 'Next ball'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* DESKTOP VIEW (hidden lg:flex) — OPTIMIZED WIDE DUAL-COLUMN COCKPIT */}
              <div className="hidden lg:flex flex-col h-full w-full max-w-6xl xl:max-w-7xl mx-auto p-4 xl:p-6 justify-between gap-4 overflow-hidden select-none">
                {/* DESKTOP TOP BAR */}
                <div className="flex items-center justify-between pb-3 border-b border-[#172136] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white tracking-tight">
                        {m.teamA.shortName} vs {m.teamB.shortName}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        Innings {current.number}
                      </span>
                      {m.venue && (
                        <span className="text-xs text-slate-400 font-medium">
                          • {m.venue}
                        </span>
                      )}
                    </div>

                    {matches.length > 1 && (
                      <select
                        value={m.id}
                        onChange={(e) => onSelectMatch?.(e.target.value)}
                        className="ml-3 bg-[#0D1526] text-xs font-bold text-slate-200 border border-[#172136] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-slate-600"
                        title="Switch match"
                      >
                        {matches.map((item) => (
                          <option key={item.id} value={item.id} className="bg-[#0D1526] text-white">
                            Switch: {item.teamA.shortName} vs {item.teamB.shortName} ({item.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Pause / Resume Button */}
                    {m.status === 'PAUSED' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void action('RESUME', undefined, 'Match resumed')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer animate-pulse"
                        title="Resume Match Scoring"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                        <span>Resume Inning</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || m.status !== 'LIVE'}
                        onClick={() => void action('PAUSE', undefined, 'Match paused')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                        title="Pause Current Inning"
                      >
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pause Inning</span>
                      </button>
                    )}

                    {/* End Innings Button */}
                    <button
                      type="button"
                      disabled={busy || (m.status !== 'LIVE' && m.status !== 'PAUSED')}
                      onClick={() => setConfirmAction('END_INNINGS')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      title="End Current Innings"
                    >
                      <Flag className="w-3.5 h-3.5 text-[#F43F5E]" />
                      <span>End Innings</span>
                    </button>

                    {/* Public Match Page Link */}
                    <button
                      type="button"
                      onClick={() => navigate(`/match/${m.id}`)}
                      className="px-3 py-1.5 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Open Public Match Center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </button>

                    {/* Abandon Match Button */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmAction('ABANDON')}
                      className="px-3 py-1.5 rounded-xl bg-[#0D1526] hover:bg-rose-950/40 border border-[#172136] text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Abandon Match"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Abandon</span>
                    </button>

                    {/* LIVE / PAUSED Badge */}
                    {m.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#32070F] border border-[#5B0E1D] text-rose-500 font-extrabold text-xs tracking-wide">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        LIVE
                      </span>
                    ) : m.status === 'PAUSED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 font-extrabold text-xs tracking-wide">
                        PAUSED
                      </span>
                    ) : (
                      <StatusBadge status={m.status} />
                    )}
                  </div>
                </div>

                {/* DESKTOP 2-COLUMN MAIN COCKPIT */}
                <div className="grid grid-cols-12 gap-5 flex-1 min-h-0 items-start">
                  {/* LEFT COLUMN: SCOREBOARD, BATTERS & BOWLER, THIS OVER */}
                  <div className="col-span-7 flex flex-col gap-3.5 min-h-0">
                    {/* Scoreboard Hero Card */}
                    <div className="bg-[#0D1526] border border-[#172136] rounded-2xl p-4 xl:p-5 shadow-sm shrink-0">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <div className="flex items-center gap-3">
                          <TeamLogo
                            name={battingTeam.name}
                            shortName={battingTeam.shortName}
                            color={battingTeam.color}
                            logoUrl={battingTeam.logoUrl}
                            size="md"
                          />
                          <div>
                            <div className="text-base font-extrabold text-white">{battingTeam.name}</div>
                            <div className="text-xs text-slate-400 font-medium">Batting • Innings {current.number}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-200 tabular-nums">
                            {current.oversDisplay} <span className="text-slate-400 font-normal">/ {m.totalOvers} ov</span>
                          </div>
                          <div className="text-xs font-bold text-slate-400 tabular-nums mt-0.5">
                            CRR: {current.runRate.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-[#172136]">
                        <div className="text-5xl font-black text-white tracking-tight tabular-nums">
                          {current.runs}/{current.wickets}
                        </div>
                        {m.target && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-amber-400 tabular-nums">
                              Target: {m.target}
                            </div>
                            <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                              Need {Math.max(0, m.target - current.runs)} runs from{' '}
                              {Math.max(0, m.totalOvers * 6 - current.legalBalls)} balls
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Batters & Bowler Table Card */}
                    <div className="bg-[#0D1526] border border-[#172136] rounded-2xl p-4 xl:p-5 shadow-sm text-sm shrink-0">
                      {/* Batters Header */}
                      <div className="flex items-center justify-between text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">
                        <span>Batting</span>
                        <div className="flex items-center gap-4 text-right tabular-nums">
                          <span className="w-8 text-right">R</span>
                          <span className="w-8 text-right">B</span>
                          <span className="w-8 text-right">4s</span>
                          <span className="w-8 text-right">6s</span>
                          <span className="w-12 text-right">SR</span>
                        </div>
                      </div>

                      {/* Striker Row */}
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-slate-900/60 border border-transparent">
                        <span className="font-bold text-[#F43F5E] truncate pr-2 flex items-center gap-1.5">
                          <span>{striker ? striker.name : 'Select striker'}</span>
                          <span className="text-rose-400 font-black">*</span>
                        </span>
                        <div className="flex items-center gap-4 text-right font-bold text-white tabular-nums">
                          <span className="w-8 text-right">{striker?.runs ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{striker?.balls ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{striker?.fours ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{striker?.sixes ?? 0}</span>
                          <span className="w-12 text-right text-slate-300 font-medium">{striker?.strikeRate?.toFixed(1) ?? '0.0'}</span>
                        </div>
                      </div>

                      {/* Non-Striker Row */}
                      <div className="flex items-center justify-between py-1.5 px-2 mt-1 rounded-xl">
                        <span className="font-medium text-slate-200 truncate pr-2">
                          {nonStriker ? nonStriker.name : 'Select non-striker'}
                        </span>
                        <div className="flex items-center gap-4 text-right font-bold text-white tabular-nums">
                          <span className="w-8 text-right">{nonStriker?.runs ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{nonStriker?.balls ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{nonStriker?.fours ?? 0}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{nonStriker?.sixes ?? 0}</span>
                          <span className="w-12 text-right text-slate-300 font-medium">{nonStriker?.strikeRate?.toFixed(1) ?? '0.0'}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[#172136] my-2.5" />

                      {/* Bowler Header */}
                      <div className="flex items-center justify-between text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">
                        <span>Bowling</span>
                        <div className="flex items-center gap-4 text-right tabular-nums">
                          <span className="w-8 text-right">O</span>
                          <span className="w-8 text-right">M</span>
                          <span className="w-8 text-right">R</span>
                          <span className="w-8 text-right">W</span>
                          <span className="w-12 text-right">ECON</span>
                        </div>
                      </div>

                      {/* Bowler Row */}
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-xl">
                        <span className="font-medium text-slate-200 truncate pr-2">
                          {bowlerName !== '—' ? bowlerName : 'Select bowler'}
                        </span>
                        <div className="flex items-center gap-4 text-right font-bold text-white tabular-nums">
                          <span className="w-8 text-right">{bowlerOvers}</span>
                          <span className="w-8 text-right text-slate-300 font-medium">{bowlerCard?.maidens ?? 0}</span>
                          <span className="w-8 text-right">{bowlerRuns}</span>
                          <span className="w-8 text-right text-rose-400 font-black">{bowlerWickets}</span>
                          <span className="w-12 text-right text-slate-300 font-medium">{bowlerCard?.economy?.toFixed(2) ?? '0.00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* This Over Strip */}
                    <div className="bg-[#0D1526] border border-[#172136] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                          This over ({Math.floor(current.legalBalls / 6) + (live.overComplete ? 0 : 1)}):
                        </span>
                        {!live.thisOver.length ? (
                          <span className="text-xs text-slate-500 font-normal">No deliveries yet in this over</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {live.thisOver.map((b, i) => (
                              <DarkBallDot key={i} ball={b} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-400 shrink-0">
                        <span>Wd: {current.extras.wides}</span>
                        <span>Nb: {current.extras.noBalls}</span>
                        <span>B: {current.extras.byes}</span>
                        <span>LB: {current.extras.legByes}</span>
                        <span className="font-bold text-white ml-1">Total: {current.extras.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ACTIONS, RECORD BALL KEYPAD */}
                  <div className="col-span-5 flex flex-col justify-between gap-3 min-h-0">
                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <button
                        type="button"
                        disabled={busy || m.status !== 'LIVE' || !live.strikerId || !live.nonStrikerId}
                        onClick={() => void action('SWAP_STRIKE', undefined, 'Strike swapped')}
                        className="h-11 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98 disabled:opacity-40 shadow-xs"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                        <span>Change Striker</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy || m.status !== 'LIVE'}
                        onClick={() => setBowlerDialogOpen(true)}
                        className="h-11 rounded-xl bg-[#0D1526] hover:bg-slate-800 border border-[#172136] text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98 disabled:opacity-40 shadow-xs"
                      >
                        <span>Change Bowler</span>
                      </button>
                    </div>

                    {/* Keypad Console Card */}
                    <div className="bg-[#0D1526] border border-[#172136] rounded-2xl p-4 xl:p-5 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-0.5">
                        <span>Record Delivery</span>
                        {scoringBlocked && m.status === 'LIVE' && (
                          <span className="text-amber-400 font-bold lowercase">
                            (action required)
                          </span>
                        )}
                      </div>

                      {/* Row 1: 0, 1, 2, 3 */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {[0, 1, 2, 3].map((r) => (
                          <button
                            key={r}
                            type="button"
                            disabled={scoringBlocked}
                            onClick={() => void record({ runsOffBat: r, extraType: null, extraRuns: 0 })}
                            className="h-12 xl:h-14 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] hover:border-slate-600 text-white text-2xl font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      {/* Row 2: 4, 6, Wicket, Undo */}
                      <div className="grid grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => void record({ runsOffBat: 4, extraType: null, extraRuns: 0 })}
                          className="h-12 xl:h-14 rounded-xl bg-[#4A0E18] hover:bg-[#5E0E1D] border border-[#6B1424]/70 text-white text-2xl font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          4
                        </button>
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => void record({ runsOffBat: 6, extraType: null, extraRuns: 0 })}
                          className="h-12 xl:h-14 rounded-xl bg-[#4A0E18] hover:bg-[#5E0E1D] border border-[#6B1424]/70 text-white text-2xl font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          6
                        </button>
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => setWicketDialog('NORMAL')}
                          className="h-12 xl:h-14 rounded-xl bg-[#28060D] hover:bg-[#380912] border border-[#4C0D18]/80 text-[#EF4444] font-black text-base flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          Wicket
                        </button>
                        <button
                          type="button"
                          disabled={busy || ballsBowled === 0}
                          onClick={() => setUndoOpen(true)}
                          className="h-12 xl:h-14 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] text-slate-300 font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          <Undo2 className="w-4 h-4 text-slate-400" />
                          <span>Undo</span>
                        </button>
                      </div>

                      {/* Row 3: Wide, No ball, Bye, Leg bye */}
                      <div className="grid grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => setExtraDialog('WIDE')}
                          className="h-11 xl:h-12 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          <span className="text-sm font-bold text-slate-200">Wide</span>
                          <span className="text-[10px] font-semibold text-slate-400">Wd</span>
                        </button>
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => setExtraDialog('NO_BALL')}
                          className="h-11 xl:h-12 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          <span className="text-sm font-bold text-slate-200">No ball</span>
                          <span className="text-[10px] font-semibold text-slate-400">Nb</span>
                        </button>
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => setExtraDialog('BYE')}
                          className="h-11 xl:h-12 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          <span className="text-sm font-bold text-slate-200">Bye</span>
                          <span className="text-[10px] font-semibold text-slate-400">B</span>
                        </button>
                        <button
                          type="button"
                          disabled={scoringBlocked}
                          onClick={() => setExtraDialog('LEG_BYE')}
                          className="h-11 xl:h-12 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          <span className="text-sm font-bold text-slate-200">Leg bye</span>
                          <span className="text-[10px] font-semibold text-slate-400">LB</span>
                        </button>
                      </div>

                      {/* Row 4: End Over & Next Ball */}
                      <div className="grid grid-cols-12 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={busy || m.status !== 'LIVE'}
                          onClick={() => setBowlerDialogOpen(true)}
                          className="col-span-5 h-12 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-xs"
                        >
                          End over
                        </button>
                        <button
                          type="button"
                          disabled={busy || m.status !== 'LIVE' || (scoringBlocked && !live.overComplete)}
                          onClick={() => {
                            if (live.overComplete) {
                              setBowlerDialogOpen(true)
                            } else if (!scoringBlocked) {
                              void record({ runsOffBat: 0, extraType: null, extraRuns: 0 })
                            }
                          }}
                          className="col-span-7 h-12 rounded-xl bg-[#5B0E1D] hover:bg-[#6E1224] border border-[#7A1426]/70 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-40 shadow-xs"
                        >
                          <span>{live.overComplete ? 'Pick Next Bowler' : 'Next ball (dot)'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ===================== DIALOGS ===================== */}
      {/* Needs New Batsman Dialog (Auto popup on wicket) */}
      {live?.needsNewBatsman && m.status === 'LIVE' && (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md bg-[#0D1526] border border-[#172136] text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Select New {live.needsNewBatsman === 'STRIKER' ? 'Striker' : 'Non-Striker'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                A wicket has fallen. Pick the next batsman to walk out to the middle.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto py-2">
              {live.yetToBat.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">No batters remaining</div>
              ) : (
                live.yetToBat.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void action('NEW_BATSMAN', p.id, 'New batsman in')}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#070B14] hover:bg-slate-800 border border-[#172136] text-left transition-all cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      {p.jerseyNumber != null && (
                        <div className="text-[11px] text-slate-400">#{p.jerseyNumber}</div>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Select
                    </span>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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

      {bowlerDialogOpen && live && (
        <Dialog open onOpenChange={(o) => !o && setBowlerDialogOpen(false)}>
          <DialogContent className="sm:max-w-md bg-[#0D1526] border border-[#172136] text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Select Bowler</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Choose a bowler from the fielding team to deliver the over.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 max-h-[320px] overflow-y-auto py-2">
              {live.bowlers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={busy || b.blocked}
                  onClick={async () => {
                    const done = await action('NEW_BOWLER', b.id, 'Bowler updated')
                    if (done) setBowlerDialogOpen(false)
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#172136] bg-[#070B14] hover:bg-slate-800 p-3 text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{b.name}</div>
                    <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                      {b.overs} ov &bull; {b.runs}R &bull; {b.wickets}W
                      {b.blocked ? ` • ${b.blockedReason ?? 'unavailable'}` : ''}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                    {b.blocked ? 'Blocked' : 'Select'}
                  </span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {wicketDialog && live && (
        <WicketDialog
          bowlingTeamId={live.bowlingTeamId}
          strikerId={live.strikerId}
          nonStrikerId={live.nonStrikerId}
          strikerName={striker?.name ?? 'striker'}
          nonStrikerName={nonStriker?.name ?? 'non-striker'}
          initialDelivery={wicketDialog}
          busy={busy}
          onClose={() => setWicketDialog(null)}
          onSubmit={async (input) => {
            const done = await record(input)
            if (done) {
              setWicketDialog(null)
              toast({ title: 'Wicket recorded' })
            }
          }}
        />
      )}

      {extraDialog && (
        <ExtrasDialog
          kind={extraDialog}
          bowlingTeamId={live?.bowlingTeamId ?? null}
          strikerId={live?.strikerId ?? null}
          nonStrikerId={live?.nonStrikerId ?? null}
          strikerName={striker?.name ?? 'striker'}
          nonStrikerName={nonStriker?.name ?? 'non-striker'}
          busy={busy}
          onClose={() => setExtraDialog(null)}
          onSubmit={async (input) => {
            const done = await record(input)
            if (done) {
              setExtraDialog(null)
              if (input.wicketType) toast({ title: 'Wicket recorded' })
            }
          }}
        />
      )}

      <AlertDialog open={undoOpen} onOpenChange={(o) => !o && setUndoOpen(false)}>
        <AlertDialogContent className="bg-[#0D1526] border border-[#172136] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Undo the last delivery?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              The most recent ball will be removed and the match state restored cleanly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white"
              onClick={async () => {
                await call(`/api/matches/${matchId}/undo`, { method: 'POST' }, 'Last ball undone')
                setUndoOpen(false)
              }}
            >
              Undo Ball
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[#0D1526] border border-[#172136] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction === 'END_INNINGS' ? 'End the innings now?' : 'Abandon this match?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmAction === 'END_INNINGS'
                ? m.currentInnings === 1
                  ? 'Innings 1 will be closed and the innings break begins.'
                  : 'Innings 2 will be closed and the match result finalized.'
                : 'Scoring stops permanently and the match is marked abandoned.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === 'ABANDON' ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-[#7A1426] hover:bg-[#5E0E1D] text-white'}
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

function DarkBallDot({ ball }: { ball: { label: string; kind: string; runs: number } }) {
  const label = ball.label === '•' ? '0' : ball.label
  const isDot = label === '0'
  const isWicket = ball.kind === 'W' || label === 'W'
  const isFour = ball.kind === '4' || label === '4'
  const isSix = ball.kind === '6' || label === '6'
  const isExtra =
    ball.kind === 'extra' || ['WD', 'NB', 'B', 'LB'].includes(label.toUpperCase())

  const style = isWicket
    ? 'bg-rose-950/80 border-rose-700 text-rose-300 font-black'
    : isFour
    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-bold'
    : isSix
    ? 'bg-purple-950/80 border-purple-700 text-purple-300 font-black'
    : isExtra
    ? 'bg-amber-950/80 border-amber-700 text-amber-300 font-bold'
    : isDot
    ? 'bg-slate-800/80 border-slate-700 text-slate-400 font-medium'
    : 'bg-slate-800 border-slate-600 text-white font-bold'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-[10px] h-6 w-6 border shrink-0 tabular-nums',
        style
      )}
      title={label}
    >
      {label}
    </span>
  )
}

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
        <SelectTrigger className="flex-1 bg-white" aria-label="New batsman">
          <SelectValue placeholder={yetToBat.length ? 'Select new batsman' : 'No batters left'} />
        </SelectTrigger>
        <SelectContent>
          {yetToBat.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white" disabled={disabled || !pid} onClick={() => onPick(pid)}>
        Send in
      </Button>
    </div>
  )
}

function BowlerPrompt({
  bowlers,
  disabled,
  onPick,
}: {
  bowlers: { id: string; name: string; overs: string; runs: number; wickets: number; blocked: boolean; blockedReason: string | null }[]
  disabled: boolean
  onPick: (playerId: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {bowlers.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={disabled || b.blocked}
          onClick={() => onPick(b.id)}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs hover:border-[#7A1426] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="font-bold text-[#111827]">{b.name}</span>
          <span className="text-[11px] text-gray-500 tabular-nums">
            {b.overs} ov &bull; {b.runs}R &bull; {b.wickets}W
            {b.blocked ? ` • ${b.blockedReason ?? 'unavailable'}` : ''}
          </span>
        </button>
      ))}
    </div>
  )
}

function useBowlingFielders(bowlingTeamId: string | null) {
  const [fielders, setFielders] = useState<SquadPlayer[]>([])
  const [loadedTeamId, setLoadedTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (!bowlingTeamId) return
    let alive = true
    api<{ players: SquadPlayer[] }>(`/api/teams/${bowlingTeamId}`)
      .then((t) => {
        if (!alive) return
        setFielders(t.players)
        setLoadedTeamId(bowlingTeamId)
      })
      .catch(() => {
        if (!alive) return
        setFielders([])
        setLoadedTeamId(bowlingTeamId)
      })
    return () => {
      alive = false
    }
  }, [bowlingTeamId])

  return {
    fielders: bowlingTeamId && loadedTeamId === bowlingTeamId ? fielders : [],
    loadingFielders: Boolean(bowlingTeamId) && loadedTeamId !== bowlingTeamId,
  }
}

function RunOutBatterFieldset({
  strikerId,
  nonStrikerId,
  strikerName,
  nonStrikerName,
  value,
  onChange,
  name,
}: {
  strikerId: string | null
  nonStrikerId: string | null
  strikerName: string
  nonStrikerName: string
  value: 'STRIKER' | 'NON_STRIKER'
  onChange: (next: 'STRIKER' | 'NON_STRIKER') => void
  name: string
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#111827] mb-1.5">
        Which batter is out?
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(
          [
            ['STRIKER', `${strikerName} (Striker)`, Boolean(strikerId)],
            ['NON_STRIKER', `${nonStrikerName} (Non-Striker)`, Boolean(nonStrikerId)],
          ] as const
        ).map(([opt, text, enabled]) => {
          const selected = value === opt
          return (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-2.5 min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                selected
                  ? 'border-[#7A1426] bg-[#7A1426]/8 text-[#7A1426]'
                  : 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                disabled={!enabled}
                checked={selected}
                onChange={() => onChange(opt)}
                className="h-4 w-4 accent-[#7A1426] shrink-0"
              />
              <span className="truncate">{text}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function FielderAssistSelect({
  wicketType,
  fielders,
  loadingFielders,
  assistId,
  onChange,
  selectId,
}: {
  wicketType: WicketType
  fielders: SquadPlayer[]
  loadingFielders: boolean
  assistId: string
  onChange: (id: string) => void
  selectId: string
}) {
  const orderedFielders = useMemo(() => {
    if (wicketType !== 'STUMPED') return fielders
    return [...fielders].sort((a, b) => {
      const aWk = a.role === 'WICKETKEEPER' ? 0 : 1
      const bWk = b.role === 'WICKETKEEPER' ? 0 : 1
      return aWk - bWk
    })
  }, [fielders, wicketType])

  const label =
    wicketType === 'STUMPED'
      ? 'Fielder / Wicket-keeper who effected Stump Out'
      : wicketType === 'RUN_OUT'
      ? 'Fielder who took Run Out'
      : 'Fielder who took Catch'

  const placeholder = loadingFielders
    ? 'Loading bowling squad...'
    : wicketType === 'STUMPED'
    ? 'Select player for stump out'
    : wicketType === 'RUN_OUT'
    ? 'Select fielder for run out'
    : 'Select fielder for catch'

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        value={assistId || undefined}
        onValueChange={onChange}
        disabled={loadingFielders || orderedFielders.length === 0}
      >
        <SelectTrigger id={selectId} aria-label={label} className="min-h-11">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {orderedFielders.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
              {f.role === 'WICKETKEEPER' ? ' (WK)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-gray-500">
        {wicketType === 'STUMPED'
          ? 'Recorded on the scorecard; tournament Best Fielder counts catches & run outs.'
          : 'Credited toward tournament Best Fielder (most catches & run outs).'}
      </p>
    </div>
  )
}

function WicketDialog({
  bowlingTeamId,
  strikerId,
  nonStrikerId,
  strikerName,
  nonStrikerName,
  initialDelivery = 'NORMAL',
  busy,
  onClose,
  onSubmit,
}: {
  bowlingTeamId: string
  strikerId: string | null
  nonStrikerId: string | null
  strikerName: string
  nonStrikerName: string
  initialDelivery?: 'NORMAL' | 'WIDE'
  busy: boolean
  onClose: () => void
  onSubmit: (input: BallEventInput) => void
}) {
  const [deliveryType, setDeliveryType] = useState<'NORMAL' | 'WIDE'>(initialDelivery)
  const [wideRuns, setWideRuns] = useState(1)
  const [runsOffBat, setRunsOffBat] = useState(0)
  const [wicketType, setWicketType] = useState<WicketType | null>(null)
  const [dismissed, setDismissed] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER')
  const [assistId, setAssistId] = useState('')
  const { fielders, loadingFielders } = useBowlingFielders(bowlingTeamId)

  const canScoreBatRuns =
    deliveryType === 'NORMAL' && (wicketType === 'HIT_WICKET' || wicketType === 'RUN_OUT')
  const needsAssist =
    wicketType === 'CAUGHT' || wicketType === 'RUN_OUT' || wicketType === 'STUMPED'

  const assistRequired = needsAssist && !loadingFielders && fielders.length > 0
  const canSubmit =
    !busy &&
    wicketType !== null &&
    (!needsAssist || !loadingFielders) &&
    (!assistRequired || Boolean(assistId))

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Wicket</DialogTitle>
          <DialogDescription>
            Choose delivery type, dismissal, and credit the fielder when applicable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 min-w-0">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[#111827] mb-1.5">
              Delivery type
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['NORMAL', 'Normal Ball', 'Legal delivery'],
                  ['WIDE', 'Wide Ball', '+1 wide, re-bowled'],
                ] as const
              ).map(([value, title, sub]) => {
                const selected = deliveryType === value
                return (
                  <label
                    key={value}
                    className={cn(
                      'flex items-center gap-2.5 min-h-11 rounded-xl border px-3 py-2 text-sm font-medium cursor-pointer transition-colors',
                      selected
                        ? 'border-[#7A1426] bg-[#7A1426]/8 text-[#7A1426]'
                        : 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="wicketDeliveryType"
                      value={value}
                      checked={selected}
                      onChange={() => {
                        setDeliveryType(value)
                        if (value === 'WIDE') {
                          setRunsOffBat(0)
                          if (wicketType && !WIDE_ALLOWED_WICKETS.has(wicketType)) {
                            setWicketType(null)
                            setAssistId('')
                          }
                        }
                      }}
                      className="h-4 w-4 accent-[#7A1426] shrink-0"
                    />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate font-semibold">{title}</span>
                      <span className="block truncate text-[11px] font-normal text-gray-500">
                        {sub}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[#111827] mb-1.5">
              How did the wicket fall?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {WICKET_LABELS.map(([key, label]) => {
                const disabled = deliveryType === 'WIDE' && !WIDE_ALLOWED_WICKETS.has(key)
                const selected = wicketType === key
                return (
                  <label
                    key={key}
                    className={cn(
                      'flex items-center gap-2.5 min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                      disabled ? 'opacity-45 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' : 'cursor-pointer',
                      selected
                        ? 'border-[#7A1426] bg-[#7A1426]/8 text-[#7A1426]'
                        : !disabled && 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="wicketType"
                      value={key}
                      disabled={disabled}
                      checked={selected}
                      onChange={() => {
                        setWicketType(key)
                        setAssistId('')
                        setRunsOffBat(0)
                      }}
                      className="h-4 w-4 accent-[#7A1426] shrink-0"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                )
              })}
            </div>
            {deliveryType === 'WIDE' && (
              <p className="text-[11px] text-gray-500">
                On a wide ball, only Stump Out, Run Out, or Hit Wicket apply.
              </p>
            )}
          </fieldset>

          {canScoreBatRuns && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#111827] mb-1.5">
                Runs scored on this ball (optional)
              </legend>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 6].map((runs) => {
                  const active = runsOffBat === runs
                  const isBoundary = runs === 4 || runs === 6
                  return (
                    <button
                      key={runs}
                      type="button"
                      disabled={busy}
                      aria-pressed={active}
                      onClick={() => setRunsOffBat(runs)}
                      className={cn(
                        'min-h-11 rounded-xl border-2 text-sm font-extrabold transition-colors cursor-pointer',
                        active
                          ? 'border-[#7A1426] bg-[#7A1426]/10 text-[#7A1426]'
                          : isBoundary
                          ? 'border-amber-200 bg-amber-50/70 text-[#7A1426] hover:bg-amber-100/70'
                          : 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
                      )}
                    >
                      {runs}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-500">
                {runsOffBat > 0
                  ? `${runsOffBat} run${runsOffBat === 1 ? '' : 's'} will count for the batter & team, and the batter will still be out.`
                  : 'Tap 4 or 6 if the batter hit a boundary before getting out.'}
              </p>
            </fieldset>
          )}

          {deliveryType === 'WIDE' && wicketType === 'RUN_OUT' && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#111827] mb-1.5">
                Total wide runs (including 1 penalty)
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((runs) => {
                  const selected = wideRuns === runs
                  return (
                    <label
                      key={runs}
                      className={cn(
                        'flex items-center justify-center gap-1.5 min-h-11 rounded-xl border px-2 py-2 text-sm font-bold cursor-pointer transition-colors',
                        selected
                          ? 'border-[#7A1426] bg-[#7A1426]/8 text-[#7A1426]'
                          : 'border-gray-200 bg-white text-[#111827] hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="wideRunOutRuns"
                        value={runs}
                        checked={selected}
                        onChange={() => setWideRuns(runs)}
                        className="h-3.5 w-3.5 accent-[#7A1426] shrink-0"
                      />
                      <span>{runs} wd</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {wicketType === 'RUN_OUT' && (
            <RunOutBatterFieldset
              strikerId={strikerId}
              nonStrikerId={nonStrikerId}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              value={dismissed}
              onChange={setDismissed}
              name="dismissedBatter"
            />
          )}

          {needsAssist && wicketType && (
            <FielderAssistSelect
              wicketType={wicketType}
              fielders={fielders}
              loadingFielders={loadingFielders}
              assistId={assistId}
              onChange={setAssistId}
              selectId="wicket-fielder-select"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="bg-[#7A1426] hover:bg-[#5E0E1D]"
            disabled={!canSubmit}
            onClick={() => {
              if (!wicketType) return
              onSubmit({
                runsOffBat: canScoreBatRuns ? runsOffBat : 0,
                extraType: deliveryType === 'WIDE' ? 'WIDE' : null,
                extraRuns:
                  deliveryType === 'WIDE'
                    ? wicketType === 'RUN_OUT'
                      ? wideRuns
                      : 1
                    : 0,
                wicketType,
                dismissedId:
                  wicketType === 'RUN_OUT' && dismissed === 'NON_STRIKER'
                    ? nonStrikerId
                    : strikerId,
                assistId: needsAssist && assistId ? assistId : null,
              })
            }}
          >
            {canScoreBatRuns && runsOffBat > 0 ? `Record ${runsOffBat} + Wicket` : 'Confirm Wicket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExtrasDialog({
  kind,
  bowlingTeamId,
  strikerId,
  nonStrikerId,
  strikerName,
  nonStrikerName,
  busy,
  onClose,
  onSubmit,
}: {
  kind: ExtraType
  bowlingTeamId: string | null
  strikerId: string | null
  nonStrikerId: string | null
  strikerName: string
  nonStrikerName: string
  busy: boolean
  onClose: () => void
  onSubmit: (input: BallEventInput) => void
}) {
  const [n, setN] = useState(kind === 'NO_BALL' ? '0' : '1')
  const [wideWicket, setWideWicket] = useState<'STUMPED' | 'RUN_OUT' | null>(null)
  const [dismissed, setDismissed] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER')
  const [assistId, setAssistId] = useState('')
  const { fielders, loadingFielders } = useBowlingFielders(kind === 'WIDE' ? bowlingTeamId : null)

  const config: Record<ExtraType, { title: string; desc: string; min: number; max: number; note: string }> = {
    WIDE: {
      title: 'Wide',
      desc: 'Total wide runs including the 1 penalty run.',
      min: 1,
      max: 7,
      note: 'Wide — ball is re-bowled; not counted as a ball faced.',
    },
    NO_BALL: {
      title: 'No Ball',
      desc: 'Runs off the bat after the no-ball (1 penalty run is added automatically).',
      min: 0,
      max: 6,
      note: 'No-ball — counts as a ball faced but the delivery is re-bowled.',
    },
    BYE: {
      title: 'Byes',
      desc: 'Bye runs (1–4).',
      min: 1,
      max: 4,
      note: 'Byes — legal ball, runs do not go to the batter.',
    },
    LEG_BYE: {
      title: 'Leg Byes',
      desc: 'Leg-bye runs (1–4).',
      min: 1,
      max: 4,
      note: 'Leg-byes — legal ball, runs do not go to the batter.',
    },
  }
  const c = config[kind]
  const value = Math.min(Math.max(Number(n) || c.min, c.min), c.max)

  const needsAssist = kind === 'WIDE' && wideWicket !== null
  const assistRequired = needsAssist && !loadingFielders && fielders.length > 0
  const canSubmit =
    !busy && (!needsAssist || !loadingFielders) && (!assistRequired || Boolean(assistId))

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: c.max - c.min + 1 }, (_, i) => c.min + i).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setN(String(v))}
                className={cn(
                  'h-11 rounded-lg border-2 text-base font-extrabold transition-colors cursor-pointer',
                  value === v ? 'border-[#7A1426] bg-[#7A1426]/10 text-[#7A1426]' : 'border-gray-200 hover:border-gray-300'
                )}
                aria-pressed={value === v}
              >
                {v}
              </button>
            ))}
          </div>

          {kind === 'WIDE' && (
            <fieldset className="space-y-2 pt-1 border-t border-gray-100">
              <legend className="text-xs font-semibold text-gray-600 mb-1">
                Wicket on this wide ball (optional)
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['STUMPED', 'Stump Out'],
                    ['RUN_OUT', 'Run Out'],
                  ] as const
                ).map(([type, label]) => {
                  const active = wideWicket === type
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={busy}
                      aria-pressed={active}
                      onClick={() => {
                        setWideWicket(active ? null : type)
                        setAssistId('')
                      }}
                      className={cn(
                        'min-h-11 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                        active
                          ? 'border-[#7A1426] bg-[#7A1426]/10 text-[#7A1426]'
                          : 'border-gray-200 bg-white text-[#111827] hover:border-rose-300 hover:bg-rose-50/70'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-5 h-5 rounded-full text-[10px] font-black inline-flex items-center justify-center shrink-0',
                          active ? 'bg-[#7A1426] text-white' : 'bg-rose-100 text-[#991B1B]'
                        )}
                      >
                        W
                      </span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          {kind === 'WIDE' && wideWicket === 'RUN_OUT' && (
            <RunOutBatterFieldset
              strikerId={strikerId}
              nonStrikerId={nonStrikerId}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              value={dismissed}
              onChange={setDismissed}
              name="wideDismissedBatter"
            />
          )}

          {kind === 'WIDE' && wideWicket && (
            <FielderAssistSelect
              wicketType={wideWicket}
              fielders={fielders}
              loadingFielders={loadingFielders}
              assistId={assistId}
              onChange={setAssistId}
              selectId="wide-wicket-fielder-select"
            />
          )}

          <p className="text-xs text-gray-500">{c.note}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit(
                kind === 'NO_BALL'
                  ? { runsOffBat: value, extraType: 'NO_BALL', extraRuns: 1 }
                  : kind === 'WIDE' && wideWicket
                  ? {
                      runsOffBat: 0,
                      extraType: 'WIDE',
                      extraRuns: value,
                      wicketType: wideWicket,
                      dismissedId:
                        wideWicket === 'RUN_OUT' && dismissed === 'NON_STRIKER'
                          ? nonStrikerId
                          : strikerId,
                      assistId: assistId || null,
                    }
                  : { runsOffBat: 0, extraType: kind, extraRuns: value }
              )
            }
          >
            {kind === 'WIDE' && wideWicket ? 'Record Wicket' : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
