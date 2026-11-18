'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Trophy,
  Users,
  ArrowRight,
  Radio,
  Award,
  Shield,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  BarChart3,
  Flame,
  UserCheck,
  Zap,
} from 'lucide-react'
import { MatchCard } from '@/components/cricket/match-card'
import { AplLogo } from '@/components/cricket/apl-logo'
import { TeamLogo, LiveBadge, StatusBadge } from '@/components/cricket/ui-bits'
import { api, getSocket } from '@/lib/client'
import type { MatchSummary } from '@/lib/client'
import { cn } from '@/lib/utils'

interface StandingsRow {
  teamId: string
  name: string
  shortName: string
  color: string
  logoUrl: string | null
  played: number
  won: number
  lost: number
  tied: number
  noResult: number
  points: number
  nrr: number
  recentForm: ('W' | 'L' | 'T' | 'NR')[]
}

interface LeaderboardLeader {
  rank: number
  playerId: string
  name: string
  role: string
  avatarUrl: string | null
  team: { id: string; name: string; shortName: string; color: string } | null
  runs?: number
  wickets?: number
  strikeRate?: number
  economy?: number
  highestScore?: number
  bestBowlingDisplay?: string
  sixes?: number
}

interface TeamItem {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
  captain?: string | null
  players?: Array<{ id: string; name: string }>
}

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
  const [matchTab, setMatchTab] = useState<'upcoming' | 'recent'>('upcoming')
  const [standings, setStandings] = useState<StandingsRow[]>([])
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [topBatter, setTopBatter] = useState<LeaderboardLeader | null>(null)
  const [topBowler, setTopBowler] = useState<LeaderboardLeader | null>(null)
  const [topSixes, setTopSixes] = useState<LeaderboardLeader | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Categorize matches
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

  // Load standings, teams, and leaderboards asynchronously
  useEffect(() => {
    let alive = true

    const loadAllData = () => {
      // 1. Standings
      api<StandingsRow[]>('/api/standings')
        .then((res) => {
          if (alive && Array.isArray(res)) setStandings(res)
        })
        .catch(() => {
          if (alive) setStandings([])
        })

      // 2. Teams
      api<TeamItem[]>('/api/teams')
        .then((res) => {
          if (alive && Array.isArray(res)) setTeams(res)
        })
        .catch(() => {
          if (alive) setTeams([])
        })

      // 3. Orange Cap (Most Runs)
      api<{ entries: LeaderboardLeader[] }>('/api/leaderboards?category=runs&scope=ALL_TIME')
        .then((res) => {
          if (alive && res?.entries?.[0]) setTopBatter(res.entries[0])
        })
        .catch(() => {})

      // 4. Purple Cap (Most Wickets)
      api<{ entries: LeaderboardLeader[] }>('/api/leaderboards?category=wickets&scope=ALL_TIME')
        .then((res) => {
          if (alive && res?.entries?.[0]) setTopBowler(res.entries[0])
        })
        .catch(() => {})

      // 5. Maximum Sixes
      api<{ entries: LeaderboardLeader[] }>('/api/leaderboards?category=sixes&scope=ALL_TIME')
        .then((res) => {
          if (alive && res?.entries?.[0]) setTopSixes(res.entries[0])
        })
        .catch(() => {})
        .finally(() => {
          if (alive) setDataLoaded(true)
        })
    }

    loadAllData()

    // Real-time updates via Socket.IO
    const sock = getSocket()
    const handleUpdate = () => {
      loadAllData()
    }
    sock.on('matches:update', handleUpdate)

    return () => {
      alive = false
      sock.off('matches:update', handleUpdate)
    }
  }, [])

  // Aggregate tournament statistics
  const totalMatchesCount = matches.length
  const completedMatchesCount = recent.length
  const totalRuns = useMemo(
    () => matches.reduce((acc, m) => acc + m.scores.reduce((sum, s) => sum + s.runs, 0), 0),
    [matches]
  )
  const totalWickets = useMemo(
    () => matches.reduce((acc, m) => acc + m.scores.reduce((sum, s) => sum + s.wickets, 0), 0),
    [matches]
  )

  // Top 4 teams in standings (or fallback from teams)
  const topStandings = useMemo(() => {
    if (standings.length > 0) return standings.slice(0, 4)
    return []
  }, [standings])

  // Display teams (from API or derived from matches)
  const displayTeams = useMemo(() => {
    if (teams.length > 0) return teams.slice(0, 8)
    // Fallback: extract unique teams from matches
    const map = new Map<string, TeamItem>()
    matches.forEach((m) => {
      if (!map.has(m.teamA.id)) {
        map.set(m.teamA.id, {
          id: m.teamA.id,
          name: m.teamA.name,
          shortName: m.teamA.shortName,
          color: m.teamA.color,
          logoUrl: m.teamA.logoUrl,
        })
      }
      if (!map.has(m.teamB.id)) {
        map.set(m.teamB.id, {
          id: m.teamB.id,
          name: m.teamB.name,
          shortName: m.teamB.shortName,
          color: m.teamB.color,
          logoUrl: m.teamB.logoUrl,
        })
      }
    })
    return Array.from(map.values()).slice(0, 8)
  }, [teams, matches])

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#F8F9FA] via-[#F3F4F6] to-[#EAECEF] shadow-sm">
        {/* Background Batsman Graphic */}
        <img
          src="/npl-hero-banner.jpg"
          alt="Alliance Premier League Cricket"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-right select-none pointer-events-none"
        />
        {/* Clean Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9FA] via-[#F8F9FA]/95 to-transparent sm:via-[#F8F9FA]/80" />

        {/* Diagonal Maroon Decorative Accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-0 bottom-0 w-24 bg-gradient-to-b from-[#7A1426]/90 to-[#4A0E18]/90 -skew-x-12 hidden lg:block"
        />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-6">
          {/* Tournament Official Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A1426]/10 border border-[#7A1426]/25 text-[#7A1426] text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#7A1426] animate-pulse" />
              <span>APL 2026 &bull; Season 9 Official Portal</span>
            </span>
            {live.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                {live.length} Live {live.length === 1 ? 'Match' : 'Matches'} Broadcasting
              </span>
            )}
          </div>

          {/* Headline & Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
            <AplLogo size="xl" className="shrink-0 self-start sm:self-center drop-shadow-sm" alt="APL Season 9 Official Crest" />
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight leading-[1.08]">
                Alliance Premier League
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#7A1426]">
                The Premier Turf Cricket Championship 2026
              </p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl leading-relaxed">
                Experience real-time ball-by-ball scoring, live broadcasting, automated points table &amp; NRR calculations, player career leaderboards, and official tournament honors.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {live.length > 0 ? (
              <button
                type="button"
                onClick={() => navigate(`/match/${live[0].id}`)}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Radio className="w-4 h-4 animate-pulse text-rose-300" />
                <span>Watch Live Match ({live[0].venue || 'Turf 01'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/matches')}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Explore Match Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/points-table')}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xs hover:border-[#7A1426]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-[#7A1426]" />
              <span>Points Table</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/leaderboards')}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xs hover:border-[#7A1426]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-[#7A1426]" />
              <span>Leaderboards</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/player/login')}
              className="bg-[#121826] hover:bg-[#1C2438] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Player Portal</span>
            </button>
          </div>
        </div>

        {/* Live Pulse Bar */}
        <div className="relative z-10 border-t border-gray-200/80 bg-white/70 backdrop-blur-xs px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg sm:text-xl font-black text-[#111827] tabular-nums">
              {totalMatchesCount > 0 ? totalMatchesCount : '12+'}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Fixtures Tracked
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-[#7A1426] tabular-nums">
              {teams.length > 0 ? teams.length : '24'}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Clubs Enrolled
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-[#111827] tabular-nums">
              {totalRuns > 0 ? totalRuns : 'Active'}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Runs Scored
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Socket.IO</span>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Live Real-Time Engine
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LIVE MATCHES HUB ===================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#111827] tracking-tight">
                Live Broadcast Center
              </h2>
              <p className="text-xs text-gray-500">Instant ball-by-ball telemetry from tournament venues</p>
            </div>
            {live.length > 0 && <LiveBadge />}
          </div>

          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] transition-colors inline-flex items-center gap-1 cursor-pointer group"
          >
            <span>View All Matches</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-white border border-gray-200" />
            ))}
          </div>
        ) : live.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((m, idx) => {
              const activeInnings =
                m.scores.find((s) => s.number === m.currentInnings) ?? m.scores[m.scores.length - 1]
              const crr = activeInnings ? calcCrr(activeInnings.runs, activeInnings.overs) : '0.00'
              const isBattingA = activeInnings?.battingTeamId === m.teamA.id
              const isBattingB = activeInnings?.battingTeamId === m.teamB.id

              return (
                <article
                  key={m.id}
                  className="relative overflow-hidden bg-white rounded-3xl border-2 border-[#7A1426]/20 shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between gap-5 group"
                >
                  {/* Subtle Top Red Accent Line */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#7A1426] via-[#B91C1C] to-[#7A1426]" />

                  {/* Header: Venue + Live Indicator */}
                  <div className="flex items-center justify-between text-xs font-bold border-b border-gray-100 pb-3">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-[#7A1426]" />
                      <span>{m.venue || `Turf 0${idx + 1}`}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 font-semibold">{m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}</span>
                    </span>
                    <LiveBadge />
                  </div>

                  {/* Teams & Center Scoreboard */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
                    {/* Team A */}
                    <div className="flex flex-col items-center text-center gap-2 min-w-0">
                      <div className="relative">
                        <TeamLogo
                          name={m.teamA.name}
                          shortName={m.teamA.shortName}
                          color={m.teamA.color}
                          logoUrl={m.teamA.logoUrl}
                          size="lg"
                        />
                        {isBattingA && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#7A1426] text-white text-[9px] font-black rounded-full shadow-2xs">
                            BAT
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#111827] truncate w-full">
                        {m.teamA.name}
                      </span>
                    </div>

                    {/* Center Score */}
                    <div className="flex flex-col items-center text-center px-2">
                      <div className="text-3xl sm:text-4xl font-black text-[#111827] tabular-nums tracking-tight leading-none">
                        {activeInnings ? `${activeInnings.runs}/${activeInnings.wickets}` : '0/0'}
                      </div>
                      <div className="text-xs font-bold text-gray-500 mt-1.5 tabular-nums bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {activeInnings ? `${activeInnings.overs} Overs` : '0.0 Overs'}
                      </div>
                      <div className="text-[11px] font-bold text-[#7A1426] mt-2">
                        CRR <b className="font-mono">{crr}</b>
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center text-center gap-2 min-w-0">
                      <div className="relative">
                        <TeamLogo
                          name={m.teamB.name}
                          shortName={m.teamB.shortName}
                          color={m.teamB.color}
                          logoUrl={m.teamB.logoUrl}
                          size="lg"
                        />
                        {isBattingB && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#7A1426] text-white text-[9px] font-black rounded-full shadow-2xs">
                            BAT
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#111827] truncate w-full">
                        {m.teamB.name}
                      </span>
                    </div>
                  </div>

                  {/* Target or Toss Status */}
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center text-xs font-semibold text-gray-700 border border-gray-100">
                    {m.target ? (
                      <span>
                        Target: <b className="text-[#7A1426] font-bold">{m.target} runs</b> ({m.totalOvers} ov max)
                      </span>
                    ) : m.tossWinnerId ? (
                      <span className="text-gray-600">
                        {m.tossWinnerId === m.teamA.id ? m.teamA.shortName : m.teamB.shortName} won toss &amp; chose to{' '}
                        {m.tossDecision?.toLowerCase() || 'bat'}
                      </span>
                    ) : (
                      <span>Live match in progress &bull; Inning {m.currentInnings}</span>
                    )}
                  </div>

                  {/* Watch Live CTA Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/match/${m.id}`)}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#7A1426] to-[#991B1B] hover:from-[#5E0E1D] hover:to-[#7A1426] text-white font-extrabold text-xs sm:text-sm py-3 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Watch Live Match Center &rarr;</span>
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          /* Match Center Spotlight when no game is actively broadcasting */
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7A1426]/10 text-[#7A1426] mx-auto flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">No Live Matches Broadcasting Right Now</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
                All venues are currently between innings or preparing for upcoming fixtures. Check the schedule below or view recent match scorecards.
              </p>
            </div>
            {upcoming.length > 0 && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                <Clock className="w-3.5 h-3.5 text-[#7A1426]" />
                <span>
                  Next Fixture: <b className="text-[#111827]">{upcoming[0].teamA.shortName} vs {upcoming[0].teamB.shortName}</b> ({upcoming[0].venue || 'Turf 01'})
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/matches')}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Browse Full Schedule
              </button>
              <button
                type="button"
                onClick={() => navigate('/points-table')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Check Points Table
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ===================== 4-CARD QUICK FEATURE DECK ===================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/matches')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center shrink-0 group-hover:bg-[#7A1426] group-hover:text-white transition-colors mb-3">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] flex items-center justify-between">
              <span>Match Schedule</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-[#7A1426] transition-all" />
            </div>
            <div className="text-xs text-gray-500 mt-1">Date-wise fixtures &amp; turf allocations</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/points-table')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] flex items-center justify-between">
              <span>Points Table</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
            </div>
            <div className="text-xs text-gray-500 mt-1">Live NRR &amp; playoff qualification race</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/leaderboards')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] flex items-center justify-between">
              <span>Leaderboards</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
            </div>
            <div className="text-xs text-gray-500 mt-1">Orange Cap, Purple Cap &amp; records</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-[#7A1426]/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-3">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-[#111827] flex items-center justify-between">
              <span>Tournament Clubs</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
            </div>
            <div className="text-xs text-gray-500 mt-1">Explore 24 franchises &amp; player squads</div>
          </div>
        </button>
      </section>

      {/* ===================== POINTS TABLE & PLAYOFF RACE SNAPSHOT ===================== */}
      <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#7A1426] mb-0.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>Championship Standings</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
              Race to the Playoff Semifinals
            </h2>
            <p className="text-xs text-gray-500">Top 2 seeds earn direct semi-final qualification</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/points-table')}
            className="text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] transition-colors inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Full 24-Team Table &amp; NRR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topStandings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center w-12">#</th>
                  <th scope="col" className="px-4 py-3">Team</th>
                  <th scope="col" className="px-3 py-3 text-center">P</th>
                  <th scope="col" className="px-3 py-3 text-center">W</th>
                  <th scope="col" className="px-3 py-3 text-center">L</th>
                  <th scope="col" className="px-3 py-3 text-center">NRR</th>
                  <th scope="col" className="px-4 py-3 text-center">PTS</th>
                  <th scope="col" className="px-4 py-3 text-center hidden sm:table-cell">Recent Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topStandings.map((row, idx) => {
                  const isTopTwo = idx < 2
                  return (
                    <tr
                      key={row.teamId}
                      onClick={() => navigate(`/team/${row.teamId}`)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-center font-bold">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]',
                            isTopTwo ? 'bg-emerald-100 text-emerald-800 font-black' : 'text-gray-600'
                          )}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <TeamLogo
                            name={row.name}
                            shortName={row.shortName}
                            color={row.color}
                            logoUrl={row.logoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="font-extrabold text-[#111827]">{row.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{row.shortName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-gray-700">{row.played}</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-600">{row.won}</td>
                      <td className="px-3 py-3 text-center font-bold text-rose-600">{row.lost}</td>
                      <td className="px-3 py-3 text-center font-mono font-semibold">
                        <span className={row.nrr >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-sm text-[#7A1426] tabular-nums">
                        {row.points}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {row.recentForm && row.recentForm.length > 0 ? (
                            row.recentForm.slice(0, 4).map((f, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                                  f === 'W'
                                    ? 'bg-emerald-500 text-white'
                                    : f === 'L'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-gray-400 text-white'
                                )}
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[10px]">&mdash;</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <Trophy className="w-8 h-8 text-gray-300 mx-auto" />
            <div className="text-sm font-bold text-[#111827]">Points Table Standing Active</div>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Standings will populate as match scorecards are finalized by tournament officials.
            </p>
            <button
              type="button"
              onClick={() => navigate('/points-table')}
              className="mt-2 text-xs font-bold text-[#7A1426] hover:underline cursor-pointer"
            >
              View Points Table Rules &amp; Net Run Rate Formula &rarr;
            </button>
          </div>
        )}
      </section>

      {/* ===================== TOURNAMENT CAPS & LEADERS SPOTLIGHT ===================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Tournament Honors</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
              Season 9 Caps &amp; Individual Leaders
            </h2>
            <p className="text-xs text-gray-500">Verified rankings calculated from approved scorecards</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/leaderboards')}
            className="text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>All Rankings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* ORANGE CAP CARD */}
          <article className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                <span>👑 Orange Cap</span>
                <span className="text-amber-100 font-normal">&bull; Most Runs</span>
              </span>
              <span className="text-[11px] font-bold text-amber-700">Batting King</span>
            </div>

            {topBatter ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    {topBatter.name[0]}
                  </div>
                  <div>
                    <div className="text-base font-black text-[#111827]">{topBatter.name}</div>
                    <div className="text-xs text-gray-500 font-semibold">{topBatter.team?.name || 'APL All-Star'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/80 rounded-2xl p-3 border border-amber-100 text-center">
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Runs</div>
                    <div className="text-lg font-black text-amber-600 tabular-nums">{topBatter.runs ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Strike Rate</div>
                    <div className="text-lg font-black text-gray-800 tabular-nums">{topBatter.strikeRate?.toFixed(1) ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Highest</div>
                    <div className="text-lg font-black text-gray-800 tabular-nums">{topBatter.highestScore ?? 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-center">
                <Flame className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-[#111827]">Orange Cap Race Active</div>
                <p className="text-[11px] text-gray-500">Tournament runs are verified live by scorers.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/leaderboards')}
              className="mt-4 w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>View Full Batting Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </article>

          {/* PURPLE CAP CARD */}
          <article className="relative overflow-hidden rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/60 via-white to-purple-50/20 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-600 text-white shadow-xs">
                <span>👑 Purple Cap</span>
                <span className="text-purple-100 font-normal">&bull; Most Wickets</span>
              </span>
              <span className="text-[11px] font-bold text-purple-700">Bowling Master</span>
            </div>

            {topBowler ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    {topBowler.name[0]}
                  </div>
                  <div>
                    <div className="text-base font-black text-[#111827]">{topBowler.name}</div>
                    <div className="text-xs text-gray-500 font-semibold">{topBowler.team?.name || 'APL All-Star'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/80 rounded-2xl p-3 border border-purple-100 text-center">
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Wickets</div>
                    <div className="text-lg font-black text-purple-700 tabular-nums">{topBowler.wickets ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Economy</div>
                    <div className="text-lg font-black text-gray-800 tabular-nums">{topBowler.economy?.toFixed(2) ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Best</div>
                    <div className="text-lg font-black text-gray-800 tabular-nums">{topBowler.bestBowlingDisplay || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto" />
                <div className="text-xs font-bold text-[#111827]">Purple Cap Race Active</div>
                <p className="text-[11px] text-gray-500">Tournament bowling figures tracked ball-by-ball.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/leaderboards')}
              className="mt-4 w-full py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>View Full Bowling Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </article>

          {/* MAXIMUM SIXES / POWER HITTER CARD */}
          <article className="relative overflow-hidden rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#7A1426] text-white shadow-xs">
                <span>💥 Super Sixes</span>
                <span className="text-rose-100 font-normal">&bull; Power Hitter</span>
              </span>
              <span className="text-[11px] font-bold text-[#7A1426]">Maximum Impact</span>
            </div>

            {topSixes ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7A1426] to-[#4A0E18] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    {topSixes.name[0]}
                  </div>
                  <div>
                    <div className="text-base font-black text-[#111827]">{topSixes.name}</div>
                    <div className="text-xs text-gray-500 font-semibold">{topSixes.team?.name || 'APL All-Star'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white/80 rounded-2xl p-3 border border-rose-100 text-center">
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Total Sixes</div>
                    <div className="text-xl font-black text-[#7A1426] tabular-nums">{topSixes.sixes ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase">Strike Rate</div>
                    <div className="text-xl font-black text-gray-800 tabular-nums">{topSixes.strikeRate?.toFixed(1) ?? '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-center">
                <Zap className="w-8 h-8 text-[#7A1426] mx-auto" />
                <div className="text-xs font-bold text-[#111827]">Boundary &amp; Sixes Tracker</div>
                <p className="text-[11px] text-gray-500">Every maximum is recorded and verified in match telemetry.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/awards')}
              className="mt-4 w-full py-2 rounded-xl bg-[#7A1426]/10 hover:bg-[#7A1426] text-[#7A1426] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Explore Tournament Awards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </article>
        </div>
      </section>

      {/* ===================== MATCH CENTER: SCHEDULE & RECENT RESULTS ===================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
              Tournament Match Center
            </h2>
            <p className="text-xs text-gray-500">Switch between upcoming scheduled fixtures and finalized match results</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-gray-200/80 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMatchTab('upcoming')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full transition-all cursor-pointer',
                  matchTab === 'upcoming'
                    ? 'bg-[#7A1426] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111827]'
                )}
              >
                Upcoming Fixtures ({upcoming.length})
              </button>
              <button
                type="button"
                onClick={() => setMatchTab('recent')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full transition-all cursor-pointer',
                  matchTab === 'recent'
                    ? 'bg-[#7A1426] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111827]'
                )}
              >
                Recent Results ({recent.length})
              </button>
            </div>
          </div>
        </div>

        {matchTab === 'upcoming' ? (
          upcoming.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.slice(0, 4).map((m) => (
                <MatchCard key={m.id} match={m} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-bold text-[#111827]">No Upcoming Fixtures Scheduled</div>
              <p className="text-xs text-gray-500">Check the full schedule for newly announced matches.</p>
            </div>
          )
        ) : recent.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.slice(0, 4).map((m) => (
              <MatchCard key={m.id} match={m} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="text-sm font-bold text-[#111827]">No Completed Matches Yet</div>
            <p className="text-xs text-gray-500">Completed match scorecards will appear here immediately after final delivery.</p>
          </div>
        )}
      </section>

      {/* ===================== PARTICIPATING FRANCHISES SHOWCASE ===================== */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#7A1426] mb-0.5">
              <Shield className="w-3.5 h-3.5" />
              <span>The 24 Franchises</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
              Participating Tournament Clubs
            </h2>
            <p className="text-xs text-gray-500">Explore squad rosters, team colors and captain profiles</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/teams')}
            className="text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Franchises</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {displayTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => navigate(`/team/${team.id}`)}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 hover:border-[#7A1426]/50 bg-gray-50/50 hover:bg-white p-4 transition-all hover:shadow-md cursor-pointer flex flex-col items-center text-center gap-2.5"
            >
              {/* Top Team Color Accent Bar */}
              <div
                className="absolute top-0 inset-x-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: team.color || '#7A1426' }}
              />

              <TeamLogo
                name={team.name}
                shortName={team.shortName}
                color={team.color}
                logoUrl={team.logoUrl}
                size="md"
              />

              <div className="w-full">
                <div className="font-extrabold text-xs sm:text-sm text-[#111827] truncate group-hover:text-[#7A1426] transition-colors">
                  {team.name}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {team.shortName}
                </div>
              </div>

              <span className="text-[10px] font-bold text-[#7A1426] group-hover:underline inline-flex items-center gap-0.5">
                <span>View Squad</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== PLAYER CAREER PORTAL CALLOUT BANNER ===================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B1120] p-7 sm:p-10 text-white shadow-xl border border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#7A1426]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Player &amp; Captain Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Playing in Alliance Premier League Season 9?
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
              Claim your verified player badge, track career run tallies, review batting wagon wheels, download match certificates, and submit captain team sheets in Captain&apos;s Corner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/player/login')}
              className="bg-[#7A1426] hover:bg-[#991B1B] text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer active:scale-98"
            >
              Player Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/player/register')}
              className="bg-white hover:bg-gray-100 text-[#111827] font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer active:scale-98"
            >
              Register Profile
            </button>
            <button
              type="button"
              onClick={() => navigate('/player/dashboard?tab=captains')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer"
            >
              Captain&apos;s Corner
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
