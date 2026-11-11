'use client'

import { useMemo } from 'react'
import { CalendarDays, Trophy, Users, ArrowRight, Radio } from 'lucide-react'
import { MatchCard } from '@/components/cricket/match-card'
import { AplLogo } from '@/components/cricket/apl-logo'
import { TeamLogo, LiveBadge } from '@/components/cricket/ui-bits'
import type { MatchSummary } from '@/lib/client'

function calcCrr(runs: number, oversDisplay: string): string {
  const [ovPart, ballPart] = (oversDisplay || '0.0').split('.')
  const totalOvers = Number(ovPart || 0) + Number(ballPart || 0) / 6
  if (!totalOvers || totalOvers <= 0) return '0.00'
  return (runs / totalOvers).toFixed(2)
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
  const live = useMemo(
    () => matches.filter((m) => m.status === 'LIVE' || m.status === 'PAUSED' || m.status === 'INNINGS_BREAK'),
    [matches]
  )
  const upcoming = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'SCHEDULED' || m.status === 'TOSS_DONE')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [matches]
  )
  const recent = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'COMPLETED')
        .sort((a, b) => (b.endedAt ?? b.createdAt).localeCompare(a.endedAt ?? a.createdAt)),
    [matches]
  )

  return (
    <div className="space-y-7">
      {/* ===================== HERO SECTION (Panel 1 Reference) ===================== */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-[#F3F4F6] shadow-sm min-h-[220px] sm:min-h-[260px] flex items-center">
        {/* Background Batsman Image */}
        <img
          src="/npl-hero-banner.jpg"
          alt="Nexcore Premier League Cricket"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-right select-none pointer-events-none"
        />
        {/* Clean Left Readability Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F3F4F6] via-[#F3F4F6]/90 to-transparent sm:via-[#F3F4F6]/75" />

        {/* Diagonal Maroon Decorative Accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-0 bottom-0 w-16 bg-[#7A1426]/85 -skew-x-12 hidden md:block"
        />

        <div className="relative z-10 p-6 sm:p-10 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-7">
          <AplLogo size="xl" className="shrink-0 self-start sm:self-center" alt="APL Season 9 Official Emblem" />
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#111827] tracking-tight leading-[1.12]">
              Nexcore
              <br />
              Premier League
            </h1>
            <p className="text-base sm:text-xl font-medium text-gray-700">
              Cricket Tournament 2026
            </p>
            <p className="text-xs sm:text-sm font-medium text-gray-500 pt-0.5">
              Live Scores &bull; Match Updates &bull; Statistics
            </p>
          </div>
        </div>
      </section>

      {/* ===================== LIVE MATCHES SECTION ===================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
              Live Matches
            </h2>
            {live.length > 0 && <LiveBadge />}
          </div>

          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="text-xs font-semibold text-gray-700 hover:text-[#7A1426] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-white border border-gray-200" />
            ))}
          </div>
        ) : live.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((m, idx) => {
              const activeInnings =
                m.scores.find((s) => s.number === m.currentInnings) ?? m.scores[m.scores.length - 1]
              const crr = activeInnings ? calcCrr(activeInnings.runs, activeInnings.overs) : '0.00'

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4"
                >
                  {/* Card Top: Turf / Venue + Live Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#111827]">
                      {m.venue || `Turf 0${idx + 1}`}
                    </span>
                    <LiveBadge />
                  </div>

                  {/* Teams & Center Score Row */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="flex flex-col items-center text-center gap-1.5 w-[32%]">
                      <TeamLogo
                        name={m.teamA.name}
                        shortName={m.teamA.shortName}
                        color={m.teamA.color}
                        logoUrl={m.teamA.logoUrl}
                        size="lg"
                      />
                      <span className="text-xs sm:text-sm font-bold text-[#111827] truncate w-full">
                        {m.teamA.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] tabular-nums tracking-tight leading-none">
                        {activeInnings ? `${activeInnings.runs}/${activeInnings.wickets}` : '0/0'}
                      </div>
                      <div className="text-xs font-medium text-gray-500 mt-1 tabular-nums">
                        {activeInnings ? `${activeInnings.overs} Overs` : '0.0 Overs'}
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1.5 w-[32%]">
                      <TeamLogo
                        name={m.teamB.name}
                        shortName={m.teamB.shortName}
                        color={m.teamB.color}
                        logoUrl={m.teamB.logoUrl}
                        size="lg"
                      />
                      <span className="text-xs sm:text-sm font-bold text-[#111827] truncate w-full">
                        {m.teamB.name}
                      </span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="text-center text-xs font-semibold text-gray-600">
                    <span>CRR <b className="text-[#111827] font-bold">{crr}</b></span>
                    {m.target ? (
                      <>
                        <span className="mx-2 text-gray-300">&bull;</span>
                        <span>Target <b className="text-[#7A1426] font-bold">{m.target}</b></span>
                      </>
                    ) : (
                      <>
                        <span className="mx-2 text-gray-300">&bull;</span>
                        <span>{m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}</span>
                      </>
                    )}
                  </div>

                  {/* Watch Live Maroon CTA */}
                  <button
                    type="button"
                    onClick={() => navigate(`/match/${m.id}`)}
                    className="w-full rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-xs py-2.5 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Watch Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs space-y-2">
            <Radio className="w-7 h-7 text-[#7A1426] mx-auto opacity-80" />
            <h3 className="text-sm font-bold text-[#111827]">No Live Matches at the Moment</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Check upcoming fixtures below or explore completed match scorecards and standings.
            </p>
          </div>
        )}
      </section>

      {/* ===================== 3 QUICK LINKS CARDS ===================== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate('/matches')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center shrink-0 group-hover:bg-[#7A1426] group-hover:text-white transition-colors">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#111827]">Match Schedule</div>
            <div className="text-xs text-gray-500 mt-0.5">Check upcoming matches</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/points-table')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center shrink-0 group-hover:bg-[#7A1426] group-hover:text-white transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#111827]">Points Table</div>
            <div className="text-xs text-gray-500 mt-0.5">Team standings &amp; awards</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 text-left cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center shrink-0 group-hover:bg-[#7A1426] group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#111827]">Teams</div>
            <div className="text-xs text-gray-500 mt-0.5">View all participating teams</div>
          </div>
        </button>
      </section>

      {/* ===================== UPCOMING & RECENT RESULTS PREVIEW ===================== */}
      {(upcoming.length > 0 || recent.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2 pt-1">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Upcoming Fixtures ({upcoming.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/matches')}
                  className="text-xs font-semibold text-[#7A1426] hover:underline cursor-pointer"
                >
                  Schedule &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {upcoming.slice(0, 2).map((m) => (
                  <MatchCard key={m.id} match={m} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Recent Results ({recent.length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/matches')}
                  className="text-xs font-semibold text-[#7A1426] hover:underline cursor-pointer"
                >
                  All Results &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {recent.slice(0, 2).map((m) => (
                  <MatchCard key={m.id} match={m} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
