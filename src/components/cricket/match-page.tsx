'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  MapPin,
  Trophy,
  Pause,
  Clock,
  ChevronLeft,
  Coins,
  Radio,
  Flame,
} from 'lucide-react'
import { BallDotsRow, StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { ScorecardView } from '@/components/cricket/scorecard-view'
import {
  CricketGroundBackdrop,
  PitchCreaseVisualizer,
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'
import { useMatchChannel, fmtDate } from '@/lib/client'
import { cn } from '@/lib/utils'

export function MatchPage({ matchId, navigate }: { matchId: string; navigate: (to: string) => void }) {
  const { state: payload, connected } = useMatchChannel(matchId, null)

  if (!payload || !payload.match || !Array.isArray(payload.innings)) {
    return (
      <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-16 text-center">
        <p className="text-base font-bold text-[#111827]">Match not found.</p>
        <button
          onClick={() => navigate('/matches')}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>
      </div>
    )
  }

  const m = payload.match
  const current = payload.innings?.find((i) => i.number === m.currentInnings && i.live !== null) ?? null
  const batTeam = current ? (current.battingTeamId === m.teamA.id ? m.teamA : m.teamB) : null
  const bowlTeam = current ? (current.bowlingTeamId === m.teamA.id ? m.teamA : m.teamB) : null
  const striker = current?.batting.find((b) => b.id === current.live?.strikerId)
  const nonStriker = current?.batting.find((b) => b.id === current.live?.nonStrikerId)
  const bowlerCard = current?.bowling.find((b) => b.id === current.live?.bowlerId)
  const bowlerOption = payload.live?.bowlers.find((b) => b.id === current?.live?.bowlerId)
  const bowlerName = bowlerCard?.name ?? bowlerOption?.name
  const bowlerFigures = bowlerCard
    ? `${bowlerCard.overs}-${bowlerCard.maidens}-${bowlerCard.runsConceded}-${bowlerCard.wickets}`
    : bowlerOption
    ? `${bowlerOption.overs}-0-${bowlerOption.runs}-${bowlerOption.wickets}`
    : undefined
  const live = current?.live ?? null
  const tossTeam = m.tossWinnerId ? (m.tossWinnerId === m.teamA.id ? m.teamA : m.teamB) : null

  return (
    <div className="space-y-6">
      {/* Back to matches */}
      <div>
        <button
          onClick={() => navigate('/matches')}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#6b7280] hover:text-[#0d3a24] transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span>Back to Matches</span>
        </button>
      </div>

      {/* Scoreboard Header Banner with Cricket Ground Backdrop (Auction + Cricket Theme) */}
      <CricketGroundBackdrop className="border border-[#c59b27]/40 shadow-xl">
        <div className="p-6 sm:p-8 space-y-5 bg-gradient-to-b from-black/55 via-black/35 to-black/60 backdrop-blur-[2px]">
          {/* Top meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#f8f6f0]/85">
            <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-[#c59b27]">
              <span className="bg-black/40 px-2.5 py-1 rounded-md border border-[#c59b27]/40">
                {m.format === 'CUSTOM' ? `${m.totalOvers} Over Match` : m.format}
              </span>
              {m.venue && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-[#f8f6f0]/90 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#c59b27]" />
                    <span>{m.venue}</span>
                  </span>
                </>
              )}
            </span>

            <div className="flex items-center gap-3">
              {connected ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[11px] backdrop-blur-xs">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span>Live Broadcast Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 font-bold text-[11px] backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Connecting Feed...</span>
                </span>
              )}
              <StatusBadge status={m.status} />
            </div>
          </div>

          {/* Teams and current score */}
          <div className="flex items-center justify-between gap-4 py-3">
            <TeamSide team={m.teamA} align="left" />
            <div className="text-center bg-black/40 py-2.5 px-6 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="text-3xl sm:text-5xl font-serif font-black text-white tabular-nums tracking-tight drop-shadow-md">
                {current ? `${current.runs}/${current.wickets}` : 'VS'}
              </div>
              {current && (
                <div className="text-xs font-mono font-bold text-[#c59b27] uppercase tracking-widest mt-1">
                  Over {current.oversDisplay}
                </div>
              )}
            </div>
            <TeamSide team={m.teamB} align="right" />
          </div>

          {/* Target Chase Progress Bar */}
          {m.target && current && (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 backdrop-blur-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-[#c59b27]">
                  <CricketBallIcon size={14} variant="gold" />
                  <span>Chasing Target: <b>{m.target}</b></span>
                </span>
                <span className="font-mono text-emerald-300">
                  {Math.max(m.target - current.runs, 0)} runs needed off {payload.live?.ballsRemaining ?? 0} balls
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-[#c59b27] to-amber-300 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.round((current.runs / m.target) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Individual Innings Score Tiles */}
          <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-white/10">
            {m.scores.map((s) => {
              const team = s.battingTeamId === m.teamA.id ? m.teamA : m.teamB
              const isCurrent = m.status === 'LIVE' && s.number === m.currentInnings
              return (
                <div
                  key={s.number}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all',
                    isCurrent
                      ? 'bg-black/50 border border-[#c59b27] text-white shadow-md'
                      : 'bg-black/30 text-[#f8f6f0]/85 border border-white/10'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="sm" />
                    <span>{team.shortName}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-[#c59b27] bg-[#c59b27]/30 px-2 py-0.5 rounded-md border border-[#c59b27]/50">
                        Batting
                      </span>
                    )}
                  </span>
                  <span className="font-extrabold tabular-nums text-sm">
                    {s.runs}/{s.wickets}
                    <span className="ml-1.5 text-xs font-normal text-white/60">({s.overs} ov)</span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* Match situation / result status banner */}
          <div className="pt-1 text-xs">
            {m.status === 'LIVE' && current && batTeam && bowlTeam && (
              <div className="bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 font-medium text-emerald-200 flex flex-wrap items-center justify-between gap-2 backdrop-blur-xs">
                <span>
                  <b>{batTeam.shortName}</b> batting • Current Run Rate: <b className="text-white font-mono">{current.runRate.toFixed(2)}</b>
                </span>
                {m.target && payload.live && (
                  <span className="text-[#c59b27] font-bold">
                    Req Rate: <b className="text-white font-mono">{payload.live.requiredRunRate ?? '—'}</b>
                  </span>
                )}
              </div>
            )}
            {m.status === 'COMPLETED' && m.resultText && (
              <div className="bg-[#c59b27]/30 border border-[#c59b27]/50 rounded-xl px-4 py-2.5 font-bold text-[#f8f6f0] flex items-center gap-2 backdrop-blur-xs shadow-sm">
                <Trophy className="h-4 w-4 text-[#c59b27]" aria-hidden />
                <span>{m.resultText}</span>
              </div>
            )}
            {m.status === 'INNINGS_BREAK' && (
              <div className="bg-amber-500/25 border border-amber-400/40 rounded-xl px-4 py-2.5 font-bold text-amber-200 flex items-center gap-2 backdrop-blur-xs">
                <Clock className="h-4 w-4" aria-hidden />
                <span>Innings Break — Target is {m.target} runs</span>
              </div>
            )}
            {m.status === 'PAUSED' && (
              <div className="bg-orange-500/25 border border-orange-400/40 rounded-xl px-4 py-2.5 font-bold text-orange-200 flex items-center gap-2 backdrop-blur-xs">
                <Pause className="h-4 w-4" aria-hidden />
                <span>Match paused by tournament officials</span>
              </div>
            )}
            {(m.status === 'SCHEDULED' || m.status === 'TOSS_DONE') && (
              <p className="text-white/80">
                {tossTeam
                  ? `${tossTeam.name} won the toss and elected to ${m.tossDecision === 'BAT' ? 'bat' : 'bowl'} first`
                  : 'Toss yet to take place.'}
              </p>
            )}
          </div>
        </div>
      </CricketGroundBackdrop>

      {/* Tabs Layout */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="bg-[#f4efe6] border border-[#e8e2d5] p-1 rounded-2xl h-auto gap-1">
          <TabsTrigger
            value="live"
            className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-[#0d3a24] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            Live Center
          </TabsTrigger>
          <TabsTrigger
            value="scorecard"
            className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-[#0d3a24] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            Full Scorecard
          </TabsTrigger>
          <TabsTrigger
            value="commentary"
            className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-[#0d3a24] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            Ball-by-Ball
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-[#0d3a24] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            Match Info
          </TabsTrigger>
        </TabsList>

        {/* ---------- LIVE CENTER ---------- */}
        <TabsContent value="live" className="space-y-4">
          {current && live && batTeam ? (
            <>
              {/* 22-Yard Pitch Crease Visualizer (Broadcast Style) */}
              <PitchCreaseVisualizer
                strikerName={striker?.name}
                strikerRuns={striker?.runs}
                strikerBalls={striker?.balls}
                nonStrikerName={nonStriker?.name}
                nonStrikerRuns={nonStriker?.runs}
                nonStrikerBalls={nonStriker?.balls}
                bowlerName={bowlerName}
                bowlerFigures={bowlerFigures}
                lastBallLabel={payload.live?.thisOver?.slice(-1)[0]?.label}
              />

              {/* Batters at crease */}
              <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead className="bg-[#f4efe6] border-b border-[#e8e2d5]">
                      <tr className="text-left font-bold text-[#0d3a24] uppercase tracking-wider">
                        <th className="px-5 py-3">
                          <span className="flex items-center gap-1.5">
                            <CricketBatIcon size={14} />
                            <span>Batter at Crease</span>
                          </span>
                        </th>
                        <th className="px-3 py-3 text-right">R</th>
                        <th className="px-3 py-3 text-right">B</th>
                        <th className="px-3 py-3 text-right">4s</th>
                        <th className="px-3 py-3 text-right">6s</th>
                        <th className="px-5 py-3 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8e2d5]">
                      {[striker, nonStriker].map((b, idx) => (
                        <tr key={b?.id ?? idx} className={cn('hover:bg-[#f8f6f0]', idx === 0 && 'bg-emerald-50/50')}>
                          <td className="px-5 py-3 font-bold text-sm text-[#111827]">
                            {b ? (
                              <span className="flex items-center gap-2">
                                <span>{b.name}</span>
                                {idx === 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[#0d3a24] font-black text-xs bg-[#c59b27]/20 border border-[#c59b27]/40 px-1.5 py-0.2 rounded-md">
                                    <CricketBatIcon size={11} />
                                    <span>*</span>
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[#9ca3af]">Awaiting batter</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-black tabular-nums text-sm text-[#0d3a24]">{b?.runs ?? '—'}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-[#6b7280]">{b?.balls ?? '—'}</td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold">
                            {b?.fours !== undefined ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                {b.fours}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-[#c59b27]">
                            {b?.sixes !== undefined ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200">
                                {b.sixes}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-bold">{b ? b.strikeRate.toFixed(1) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Bowler & Rate Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e2d5] bg-[#faf8f5] px-5 py-3 text-xs">
                    <span className="flex items-center gap-2">
                      <CricketBallIcon size={14} variant="red" />
                      <span className="font-bold text-[#6b7280] uppercase tracking-wider text-[11px]">Active Bowler:</span>
                      <span className="font-bold text-[#111827]">{bowlerName ?? '—'}</span>
                      <span className="tabular-nums text-[#6b7280] font-medium ml-1">
                        {bowlerFigures ? `(${bowlerFigures})` : ''}
                      </span>
                    </span>

                    <span className="flex gap-4 text-xs font-semibold text-[#6b7280]">
                      <span>Current RR: <b className="text-[#0d3a24] tabular-nums font-mono">{current.runRate.toFixed(2)}</b></span>
                      {m.target && payload.live?.requiredRunRate != null && (
                        <span>Required RR: <b className="text-[#c59b27] tabular-nums font-mono">{payload.live.requiredRunRate}</b></span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* This Over Deliveries */}
              <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                  <span>This Over Deliveries</span>
                  <span className="tabular-nums font-bold text-[#111827]">
                    Over {Math.floor(current.legalBalls / 6) + (live.overComplete ? 0 : 1)}
                  </span>
                </div>
                <BallDotsRow balls={payload.live?.thisOver ?? []} />
                {live.overComplete && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                    <Coins className="h-4 w-4" aria-hidden />
                    <span>Over complete — awaiting bowler change for the next over.</span>
                  </p>
                )}
              </Card>

              {/* Recent Overs */}
              {current.overs.length > 1 && (
                <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs p-5 space-y-3">
                  <div className="text-xs font-bold tracking-wider text-[#6b7280] uppercase">Recent Overs</div>
                  {[...current.overs]
                    .slice(-5, -1)
                    .reverse()
                    .map((o) => (
                      <div key={o.over} className="flex items-center gap-4 text-xs border-b border-[#e8e2d5] pb-2 last:border-0 last:pb-0">
                        <span className="w-14 shrink-0 font-bold text-[#6b7280] uppercase tracking-wider tabular-nums">
                          Over {o.over}
                        </span>
                        <BallDotsRow balls={o.balls} size="sm" />
                        <span className="ml-auto font-bold tabular-nums text-[#111827]">
                          {o.runs} run{o.runs === 1 ? '' : 's'}
                          {o.wickets > 0 ? `, ${o.wickets} wkt${o.wickets > 1 ? 's' : ''}` : ''}
                        </span>
                      </div>
                    ))}
                </Card>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center text-xs text-[#6b7280]">
              {m.status === 'COMPLETED' || m.status === 'ABANDONED'
                ? 'This match has concluded. Please see the Full Scorecard tab.'
                : m.status === 'INNINGS_BREAK'
                  ? `Innings break — second innings starts soon. Chasing Target: ${m.target}`
                  : 'Scoring will commence when the match starts.'}
            </div>
          )}
        </TabsContent>

        {/* ---------- SCORECARD ---------- */}
        <TabsContent value="scorecard">
          <ScorecardView payload={payload} />
        </TabsContent>

        {/* ---------- COMMENTARY ---------- */}
        <TabsContent value="commentary" className="space-y-4">
          {payload.innings.some((i) => i.commentary.length > 0) ? (
            [...payload.innings].reverse().map((inn) => {
              const bTeam = inn.battingTeamId === m.teamA.id ? m.teamA : m.teamB
              return (
                <Card key={inn.number} className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
                  <div className="bg-[#faf8f5] border-b border-[#e8e2d5] p-4 flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#111827]">
                      {bTeam.shortName} Innings {inn.number} Commentary
                    </span>
                    <span className="font-black tabular-nums text-xs text-[#0d3a24]">
                      {inn.runs}/{inn.wickets} ({inn.oversDisplay} ov)
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <ol className="space-y-3">
                      {inn.commentary.slice(0, 40).map((c) => (
                        <li key={c.sequence} className="flex gap-3 text-xs items-center">
                          <span className="w-10 shrink-0 text-right font-bold text-[#6b7280] tabular-nums">
                            {c.overDisplay}
                          </span>
                          <BallDotInline kind={c.kind} />
                          <span className={cn('text-[#374151]', c.kind === 'W' && 'font-bold text-rose-700', (c.kind === '4' || c.kind === '6') && 'font-bold text-[#0d3a24]')}>
                            {c.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center text-xs text-[#6b7280]">
              Ball-by-ball commentary appears here once deliveries are bowled.
            </div>
          )}
        </TabsContent>

        {/* ---------- INFO ---------- */}
        <TabsContent value="info">
          <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
            <div className="bg-[#faf8f5] border-b border-[#e8e2d5] p-4">
              <h2 className="font-serif font-bold text-sm text-[#111827]">Tournament Match Information</h2>
            </div>
            <CardContent className="p-5">
              <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3 text-xs">
                <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Fixture</dt>
                <dd className="font-bold text-[#111827]">{m.teamA.name} vs {m.teamB.name}</dd>

                <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Format</dt>
                <dd className="font-medium text-[#374151]">{m.format === 'CUSTOM' ? `Custom • ${m.totalOvers} overs` : `${m.format} • ${m.totalOvers} overs`}</dd>

                <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Venue</dt>
                <dd className="flex items-center gap-1 font-medium text-[#374151]">
                  <MapPin className="h-3.5 w-3.5 text-[#0d3a24]" aria-hidden /> {m.venue ?? 'Venue to be confirmed'}
                </dd>

                <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Toss</dt>
                <dd className="font-medium text-[#374151]">
                  {tossTeam
                    ? `${tossTeam.name} won the toss and elected to ${m.tossDecision === 'BAT' ? 'bat' : 'bowl'} first`
                    : 'Toss pending'}
                </dd>

                <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Match Status</dt>
                <dd className="font-bold text-[#0d3a24]">{m.status.replace('_', ' ')}</dd>

                {m.resultText && (
                  <>
                    <dt className="font-bold text-[#6b7280] uppercase tracking-wider">Result</dt>
                    <dd className="font-bold text-[#c59b27] flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-[#c59b27]" />
                      <span>{m.resultText}</span>
                    </dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TeamSide({
  team,
  align,
}: {
  team: { id: string; name: string; shortName: string; color: string; logoUrl?: string | null }
  align: 'left' | 'right'
}) {
  return (
    <div className={cn('flex items-center gap-3', align === 'right' && 'flex-row-reverse text-right')}>
      <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="lg" />
      <div className="min-w-0">
        <div className="truncate text-base font-serif font-black tracking-tight sm:text-lg">{team.shortName}</div>
        <div className="hidden truncate text-xs text-[#f8f6f0]/70 sm:block">{team.name}</div>
      </div>
    </div>
  )
}

function BallDotInline({ kind }: { kind: string }) {
  const style =
    kind === 'W'
      ? 'bg-rose-700 text-white'
      : kind === '4'
        ? 'bg-emerald-700 text-white'
        : kind === '6'
          ? 'bg-[#c59b27] text-white'
          : kind === 'extra'
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-[#f4efe6] text-[#6b7280] border border-[#e8e2d5]'
  const label = kind === 'W' ? 'W' : kind === '4' ? '4' : kind === '6' ? '6' : kind === 'extra' ? 'x' : '•'
  return (
    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', style)} aria-hidden>
      {label}
    </span>
  )
}
