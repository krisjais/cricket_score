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
  const [wicketOpen, setWicketOpen] = useState(false)
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
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
  }

  const striker = current?.batting.find((b) => b.id === live?.strikerId)
  const nonStriker = current?.batting.find((b) => b.id === live?.nonStrikerId)
  const bowlerCard = current?.bowling.find((b) => b.id === live?.bowlerId)
  const bowlerOption = live?.bowlers.find((b) => b.id === live?.bowlerId)
  const bowlerName = bowlerCard?.name ?? bowlerOption?.name ?? '—'
  const bowlerStatsDisplay = bowlerCard
    ? `${bowlerCard.overs} - ${bowlerCard.maidens} - ${bowlerCard.runsConceded} - ${bowlerCard.wickets}`
    : bowlerOption
    ? `${bowlerOption.overs} - 0 - ${bowlerOption.runs} - ${bowlerOption.wickets}`
    : '0.0 - 0 - 0 - 0'
  const tossTeam = m.tossWinnerId ? (m.tossWinnerId === m.teamA.id ? m.teamA : m.teamB) : null

  return (
    <div className="space-y-5">
      {/* ===================== HEADER ROW: Scoreboard + Match Controls (Panel 4 Reference) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Main White Scoreboard Card */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 font-semibold">
            <span>
              {m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}
              {m.venue ? ` • ${m.venue}` : ' • Turf 01'}
              {current ? ` • Innings ${current.number}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-amber-400')} />
                <span>{connected ? 'Synced' : 'Reconnecting'}</span>
              </span>
              <button
                type="button"
                onClick={() => navigate(`/match/${m.id}`)}
                className="text-[11px] font-semibold text-gray-600 hover:text-[#7A1426] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Public</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              {m.status === 'LIVE' ? <LiveBadge /> : <StatusBadge status={m.status} />}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 py-1">
            {/* Team A */}
            <div className="flex items-center gap-3 min-w-0">
              <TeamLogo
                name={m.teamA.name}
                shortName={m.teamA.shortName}
                color={m.teamA.color}
                logoUrl={m.teamA.logoUrl}
                size="lg"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-[#111827] truncate">{m.teamA.name}</div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {m.teamA.shortName}
                </span>
              </div>
            </div>

            {/* Center Score + Overs */}
            <div className="text-center shrink-0 px-2">
              <div className="text-3xl sm:text-4xl font-black text-[#111827] tabular-nums tracking-tight leading-none">
                {current ? `${current.runs}/${current.wickets}` : 'VS'}
              </div>
              {current && (
                <div className="text-xs font-semibold text-gray-500 mt-1 tabular-nums">
                  {current.oversDisplay} Overs &bull; RR {current.runRate.toFixed(2)}
                  {m.target ? ` • Target ${m.target}` : ''}
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-row-reverse items-center gap-3 text-right min-w-0">
              <TeamLogo
                name={m.teamB.name}
                shortName={m.teamB.shortName}
                color={m.teamB.color}
                logoUrl={m.teamB.logoUrl}
                size="lg"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-[#111827] truncate">{m.teamB.name}</div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {m.teamB.shortName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Match Controls (Panel 4 Reference) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex flex-col justify-between gap-2">
          <div className="text-xs font-bold text-[#111827]">Match Controls</div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {m.status === 'PAUSED' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void action('RESUME', undefined, 'Match resumed')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-3 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || m.status !== 'LIVE'}
                onClick={() => void action('PAUSE', undefined, 'Match paused')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] text-xs font-bold py-2 px-3 cursor-pointer disabled:opacity-45"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              disabled={busy || (m.status !== 'LIVE' && m.status !== 'PAUSED')}
              onClick={() => setConfirmAction('END_INNINGS')}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] text-xs font-bold py-2 px-3 cursor-pointer disabled:opacity-45"
            >
              <Flag className="w-3.5 h-3.5 text-[#7A1426]" />
              <span>End Innings</span>
            </button>
          </div>
          {m.status !== 'COMPLETED' && m.status !== 'ABANDONED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmAction('ABANDON')}
              className="text-[11px] font-semibold text-rose-600 hover:underline self-end cursor-pointer"
            >
              Abandon match
            </button>
          )}
        </div>
      </div>

      {/* ===================== SCORER SUB-VIEWS (Details / Log / Switch) ===================== */}
      {scorerSubView === 'details' && (
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#111827]">Match Information</h2>
              {onSelectSubView && (
                <Button size="sm" variant="outline" onClick={() => onSelectSubView('score')}>
                  Back to Scoring
                </Button>
              )}
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <dt className="font-bold text-gray-500 uppercase">Teams</dt>
                <dd className="font-bold text-sm text-[#111827] mt-0.5">{m.teamA.name} vs {m.teamB.name}</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500 uppercase">Venue / Turf</dt>
                <dd className="font-semibold text-[#111827] mt-0.5">{m.venue || 'Main Ground'}</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500 uppercase">Format</dt>
                <dd className="font-semibold text-[#111827] mt-0.5">{m.format} ({m.totalOvers} overs)</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500 uppercase">Toss Decision</dt>
                <dd className="font-semibold text-[#111827] mt-0.5">
                  {tossTeam ? `${tossTeam.name} elected to ${m.tossDecision?.toLowerCase()}` : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500 uppercase">Started</dt>
                <dd className="font-semibold text-[#111827] mt-0.5">{fmtDate(m.startedAt)}</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-500 uppercase">Status</dt>
                <dd className="font-bold text-[#7A1426] mt-0.5">{m.status.replace('_', ' ')}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {scorerSubView === 'log' && (
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#7A1426]" />
              <span>Match Ball-by-Ball Log</span>
            </span>
            {onSelectSubView && (
              <Button size="sm" variant="outline" onClick={() => onSelectSubView('score')}>
                Back to Scoring
              </Button>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {payload.innings.every((i) => i.commentary.length === 0) ? (
              <div className="p-10 text-center text-xs text-gray-400">No deliveries logged yet.</div>
            ) : (
              [...payload.innings].reverse().map((inn) =>
                inn.commentary.map((c) => (
                  <div key={`${inn.number}-${c.sequence}`} className="px-5 py-3 flex items-center gap-3 text-xs hover:bg-gray-50">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">Inn {inn.number}</span>
                    <span className="font-mono font-bold text-gray-500 w-10">{c.overDisplay}</span>
                    <BallDot ball={{ label: c.kind === 'W' ? 'W' : c.kind === '4' ? '4' : c.kind === '6' ? '6' : String(c.runs), kind: c.kind }} size="sm" />
                    <span className="text-gray-800 flex-1">{c.text}</span>
                  </div>
                ))
              )
            )}
          </div>
        </Card>
      )}

      {scorerSubView === 'switch' && (
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#111827]">Switch Active Match</h2>
              {onSelectSubView && (
                <Button size="sm" variant="outline" onClick={() => onSelectSubView('score')}>
                  Cancel
                </Button>
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
                      ? 'border-[#7A1426] bg-[#7A1426]/[0.04]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div>
                    <div className="font-bold text-sm text-[#111827]">
                      {item.teamA.shortName} vs {item.teamB.shortName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.venue || 'Turf 01'} &bull; {item.format}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== MAIN SCORING VIEW ===================== */}
      {scorerSubView === 'score' && (
        <>
          {/* Pre-match Setup States */}
          {m.status === 'SCHEDULED' && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Coins className="h-8 w-8 text-[#7A1426]" aria-hidden />
                <p className="text-sm font-medium text-gray-600">
                  Match is scheduled. Record the toss to unlock live scoring.
                </p>
                <Button
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  onClick={() => setTossOpen(true)}
                >
                  <Coins className="h-4 w-4 mr-1.5" aria-hidden /> Record Toss
                </Button>
              </CardContent>
            </Card>
          )}

          {m.status === 'TOSS_DONE' && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Play className="h-8 w-8 text-[#7A1426]" aria-hidden />
                <p className="text-sm font-medium text-gray-600">
                  Toss done &mdash; pick the two openers and the opening bowler to start play.
                </p>
                <Button
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  onClick={() => setStartOpen(true)}
                >
                  <Play className="h-4 w-4 mr-1.5" aria-hidden /> Start Match
                </Button>
              </CardContent>
            </Card>
          )}

          {m.status === 'INNINGS_BREAK' && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Play className="h-8 w-8 text-[#7A1426]" aria-hidden />
                <p className="text-sm font-medium text-gray-600">
                  Innings 1 closed. Target: <b className="text-[#7A1426]">{m.target}</b>. Start the second innings.
                </p>
                <Button
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  onClick={() => setStartOpen(true)}
                >
                  <Play className="h-4 w-4 mr-1.5" aria-hidden /> Start Innings 2
                </Button>
              </CardContent>
            </Card>
          )}

          {/* LIVE / PAUSED 2-COLUMN SCORING COCKPIT (Panel 4 Reference) */}
          {(m.status === 'LIVE' || m.status === 'PAUSED') && live && current && (
            <div className="space-y-4">
              {/* Urgent Selection Banners */}
              {(live.needsNewBatsman || live.overComplete) && m.status === 'LIVE' && (
                <Card className="rounded-2xl border-amber-300 bg-amber-50">
                  <CardContent className="p-4 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
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
                <Card className="rounded-2xl border-orange-300 bg-orange-50">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-orange-900">
                      <Pause className="h-4 w-4" aria-hidden /> Scoring is currently paused.
                    </p>
                    <Button
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      disabled={busy}
                      onClick={() => void action('RESUME', undefined, 'Match resumed')}
                    >
                      <Play className="h-4 w-4 mr-1" aria-hidden /> Resume Scoring
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN (Panel 4 Reference): Current Batters, Current Bowler, Change Buttons */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Current Batters */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                      <Pencil className="w-3.5 h-3.5 text-[#7A1426]" />
                      <span>Current Batters</span>
                    </div>

                    <div className="space-y-2">
                      {[striker, nonStriker].map((b, idx) => {
                        const onStrike = idx === 0 && Boolean(live.strikerId)
                        return (
                          <div
                            key={b?.id ?? idx}
                            className={cn(
                              'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm border transition-colors',
                              onStrike
                                ? 'bg-[#7A1426]/[0.06] border-[#7A1426]/30 text-[#111827]'
                                : 'bg-gray-50 border-gray-200/70 text-[#111827]'
                            )}
                          >
                            <span className="font-bold truncate pr-2">
                              {b ? `${b.name}${onStrike ? ' *' : ''}` : <span className="text-gray-400 font-normal">Awaiting batter</span>}
                            </span>
                            <span className="font-mono font-extrabold tabular-nums shrink-0 text-xs sm:text-sm">
                              {b ? `${b.runs} (${b.balls})` : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Current Bowler */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-2.5">
                    <div className="text-xs font-bold text-[#111827]">Current Bowler</div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200/70 px-3.5 py-2.5">
                      <div>
                        <div className="font-bold text-sm text-[#111827]">{bowlerName}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5 tabular-nums">
                          {bowlerStatsDisplay}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                        O-M-R-W
                      </span>
                    </div>
                  </div>

                  {/* Compact This Over & Extras */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                      <span>This Over ({Math.floor(current.legalBalls / 6) + (live.overComplete ? 0 : 1)})</span>
                      <span className="font-mono text-[#7A1426]">Extras: {current.extras.total}</span>
                    </div>
                    <BallDotsRow balls={live.thisOver} />
                  </div>

                  {/* 2 Action Buttons: Change Striker | Change Bowler */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE' || !live.strikerId || !live.nonStrikerId}
                      onClick={() => void action('SWAP_STRIKE', undefined, 'Strike swapped')}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] font-bold text-xs py-2.5 px-3 shadow-2xs transition-all cursor-pointer disabled:opacity-45"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#7A1426]" />
                      <span>Change Striker</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE'}
                      onClick={() => setBowlerDialogOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] font-bold text-xs py-2.5 px-3 shadow-2xs transition-all cursor-pointer disabled:opacity-45"
                    >
                      <Ban className="w-3.5 h-3.5 text-[#7A1426]" />
                      <span>Change Bowler</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN (Panel 4 Reference): Record Ball Keypad */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#111827]">Record Ball</h2>
                    {scoringBlocked && m.status === 'LIVE' && (
                      <span className="text-[11px] font-bold text-amber-700">
                        Select new player above to continue
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
                        className="h-14 rounded-xl border border-gray-200 bg-white hover:border-[#7A1426] hover:bg-gray-50 text-xl font-extrabold text-[#111827] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Wide buttons for 4 (Maroon), 6 (Maroon), Wicket (Red) */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => void record({ runsOffBat: 4, extraType: null, extraRuns: 0 })}
                      className="h-14 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xl font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      4
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => void record({ runsOffBat: 6, extraType: null, extraRuns: 0 })}
                      className="h-14 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xl font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      6
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setWicketOpen(true)}
                      className="h-14 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-[#991B1B] font-bold text-sm shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#991B1B] text-white text-xs font-black inline-flex items-center justify-center">
                        W
                      </span>
                      <span>Wicket</span>
                    </button>
                  </div>

                  {/* Row 3: Wide, No Ball, Bye, Leg Bye, Undo */}
                  <div className="grid grid-cols-5 gap-2">
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('WIDE')}
                      className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#111827]">Wide</div>
                      <div className="text-[10px] font-semibold text-gray-400">W</div>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('NO_BALL')}
                      className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#111827]">No Ball</div>
                      <div className="text-[10px] font-semibold text-gray-400">NB</div>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('BYE')}
                      className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#111827]">Bye</div>
                      <div className="text-[10px] font-semibold text-gray-400">B</div>
                    </button>
                    <button
                      type="button"
                      disabled={scoringBlocked}
                      onClick={() => setExtraDialog('LEG_BYE')}
                      className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#111827]">Leg Bye</div>
                      <div className="text-[10px] font-semibold text-gray-400">LB</div>
                    </button>
                    <button
                      type="button"
                      disabled={busy || ballsBowled === 0}
                      onClick={() => setUndoOpen(true)}
                      className="rounded-xl border border-gray-200 bg-white hover:bg-rose-50 hover:border-rose-200 py-2.5 text-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#111827]">Undo</div>
                      <Undo2 className="w-3 h-3 mx-auto text-gray-500 mt-0.5" />
                    </button>
                  </div>

                  {/* Bottom Row: End Over | Next Ball -> */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE'}
                      onClick={() => setBowlerDialogOpen(true)}
                      className="h-11 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-[#111827] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
                    >
                      <Flag className="w-3.5 h-3.5 text-gray-600" />
                      <span>End Over</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy || m.status !== 'LIVE'}
                      onClick={() => {
                        if (live.overComplete) {
                          setBowlerDialogOpen(true)
                        } else if (!scoringBlocked) {
                          void record({ runsOffBat: 0, extraType: null, extraRuns: 0 })
                        }
                      }}
                      title="Record quick dot ball (0) or advance to next bowler after over"
                      className="h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 active:scale-98"
                    >
                      <span>{live.overComplete ? 'Pick Next Bowler' : 'Next Ball'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed / Abandoned */}
          {(m.status === 'COMPLETED' || m.status === 'ABANDONED') && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {m.status === 'COMPLETED' ? 'Match Completed' : 'Abandoned'}
                </span>
                <p className="text-base font-bold text-[#111827]">{m.resultText ?? '—'}</p>
                {ballsBowled > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setUndoOpen(true)}
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Undo last ball &amp; re-open
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ===================== DIALOGS ===================== */}
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
          <DialogContent className="sm:max-w-md bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>Select Bowler</DialogTitle>
              <DialogDescription>Choose a bowler from the fielding team to deliver the over.</DialogDescription>
            </DialogHeader>
            <BowlerPrompt
              bowlers={live.bowlers}
              disabled={busy}
              onPick={async (pid) => {
                const done = await action('NEW_BOWLER', pid, 'Bowler updated')
                if (done) setBowlerDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
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
              The most recent ball is removed and the match state is restored cleanly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#7A1426] hover:bg-[#5E0E1D]"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'END_INNINGS' ? 'End the innings now?' : 'Abandon this match?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'END_INNINGS'
                ? m.currentInnings === 1
                  ? 'Innings 1 will be closed and the innings break begins.'
                  : 'Innings 2 will be closed and the match result finalized.'
                : 'Scoring stops permanently and the match is marked abandoned.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === 'ABANDON' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#7A1426] hover:bg-[#5E0E1D]'}
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
              {p.jerseyNumber ? `${p.jerseyNumber}. ` : ''}
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
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Record Wicket</DialogTitle>
          <DialogDescription>Select dismissal details</DialogDescription>
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
              <p className="text-[11px] text-gray-500">
                Credited automatically toward Best Fielder awards.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="bg-[#7A1426] hover:bg-[#5E0E1D]"
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
            Confirm Wicket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
  const [n, setN] = useState(kind === 'NO_BALL' ? '0' : '1')
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

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xs bg-white">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
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
          <p className="text-xs text-gray-500">{c.note}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white"
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
