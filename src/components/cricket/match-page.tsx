'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  Share2,
  RefreshCcw,
  Radio,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  FileText,
  Trophy,
  Clock,
  Pause,
  Coins,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BallDot, BallDotsRow, LiveBadge, StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { ScorecardView } from '@/components/cricket/scorecard-view'
import { useMatchChannel, fmtDate, api } from '@/lib/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type AudienceTab = 'live' | 'scorecard' | 'commentary' | 'statistics' | 'info'

export function MatchPage({ matchId, navigate }: { matchId: string; navigate: (to: string) => void }) {
  const { toast } = useToast()
  const { state: payload, setLiveState, connected } = useMatchChannel(matchId, null)
  const [activeTab, setActiveTab] = useState<AudienceTab>('live')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const fresh = await api<any>(`/api/matches/${matchId}`)
      if (fresh) setLiveState(fresh)
    } catch {
      // ignore transient
    } finally {
      setRefreshing(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Match link copied!', description: 'Share this URL for live scoreboard updates.' })
    } catch {
      toast({ title: 'Share Match', description: window.location.href })
    }
  }

  if (!payload || !payload.match || !Array.isArray(payload.innings)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center max-w-md w-full shadow-xs">
          <p className="text-base font-bold text-[#111827]">Match not found or loading...</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    )
  }

  const m = payload.match
  const current =
    payload.innings.find((i) => i.number === m.currentInnings && i.live !== null) ??
    payload.innings.find((i) => i.number === m.currentInnings) ??
    payload.innings[payload.innings.length - 1] ??
    null
  const live = current?.live ?? null
  const batTeam = current ? (current.battingTeamId === m.teamA.id ? m.teamA : m.teamB) : null
  const striker = current?.batting.find((b) => b.id === current.live?.strikerId)
  const nonStriker = current?.batting.find((b) => b.id === current.live?.nonStrikerId)
  const bowlerCard = current?.bowling.find((b) => b.id === current.live?.bowlerId)
  const bowlerOption = payload.live?.bowlers.find((b) => b.id === current?.live?.bowlerId)
  const bowlerName = bowlerCard?.name ?? bowlerOption?.name ?? '—'
  const bowlerOvers = bowlerCard?.overs ?? bowlerOption?.overs ?? '0.0'
  const bowlerMaidens = bowlerCard?.maidens ?? 0
  const bowlerRuns = bowlerCard?.runsConceded ?? bowlerOption?.runs ?? 0
  const bowlerWkts = bowlerCard?.wickets ?? bowlerOption?.wickets ?? 0
  const bowlerEcon = bowlerCard ? bowlerCard.economy.toFixed(2) : '0.00'

  const last5Overs = current ? current.overs.slice(-5) : []
  const tossTeam = m.tossWinnerId ? (m.tossWinnerId === m.teamA.id ? m.teamA : m.teamB) : null

  const tabItems: { key: AudienceTab; label: string; footerLabel: string; icon: typeof Radio }[] = [
    { key: 'live', label: 'Live', footerLabel: 'Live Match (Main)', icon: Radio },
    { key: 'scorecard', label: 'Scorecard', footerLabel: 'Scorecard', icon: ClipboardList },
    { key: 'commentary', label: 'Commentary', footerLabel: 'Commentary', icon: MessageSquareText },
    { key: 'statistics', label: 'Statistics', footerLabel: 'Statistics', icon: BarChart3 },
    { key: 'info', label: 'Match Info', footerLabel: 'Match Info', icon: FileText },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F5F7] text-[#111827]">
      {/* ===================== AUDIENCE PANEL HEADER (Panel 2 Reference) ===================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              aria-label="Back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#111827] truncate">Nexcore Premier League</div>
              <div className="text-[11px] text-gray-500 font-medium truncate">
                {m.teamA.shortName} vs {m.teamB.shortName} &bull; Live Match
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {m.status === 'LIVE' ? <LiveBadge /> : <StatusBadge status={m.status} />}
          </div>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-10 space-y-5">
        {/* Match Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-500">
          <span>
            {m.format === 'CUSTOM' ? `${m.totalOvers}-Over Match` : m.format}
            {m.venue ? ` • ${m.venue}` : ' • Turf 01'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400')} />
            <span>{connected ? 'Live Socket Connected' : 'Syncing...'}</span>
          </span>
        </div>

        {/* ===================== WHITE SCOREBOARD CARD (Panel 2 Reference) ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Team A */}
            <div className="flex items-center gap-3.5 w-full md:w-auto justify-center md:justify-start">
              <TeamLogo
                name={m.teamA.name}
                shortName={m.teamA.shortName}
                color={m.teamA.color}
                logoUrl={m.teamA.logoUrl}
                size="xl"
              />
              <div>
                <div className="text-base sm:text-lg font-extrabold text-[#111827]">{m.teamA.name}</div>
                <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {m.teamA.shortName}
                </span>
              </div>
            </div>

            {/* Center Score + CRR / Target */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black text-[#111827] tabular-nums tracking-tight leading-none">
                  {current ? `${current.runs}/${current.wickets}` : 'VS'}
                </div>
                {current && (
                  <div className="text-xs sm:text-sm font-semibold text-gray-500 mt-1.5 tabular-nums">
                    {current.oversDisplay} Overs
                  </div>
                )}
              </div>

              {current && (
                <div className="text-center md:text-left border-l border-gray-200 pl-6 space-y-1 text-xs sm:text-sm">
                  <div className="text-gray-600 font-medium">
                    CRR <b className="text-[#111827] font-extrabold tabular-nums ml-1">{current.runRate.toFixed(2)}</b>
                  </div>
                  {m.target ? (
                    <div className="text-gray-600 font-medium">
                      Target <b className="text-[#7A1426] font-extrabold tabular-nums ml-1">{m.target}</b>
                    </div>
                  ) : (
                    <div className="text-gray-500 font-medium">
                      {batTeam ? `${batTeam.shortName} Batting` : '1st Innings'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-row-reverse items-center gap-3.5 w-full md:w-auto justify-center md:justify-start text-right">
              <TeamLogo
                name={m.teamB.name}
                shortName={m.teamB.shortName}
                color={m.teamB.color}
                logoUrl={m.teamB.logoUrl}
                size="xl"
              />
              <div>
                <div className="text-base sm:text-lg font-extrabold text-[#111827]">{m.teamB.name}</div>
                <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {m.teamB.shortName}
                </span>
              </div>
            </div>
          </div>

          {/* Match Status / Chase Banner */}
          {(m.resultText || m.status === 'INNINGS_BREAK' || m.status === 'PAUSED' || (m.target && current && m.status === 'LIVE') || tossTeam) && (
            <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              {m.status === 'COMPLETED' && m.resultText ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-[#7A1426]">
                  <Trophy className="w-4 h-4" />
                  <span>{m.resultText}</span>
                </span>
              ) : m.status === 'INNINGS_BREAK' ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-800">
                  <Clock className="w-4 h-4" />
                  <span>Innings Break &mdash; Target is {m.target} runs</span>
                </span>
              ) : m.status === 'PAUSED' ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-orange-700">
                  <Pause className="w-4 h-4" />
                  <span>Match paused by officials</span>
                </span>
              ) : m.target && current && m.status === 'LIVE' ? (
                <span className="font-bold text-[#7A1426]">
                  {batTeam?.shortName} need {Math.max(m.target - current.runs, 0)} runs off {payload.live?.ballsRemaining ?? 0} balls (RRR {payload.live?.requiredRunRate ?? '—'})
                </span>
              ) : tossTeam ? (
                <span className="text-gray-600 inline-flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#7A1426]" />
                  <span>
                    {tossTeam.name} won the toss &amp; chose to {m.tossDecision === 'BAT' ? 'bat' : 'bowl'} first
                  </span>
                </span>
              ) : null}
            </div>
          )}
        </section>

        {/* ===================== HORIZONTAL TAB PILLS ===================== */}
        <div className="flex flex-wrap items-center gap-2">
          {tabItems.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border',
                  activeTab === t.key
                    ? 'bg-[#7A1426] border-[#7A1426] text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:text-[#111827] hover:bg-gray-50'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* ===================== TAB 1: LIVE DATA GRID (Panel 2 3-Column Layout) ===================== */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left/Center Main Area (This Over, Last 5 Overs + Batters/Bowler Table) */}
            <div className="lg:col-span-8 space-y-5">
              {current ? (
                <>
                  {/* This Over + Last 5 Overs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
                      <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
                          <span>This Over</span>
                          <span className="text-[11px] font-mono text-gray-500">
                            Over {Math.floor(current.legalBalls / 6) + (live?.overComplete ? 0 : 1)}
                          </span>
                        </div>
                        <BallDotsRow balls={payload.live?.thisOver ?? []} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs">
                      <CardContent className="p-4 space-y-2.5">
                        <div className="text-xs font-bold text-[#111827]">Last 5 Overs</div>
                        {last5Overs.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No completed overs yet</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {last5Overs.map((ov) => (
                              <span
                                key={ov.over}
                                title={`Over ${ov.over}: ${ov.runs} runs, ${ov.wickets} wkt(s)`}
                                className="inline-flex h-8 min-w-[32px] px-2 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-[#111827] tabular-nums"
                              >
                                {ov.runs}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Batting & Bowling Compact Card */}
                  <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                      {/* Batters Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 text-left">Batters</th>
                              <th className="px-3 py-3 text-right">R</th>
                              <th className="px-3 py-3 text-right">B</th>
                              <th className="px-3 py-3 text-right">4s</th>
                              <th className="px-3 py-3 text-right">6s</th>
                              <th className="px-4 py-3 text-right">SR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {[striker, nonStriker].map((b, idx) => {
                              const isStrikerRow = idx === 0 && Boolean(live?.strikerId)
                              return (
                                <tr
                                  key={b?.id ?? idx}
                                  className={cn(
                                    'transition-colors',
                                    isStrikerRow
                                      ? 'bg-[#7A1426] text-white'
                                      : 'bg-white text-[#111827]'
                                  )}
                                >
                                  <td className="px-4 py-3 font-bold text-sm">
                                    {b ? (
                                      <span>
                                        {b.name}
                                        {isStrikerRow ? ' *' : ''}
                                      </span>
                                    ) : (
                                      <span className={isStrikerRow ? 'text-white/75' : 'text-gray-400'}>
                                        Awaiting batter
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-right font-extrabold tabular-nums text-sm">
                                    {b?.runs ?? '—'}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums opacity-90">
                                    {b?.balls ?? '—'}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums opacity-90">
                                    {b?.fours ?? '—'}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums opacity-90">
                                    {b?.sixes ?? '—'}
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums font-bold">
                                    {b ? b.strikeRate.toFixed(1) : '—'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Bowler Table */}
                      <div className="overflow-x-auto border-t border-gray-200">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5 text-left">Bowler</th>
                              <th className="px-3 py-2.5 text-right">O</th>
                              <th className="px-3 py-2.5 text-right">M</th>
                              <th className="px-3 py-2.5 text-right">R</th>
                              <th className="px-3 py-2.5 text-right">W</th>
                              <th className="px-4 py-2.5 text-right">ECO</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white text-[#111827]">
                              <td className="px-4 py-3 font-bold text-sm">{bowlerName}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-semibold">{bowlerOvers}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-600">{bowlerMaidens}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-semibold">{bowlerRuns}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-extrabold text-[#7A1426]">{bowlerWkts}</td>
                              <td className="px-4 py-3 text-right tabular-nums font-bold">{bowlerEcon}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                  Match has not started yet. Check back once toss and opening batters are set.
                </Card>
              )}
            </div>

            {/* Right Column: Vertical Live Commentary Feed */}
            <Card className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <MessageSquareText className="w-4 h-4 text-[#7A1426]" />
                  <span>Live Commentary</span>
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  {current ? `Inn ${current.number}` : ''}
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                {!current || current.commentary.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Ball-by-ball commentary will appear here as deliveries are bowled.
                  </div>
                ) : (
                  current.commentary.slice(0, 20).map((c) => (
                    <div key={c.sequence} className="px-4 py-3 flex items-start gap-2.5 hover:bg-gray-50 transition-colors">
                      <span className="w-8 shrink-0 font-mono text-[11px] font-bold text-gray-500 pt-1">
                        {c.overDisplay}
                      </span>
                      <BallDot ball={{ label: c.kind === 'W' ? 'W' : c.kind === '4' ? '4' : c.kind === '6' ? '6' : String(c.runs), kind: c.kind }} size="sm" />
                      <p className="text-xs text-gray-700 leading-relaxed flex-1">
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ===================== TAB 2: SCORECARD ===================== */}
        {activeTab === 'scorecard' && <ScorecardView payload={payload} />}

        {/* ===================== TAB 3: FULL COMMENTARY ===================== */}
        {activeTab === 'commentary' && (
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-0 divide-y divide-gray-100">
              {payload.innings.every((i) => i.commentary.length === 0) ? (
                <div className="p-12 text-center text-xs text-gray-400">
                  No ball-by-ball commentary recorded yet.
                </div>
              ) : (
                [...payload.innings].reverse().map((inn) => (
                  <div key={inn.number} className="divide-y divide-gray-100">
                    <div className="bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#7A1426] flex items-center justify-between">
                      <span>
                        Innings {inn.number} &mdash; {inn.battingTeamId === m.teamA.id ? m.teamA.name : m.teamB.name}
                      </span>
                      <span className="text-gray-600">{inn.runs}/{inn.wickets} ({inn.oversDisplay} ov)</span>
                    </div>
                    {inn.commentary.map((c) => (
                      <div key={c.sequence} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
                        <span className="w-10 shrink-0 font-mono text-xs font-bold text-gray-500 pt-1">
                          {c.overDisplay}
                        </span>
                        <BallDot ball={{ label: c.kind === 'W' ? 'W' : c.kind === '4' ? '4' : c.kind === '6' ? '6' : String(c.runs), kind: c.kind }} size="sm" />
                        <span className="text-xs sm:text-sm text-gray-800">{c.text}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================== TAB 4: STATISTICS (REAL INNINGS TELEMETRY) ===================== */}
        {activeTab === 'statistics' && (
          <div className="grid gap-5 md:grid-cols-2">
            {payload.innings.length === 0 ? (
              <Card className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
                Match statistics will generate once innings play starts.
              </Card>
            ) : (
              payload.innings.map((inn) => {
                const batName = inn.battingTeamId === m.teamA.id ? m.teamA.name : m.teamB.name
                const totalFours = inn.batting.reduce((sum, b) => sum + b.fours, 0)
                const totalSixes = inn.batting.reduce((sum, b) => sum + b.sixes, 0)
                const boundaryRuns = totalFours * 4 + totalSixes * 6
                const maxOvRuns = Math.max(6, ...inn.overs.map((o) => o.runs))

                return (
                  <Card key={inn.number} className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#111827]">
                        {batName} (Inn {inn.number})
                      </span>
                      <span className="text-xs font-extrabold text-[#7A1426]">
                        {inn.runs}/{inn.wickets} ({inn.oversDisplay} ov)
                      </span>
                    </div>
                    <CardContent className="p-5 space-y-5">
                      {/* Quick Metric Tiles */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                          <div className="text-lg font-extrabold text-[#111827]">{totalFours}</div>
                          <div className="text-[11px] font-semibold text-gray-500">Fours (4s)</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                          <div className="text-lg font-extrabold text-[#7A1426]">{totalSixes}</div>
                          <div className="text-[11px] font-semibold text-gray-500">Sixes (6s)</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                          <div className="text-lg font-extrabold text-emerald-700">{boundaryRuns}</div>
                          <div className="text-[11px] font-semibold text-gray-500">Boundary Runs</div>
                        </div>
                      </div>

                      {/* Over-by-Over Runs Bar Chart */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Runs Per Over
                        </div>
                        {inn.overs.length === 0 ? (
                          <div className="text-xs text-gray-400 italic py-4">No completed or active overs yet.</div>
                        ) : (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {inn.overs.map((ov) => (
                              <div key={ov.over} className="flex items-center gap-2 text-xs">
                                <span className="w-10 shrink-0 font-mono font-bold text-gray-500">Ov {ov.over}</span>
                                <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#7A1426]"
                                    style={{ width: `${Math.min(100, Math.round((ov.runs / maxOvRuns) * 100))}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right font-mono font-bold text-[#111827]">
                                  {ov.runs}R{ov.wickets > 0 ? ` ${ov.wickets}W` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* ===================== TAB 5: MATCH INFO ===================== */}
        {activeTab === 'info' && (
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-6">
              <dl className="grid gap-y-4 gap-x-6 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Fixture</dt>
                  <dd className="font-bold text-sm text-[#111827] mt-0.5">
                    {m.teamA.name} vs {m.teamB.name}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Format</dt>
                  <dd className="font-semibold text-[#111827] mt-0.5">
                    {m.format} ({m.totalOvers} overs per side)
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Venue / Turf</dt>
                  <dd className="font-semibold text-[#111827] mt-0.5">{m.venue || 'Main Stadium'}</dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Toss</dt>
                  <dd className="font-semibold text-[#111827] mt-0.5">
                    {tossTeam
                      ? `${tossTeam.name} elected to ${m.tossDecision === 'BAT' ? 'bat' : 'bowl'} first`
                      : 'Toss pending'}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Started At</dt>
                  <dd className="font-semibold text-[#111827] mt-0.5">{fmtDate(m.startedAt)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-500 uppercase tracking-wider">Status</dt>
                  <dd className="font-bold text-[#7A1426] mt-0.5">{m.status.replace('_', ' ')}</dd>
                </div>
                {m.resultText && (
                  <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                    <dt className="font-bold text-gray-500 uppercase tracking-wider">Official Result</dt>
                    <dd className="font-bold text-sm text-[#7A1426] mt-0.5">{m.resultText}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
