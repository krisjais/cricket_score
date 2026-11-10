'use client'

import { useMemo, useState } from 'react'
import {
  Trophy,
  CalendarDays,
  Users,
  ArrowRight,
  Radio,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { MatchCard } from '@/components/cricket/match-card'
import {
  CricketGroundBackdrop,
  CricketBatIcon,
  CricketStumpsIcon,
  CricketBallIcon,
} from '@/components/cricket/cricket-graphics'
import { TeamLogo, StatusBadge } from '@/components/cricket/ui-bits'
import type { MatchSummary } from '@/lib/client'
import { cn } from '@/lib/utils'

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0,
  INNINGS_BREAK: 1,
  PAUSED: 2,
  TOSS_DONE: 3,
  SCHEDULED: 4,
  COMPLETED: 5,
  ABANDONED: 6,
}

export function HomePage({
  matches,
  loading,
  navigate,
}: {
  matches: MatchSummary[]
  loading: boolean
  navigate: (to: string) => void
}) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL')

  const live = useMemo(
    () => matches.filter((m) => m.status === 'LIVE' || m.status === 'PAUSED' || m.status === 'INNINGS_BREAK'),
    [matches]
  )
  const recent = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'COMPLETED')
        .sort((a, b) => (b.endedAt ?? b.createdAt).localeCompare(a.endedAt ?? a.createdAt)),
    [matches]
  )
  const upcoming = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'SCHEDULED' || m.status === 'TOSS_DONE')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [matches]
  )

  const sortedAll = useMemo(() => {
    return [...matches].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 9
      const orderB = STATUS_ORDER[b.status] ?? 9
      if (orderA !== orderB) return orderA - orderB
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [matches])

  const stats = useMemo(() => {
    const completed = matches.filter((m) => m.status === 'COMPLETED').length
    const runs = matches.reduce((sum, m) => sum + m.scores.reduce((s, sc) => s + sc.runs, 0), 0)
    const wickets = matches.reduce((sum, m) => sum + m.scores.reduce((s, sc) => s + sc.wickets, 0), 0)
    return { completed, runs, wickets }
  }, [matches])

  const displayedMatches = useMemo(() => {
    if (filterTab === 'LIVE') return live
    if (filterTab === 'UPCOMING') return upcoming
    if (filterTab === 'COMPLETED') return recent
    return sortedAll
  }, [filterTab, live, upcoming, recent, sortedAll])

  // Featured live match for the spotlight hero (or next scheduled fixture if no live match)
  const featuredLive = live[0] ?? null
  const nextFixture = !featuredLive ? (upcoming[0] ?? recent[0] ?? null) : null

  return (
    <div className="space-y-8">
      {/* ===================== HERO SECTION ===================== */}
      <CricketGroundBackdrop className="border border-[#c59b27]/30 shadow-xl" showPitch={false}>
        <div className="p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-black/75 via-black/55 to-black/75 backdrop-blur-[2px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 text-[#c59b27] text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Trophy className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Season 8 • Official Match Center</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-[1.15] drop-shadow-md">
                Live Cricket Scoring & Match Center
              </h1>

              <p className="text-sm sm:text-base text-[#f8f6f0]/85 leading-relaxed font-normal max-w-xl">
                Real-time ball-by-ball commentary, delivery speeds, live run rates, fall of wickets, and complete tournament scorecards updated instantly.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/matches')}
                  className="bg-[#c59b27] hover:bg-[#b58c20] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <CricketBallIcon size={14} variant="gold" />
                  <span>Browse Fixtures</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/teams')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-white/20 flex items-center gap-2 cursor-pointer active:scale-98 backdrop-blur-xs"
                >
                  <Users className="w-4 h-4 text-[#c59b27]" />
                  <span>Team Squads</span>
                </button>
                <button
                  onClick={() => navigate('/awards')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-white/20 flex items-center gap-2 cursor-pointer active:scale-98 backdrop-blur-xs"
                >
                  <Trophy className="w-4 h-4 text-[#c59b27]" />
                  <span>Awards &amp; Leaders</span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Match Spotlight OR Next Fixture / Tournament Summary */}
            <div className="lg:col-span-5">
              {featuredLive ? (
                /* Active Live Match Spotlight Card */
                (() => {
                  const scoreA = featuredLive.scores.find((s) => s.battingTeamId === featuredLive.teamA.id)
                  const scoreB = featuredLive.scores.find((s) => s.battingTeamId === featuredLive.teamB.id)
                  const currentInningsScore = featuredLive.scores.find((s) => s.number === featuredLive.currentInnings)
                  const isBattingA = currentInningsScore?.battingTeamId === featuredLive.teamA.id
                  const isBattingB = currentInningsScore?.battingTeamId === featuredLive.teamB.id

                  return (
                    <div
                      onClick={() => navigate(`/match/${featuredLive.id}`)}
                      className="group bg-black/50 hover:bg-black/60 border border-[#c59b27]/40 hover:border-[#c59b27] rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl transition-all duration-300 cursor-pointer space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Live Now</span>
                        </span>
                        <span className="text-xs text-white/75 font-semibold">
                          {featuredLive.format === 'CUSTOM' ? `${featuredLive.totalOvers} Over Match` : featuredLive.format}
                          {featuredLive.venue ? ` • ${featuredLive.venue}` : ''}
                        </span>
                      </div>

                      {/* Teams and Scores in Spotlight */}
                      <div className="space-y-3 py-1">
                        {/* Team A */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <TeamLogo
                              name={featuredLive.teamA.name}
                              shortName={featuredLive.teamA.shortName}
                              color={featuredLive.teamA.color}
                              logoUrl={featuredLive.teamA.logoUrl}
                              size="md"
                            />
                            <div className="min-w-0 flex-1 flex items-center gap-2">
                              <span className="font-serif font-bold text-base text-white truncate">
                                {featuredLive.teamA.name}
                              </span>
                              {isBattingA && (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                                  <CricketBatIcon size={10} />
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {scoreA ? (
                              <span className="font-mono font-black text-lg text-white tabular-nums">
                                {scoreA.runs}/{scoreA.wickets}
                                <span className="text-xs text-white/60 ml-1">({scoreA.overs} ov)</span>
                              </span>
                            ) : (
                              <span className="text-xs text-white/60 font-medium">Yet to bat</span>
                            )}
                          </div>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <TeamLogo
                              name={featuredLive.teamB.name}
                              shortName={featuredLive.teamB.shortName}
                              color={featuredLive.teamB.color}
                              logoUrl={featuredLive.teamB.logoUrl}
                              size="md"
                            />
                            <div className="min-w-0 flex-1 flex items-center gap-2">
                              <span className="font-serif font-bold text-base text-white truncate">
                                {featuredLive.teamB.name}
                              </span>
                              {isBattingB && (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                                  <CricketBatIcon size={10} />
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {scoreB ? (
                              <span className="font-mono font-black text-lg text-white tabular-nums">
                                {scoreB.runs}/{scoreB.wickets}
                                <span className="text-xs text-white/60 ml-1">({scoreB.overs} ov)</span>
                              </span>
                            ) : (
                              <span className="text-xs text-white/60 font-medium">Yet to bat</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Link Footer */}
                      <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-300 font-bold group-hover:text-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                          <span>Live Delivery Coverage</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#c59b27] group-hover:translate-x-1 transition-transform">
                          <span>Enter Match Center</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )
                })()
              ) : nextFixture ? (
                /* Next Upcoming Match / Latest Result Spotlight */
                <div
                  onClick={() => navigate(`/match/${nextFixture.id}`)}
                  className="group bg-black/45 hover:bg-black/55 border border-white/20 hover:border-[#c59b27] rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl transition-all duration-300 cursor-pointer space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-bold">
                    <span className="flex items-center gap-2 uppercase tracking-wider text-[#c59b27]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{nextFixture.status === 'COMPLETED' ? 'Latest Result' : 'Upcoming Fixture'}</span>
                    </span>
                    <StatusBadge status={nextFixture.status} />
                  </div>

                  <div className="space-y-3 py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo
                          name={nextFixture.teamA.name}
                          shortName={nextFixture.teamA.shortName}
                          color={nextFixture.teamA.color}
                          logoUrl={nextFixture.teamA.logoUrl}
                          size="md"
                        />
                        <span className="font-serif font-bold text-sm text-white">{nextFixture.teamA.name}</span>
                      </div>
                      <span className="text-xs text-white/60 font-mono">
                        {nextFixture.scores.find((s) => s.battingTeamId === nextFixture.teamA.id)?.runs ?? '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo
                          name={nextFixture.teamB.name}
                          shortName={nextFixture.teamB.shortName}
                          color={nextFixture.teamB.color}
                          logoUrl={nextFixture.teamB.logoUrl}
                          size="md"
                        />
                        <span className="font-serif font-bold text-sm text-white">{nextFixture.teamB.name}</span>
                      </div>
                      <span className="text-xs text-white/60 font-mono">
                        {nextFixture.scores.find((s) => s.battingTeamId === nextFixture.teamB.id)?.runs ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80 group-hover:text-[#c59b27]">
                    <span>{nextFixture.venue || 'Tournament Ground'}</span>
                    <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                      <span>View Fixture</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                /* Fallback Tournament Overview Card */
                <div className="bg-black/40 border border-white/15 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-bold text-white/80">
                    <span className="flex items-center gap-2 uppercase tracking-wider text-[#c59b27]">
                      <Trophy className="w-4 h-4" />
                      <span>Tournament Snapshot</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Season 8</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-serif font-black text-[#c59b27]">{matches.length}</div>
                      <div className="text-[10px] uppercase font-bold text-white/70 mt-0.5">Fixtures</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-serif font-black text-white">{stats.runs}</div>
                      <div className="text-[10px] uppercase font-bold text-white/70 mt-0.5">Total Runs</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-serif font-black text-emerald-400">{stats.wickets}</div>
                      <div className="text-[10px] uppercase font-bold text-white/70 mt-0.5">Wickets</div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/matches')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View All Tournament Fixtures</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CricketGroundBackdrop>

      {/* ===================== TOURNAMENT METRICS PULSE STRIP ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Live Matches */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
              {live.length > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              <span>Live Action</span>
            </div>
            <div className="text-2xl font-serif font-black text-[#111827]">{live.length}</div>
            <div className="text-[11px] text-[#0d3a24] font-semibold truncate">
              {live.length > 0 ? 'Match in progress' : 'Awaiting match toss'}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Radio className={cn('w-5 h-5', live.length > 0 && 'animate-pulse text-emerald-600')} />
          </div>
        </div>

        {/* Metric 2: Total Fixtures */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Fixtures</div>
            <div className="text-2xl font-serif font-black text-[#111827]">{matches.length}</div>
            <div className="text-[11px] text-[#6b7280] truncate">
              {upcoming.length} upcoming • {stats.completed} done
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0d3a24]/10 text-[#0d3a24] flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-[#c59b27]" />
          </div>
        </div>

        {/* Metric 3: Tournament Runs */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Tournament Runs</div>
            <div className="text-2xl font-serif font-black text-[#0d3a24]">{stats.runs}</div>
            <div className="text-[11px] text-[#6b7280] truncate">Cumulative aggregate</div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#c59b27]/15 text-[#c59b27] flex items-center justify-center shrink-0">
            <CricketBatIcon size={22} />
          </div>
        </div>

        {/* Metric 4: Total Wickets */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Total Wickets</div>
            <div className="text-2xl font-serif font-black text-rose-700">{stats.wickets}</div>
            <div className="text-[11px] text-[#6b7280] truncate">Dismissals recorded</div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <CricketStumpsIcon size={20} broken={true} />
          </div>
        </div>
      </div>

      {/* ===================== MATCHES SECTION WITH CLEAN TABS ===================== */}
      <section className="space-y-4">
        {/* Section Header & Tab Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2d5]">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111827]">
              Tournament Match Center
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Select a fixture to access live ball telemetry, wagon wheel data, and full scorecards.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#f4efe6] p-1 rounded-2xl border border-[#e8e2d5] self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterTab('ALL')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterTab === 'ALL'
                  ? 'bg-[#0d3a24] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#0d3a24]'
              )}
            >
              All Matches ({matches.length})
            </button>
            <button
              onClick={() => setFilterTab('LIVE')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                filterTab === 'LIVE'
                  ? 'bg-[#0d3a24] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#0d3a24]'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live ({live.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('UPCOMING')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterTab === 'UPCOMING'
                  ? 'bg-[#0d3a24] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#0d3a24]'
              )}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setFilterTab('COMPLETED')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterTab === 'COMPLETED'
                  ? 'bg-[#0d3a24] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#0d3a24]'
              )}
            >
              Results ({recent.length})
            </button>
          </div>
        </div>

        {/* Fixtures Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#e8e2d5]/60" />
            ))}
          </div>
        ) : displayedMatches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center space-y-2">
            <CalendarDays className="mx-auto h-8 w-8 text-[#9ca3af]" />
            <p className="text-base font-serif font-bold text-[#111827]">
              {filterTab === 'LIVE'
                ? 'No Matches Currently Live'
                : filterTab === 'UPCOMING'
                ? 'No Upcoming Fixtures Scheduled'
                : filterTab === 'COMPLETED'
                ? 'No Matches Concluded Yet'
                : 'No Tournament Fixtures Created'}
            </p>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              {filterTab === 'LIVE'
                ? 'Check upcoming matches or navigate to the Matches tab to view schedule.'
                : 'Administrators can create and schedule matches through the Admin Console.'}
            </p>
            {filterTab !== 'ALL' && (
              <button
                onClick={() => setFilterTab('ALL')}
                className="mt-3 text-xs font-bold text-[#0d3a24] hover:underline cursor-pointer"
              >
                View all fixtures
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {displayedMatches.map((m) => (
              <MatchCard key={m.id} match={m} navigate={navigate} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
