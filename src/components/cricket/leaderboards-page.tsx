'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Award,
  BadgeCheck,
  BarChart3,
  Crown,
  RefreshCcw,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { api, getSocket } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'
import { TeamLogo, PlayerAvatar } from '@/components/cricket/ui-bits'
import { LeaderboardsPageSkeleton } from '@/components/cricket/skeletons'
import { cn } from '@/lib/utils'
import { SeasonDto, TournamentDto } from './player/player-types'

type LeaderboardGroup = 'batting' | 'bowling' | 'fielding' | 'overall'

const CATEGORIES: Array<{ key: string; label: string; group: LeaderboardGroup }> = [
  { key: 'runs', label: 'Most Runs', group: 'batting' },
  { key: 'batting_avg', label: 'Highest Average', group: 'batting' },
  { key: 'strike_rate', label: 'Highest Strike Rate', group: 'batting' },
  { key: 'hundreds', label: 'Most Centuries', group: 'batting' },
  { key: 'fifties', label: 'Most Half-Centuries', group: 'batting' },
  { key: 'sixes', label: 'Most Sixes', group: 'batting' },
  { key: 'wickets', label: 'Most Wickets', group: 'bowling' },
  { key: 'bowling_avg', label: 'Best Bowling Avg', group: 'bowling' },
  { key: 'economy', label: 'Best Economy', group: 'bowling' },
  { key: 'best_bowling', label: 'Best Figures', group: 'bowling' },
  { key: 'catches', label: 'Most Catches', group: 'fielding' },
  { key: 'run_outs', label: 'Most Run-Outs', group: 'fielding' },
  { key: 'player_of_match', label: 'Most POM Awards', group: 'overall' },
  { key: 'all_rounder', label: 'Best All-Rounders', group: 'overall' },
]

interface LeaderboardEntry {
  rank: number
  playerId: string
  playerCode: string | null
  name: string
  role: string
  avatarUrl: string | null
  isVerified: boolean
  team: { id: string; name: string; shortName: string; color: string } | null
  matches: number
  inningsBatted: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  fifties: number
  hundreds: number
  highestScore: number
  battingAverage: number | null
  strikeRate: number
  overs: string
  wickets: number
  runsConceded: number
  bowlingAverage: number | null
  economy: number
  bestBowlingDisplay: string
  catches: number
  runOuts: number
  stumpings: number
  playerOfMatch: number
  allRounderScore: number
}

interface LeaderboardPayload {
  category: string
  scope: string
  qualification: string
  totalVerifiedMatches: number
  totalMatches?: number
  honors?: {
    bestBatsman: LeaderboardEntry | null
    bestBowler: LeaderboardEntry | null
    bestFielder: LeaderboardEntry | null
    playerOfTournament: LeaderboardEntry | null
    mostSixes?: LeaderboardEntry | null
    mostFours?: LeaderboardEntry | null
  }
  entries: LeaderboardEntry[]
}

interface TeamOption {
  id: string
  name: string
  shortName: string
}

const SPOTLIGHT_THEMES = {
  gold: {
    topBar: 'from-[#B45309] via-[#D97706] to-[#F59E0B]',
    iconBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-800',
    statText: 'text-amber-700',
    avatarRing: 'ring-2 ring-amber-500/25',
    highlightBg: 'bg-amber-50/40',
  },
  maroon: {
    topBar: 'from-[#7A1426] via-[#9E1C34] to-[#C89B3C]',
    iconBg: 'bg-[#7A1426] text-white',
    badgeText: 'text-[#7A1426]',
    statText: 'text-[#7A1426]',
    avatarRing: 'ring-2 ring-[#7A1426]/20',
    highlightBg: 'bg-[#7A1426]/[0.03]',
  },
  slate: {
    topBar: 'from-[#121826] via-[#1E293B] to-[#334155]',
    iconBg: 'bg-[#121826] text-white',
    badgeText: 'text-[#121826]',
    statText: 'text-[#121826]',
    avatarRing: 'ring-2 ring-slate-800/15',
    highlightBg: 'bg-slate-50/50',
  },
  teal: {
    topBar: 'from-[#0F766E] via-[#0D9488] to-[#14B8A6]',
    iconBg: 'bg-teal-700 text-white',
    badgeText: 'text-teal-800',
    statText: 'text-teal-700',
    avatarRing: 'ring-2 ring-teal-600/20',
    highlightBg: 'bg-teal-50/40',
  },
} as const

function LeaderboardSpotlightCard({
  title,
  subtitle,
  badgeLabel,
  player,
  accent,
  icon,
  statValue,
  statUnit,
  miniStats,
  emptyText,
  navigate,
}: {
  title: string
  subtitle: string
  badgeLabel: string
  player: LeaderboardEntry | null
  accent: 'gold' | 'maroon' | 'slate' | 'teal'
  icon: React.ReactNode
  statValue: string
  statUnit: string
  miniStats: Array<{ label: string; value: string | number }>
  emptyText: string
  navigate: (to: string) => void
}) {
  const theme = SPOTLIGHT_THEMES[accent]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden flex flex-col transition-all hover:shadow-xs">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', theme.topBar)} />
      <div className={cn('px-4 pt-3.5 pb-3 border-b border-gray-100 flex items-center justify-between gap-2', theme.highlightBg)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', theme.iconBg)}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className={cn('text-xs font-extrabold uppercase tracking-wider truncate', theme.badgeText)}>
              {title}
            </div>
            <div className="text-[11px] text-gray-500 font-medium truncate">{subtitle}</div>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
          {badgeLabel}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {player ? (
          <>
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size="lg" ringClass={theme.avatarRing} />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => navigate(`/players/${encodeURIComponent(player.playerId)}`)}
                  className="font-extrabold text-base text-[#111827] hover:text-[#7A1426] hover:underline cursor-pointer text-left truncate max-w-full block leading-snug"
                >
                  {player.name}
                </button>
                {player.team ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/team/${player.team!.id}`)}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#7A1426] cursor-pointer"
                  >
                    <TeamLogo
                      name={player.team.name}
                      shortName={player.team.shortName}
                      color={player.team.color}
                      size="xs"
                    />
                    <span className="truncate">{player.team.name}</span>
                  </button>
                ) : (
                  <span className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Independent
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F9FB] border border-gray-200/80 p-3 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn('text-2xl font-extrabold tabular-nums leading-none', theme.statText)}>
                    {statValue}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {statUnit}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Leader
                </span>
              </div>

              {miniStats.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200/70">
                  {miniStats.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-xs font-extrabold text-[#111827] tabular-nums">
                        {m.value}
                      </div>
                      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 font-medium leading-relaxed">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

function getPrimaryMetric(category: string, entry: LeaderboardEntry): { value: string | number; label: string } {
  switch (category) {
    case 'batting_avg':
      return { value: entry.battingAverage !== null ? entry.battingAverage.toFixed(1) : '—', label: 'Avg' }
    case 'strike_rate':
      return { value: entry.strikeRate.toFixed(1), label: 'SR' }
    case 'hundreds':
      return { value: entry.hundreds, label: '100s' }
    case 'fifties':
      return { value: entry.fifties, label: '50s' }
    case 'sixes':
      return { value: entry.sixes, label: 'Sixes' }
    case 'wickets':
      return { value: entry.wickets, label: 'Wkts' }
    case 'bowling_avg':
      return { value: entry.bowlingAverage !== null ? entry.bowlingAverage.toFixed(1) : '—', label: 'Bowl Avg' }
    case 'economy':
      return { value: entry.economy.toFixed(2), label: 'Econ' }
    case 'best_bowling':
      return { value: entry.bestBowlingDisplay, label: 'Best' }
    case 'catches':
      return { value: entry.catches, label: 'Catches' }
    case 'run_outs':
      return { value: entry.runOuts, label: 'Run-Outs' }
    case 'player_of_match':
      return { value: entry.playerOfMatch, label: 'POM' }
    case 'all_rounder':
      return { value: entry.allRounderScore, label: 'Pts' }
    case 'runs':
    default:
      return { value: entry.runs, label: 'Runs' }
  }
}

export function LeaderboardsPage({ navigate }: { navigate: (to: string) => void }) {
  const [group, setGroup] = useState<LeaderboardGroup>('batting')
  const [category, setCategory] = useState('runs')
  const [scope, setScope] = useState<'ALL_TIME' | 'SEASON' | 'TOURNAMENT' | 'TEAM'>('ALL_TIME')
  const [seasonId, setSeasonId] = useState('')
  const [tournamentId, setTournamentId] = useState('')
  const [teamId, setTeamId] = useState('')

  const [seasons, setSeasons] = useState<SeasonDto[]>([])
  const [tournaments, setTournaments] = useState<TournamentDto[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [data, setData] = useState<LeaderboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboards = useCallback((silent = false) => {
    if (!silent) setRefreshing(true)
    const params = new URLSearchParams({ category, scope })
    if (scope === 'SEASON' && seasonId) params.set('seasonId', seasonId)
    if (scope === 'TOURNAMENT' && tournamentId) params.set('tournamentId', tournamentId)
    if (scope === 'TEAM' && teamId) params.set('teamId', teamId)

    return api<LeaderboardPayload>(`/api/leaderboards?${params.toString()}`)
      .then((res) => {
        setData(res)
      })
      .catch(() => {
        // preserve previous state if transient error
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [category, scope, seasonId, tournamentId, teamId])

  useEffect(() => {
    Promise.all([
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
      api<TeamOption[]>('/api/teams').catch(() => []),
    ]).then(([s, tr, tm]) => {
      setSeasons(s)
      setTournaments(tr)
      setTeams(tm)
      if (s[0]) setSeasonId(s[0].id)
      if (tr[0]) setTournamentId(tr[0].id)
      if (tm[0]) setTeamId(tm[0].id)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    void fetchLeaderboards(true)
  }, [fetchLeaderboards])

  useEffect(() => {
    const sock = getSocket()
    const onConnect = () => sock.emit('subscribe:matches')
    const onUpdate = () => {
      void fetchLeaderboards(true)
    }
    sock.on('connect', onConnect)
    sock.on('matches:update', onUpdate)
    sock.on('match:update', onUpdate)
    if (sock.connected) sock.emit('subscribe:matches')
    return () => {
      sock.off('connect', onConnect)
      sock.off('matches:update', onUpdate)
      sock.off('match:update', onUpdate)
    }
  }, [fetchLeaderboards])

  const groupCategories = CATEGORIES.filter((c) => c.group === group)

  const handleGroupChange = (g: LeaderboardGroup) => {
    setGroup(g)
    const first = CATEGORIES.find((c) => c.group === g)
    if (first) setCategory(first.key)
  }

  if (loading && !data) {
    return <LeaderboardsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#121826] text-white px-6 py-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4" /> Official Career Rankings &amp; Live Leaders
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Player Leaderboards</h1>
          <p className="text-xs text-gray-300 mt-1">
            Real-time tournament rankings computed from live and verified match scorecards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs shrink-0">
              <div className="text-gray-300">
                {data.totalVerifiedMatches > 0 && data.totalMatches && data.totalVerifiedMatches !== data.totalMatches
                  ? 'Verified / Tracked Matches'
                  : 'Matches Tracked'}
              </div>
              <div className="text-lg font-black tabular-nums">
                {data.totalVerifiedMatches > 0 && data.totalMatches && data.totalVerifiedMatches !== data.totalMatches
                  ? `${data.totalVerifiedMatches} / ${data.totalMatches}`
                  : `${data.totalMatches ?? data.totalVerifiedMatches}`}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => void fetchLeaderboards(false)}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh live leaderboards"
          >
            <RefreshCcw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Tournament Leaders Spotlight Strip */}
      {data?.honors && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <LeaderboardSpotlightCard
            title="Best Batsman"
            subtitle="Highest Run Scorer"
            badgeLabel="Golden Bat"
            player={data.honors.bestBatsman}
            accent="gold"
            icon={<CricketBatIcon size={15} />}
            statValue={data.honors.bestBatsman ? String(data.honors.bestBatsman.runs) : '—'}
            statUnit={data.honors.bestBatsman ? (data.honors.bestBatsman.runs === 1 ? 'Run' : 'Runs') : ''}
            miniStats={
              data.honors.bestBatsman
                ? [
                    { label: 'Balls', value: data.honors.bestBatsman.ballsFaced },
                    { label: 'SR', value: data.honors.bestBatsman.strikeRate.toFixed(1) },
                    { label: '4s / 6s', value: `${data.honors.bestBatsman.fours}/${data.honors.bestBatsman.sixes}` },
                  ]
                : []
            }
            emptyText="Top run scorer appears after batting stats"
            navigate={navigate}
          />
          <LeaderboardSpotlightCard
            title="Tournament MVP"
            subtitle="All-Round Impact"
            badgeLabel="#1 MVP"
            player={data.honors.playerOfTournament}
            accent="maroon"
            icon={<Crown className="w-4 h-4" />}
            statValue={data.honors.playerOfTournament ? String(data.honors.playerOfTournament.allRounderScore) : '—'}
            statUnit={data.honors.playerOfTournament ? (data.honors.playerOfTournament.allRounderScore === 1 ? 'Point' : 'Points') : ''}
            miniStats={
              data.honors.playerOfTournament
                ? [
                    { label: 'Runs', value: data.honors.playerOfTournament.runs },
                    { label: 'Wkts', value: data.honors.playerOfTournament.wickets },
                    {
                      label: 'Fielding',
                      value:
                        data.honors.playerOfTournament.catches +
                        data.honors.playerOfTournament.runOuts +
                        data.honors.playerOfTournament.stumpings,
                    },
                  ]
                : []
            }
            emptyText="Runs, wickets & fielding earn MVP points"
            navigate={navigate}
          />
          <LeaderboardSpotlightCard
            title="Best Bowler"
            subtitle="Most Wickets"
            badgeLabel="Top Wickets"
            player={data.honors.bestBowler}
            accent="slate"
            icon={<CricketBallIcon size={14} variant="white" />}
            statValue={data.honors.bestBowler ? String(data.honors.bestBowler.wickets) : '—'}
            statUnit={data.honors.bestBowler ? (data.honors.bestBowler.wickets === 1 ? 'Wicket' : 'Wickets') : ''}
            miniStats={
              data.honors.bestBowler
                ? [
                    { label: 'Overs', value: data.honors.bestBowler.overs },
                    { label: 'Econ', value: data.honors.bestBowler.economy.toFixed(2) },
                    { label: 'Runs', value: data.honors.bestBowler.runsConceded },
                  ]
                : []
            }
            emptyText="Leading wicket-taker appears on first dismissal"
            navigate={navigate}
          />
          <LeaderboardSpotlightCard
            title="Best Fielder"
            subtitle="Catches & Run Outs"
            badgeLabel="Safe Hands"
            player={data.honors.bestFielder}
            accent="teal"
            icon={<CricketStumpsIcon size={15} broken />}
            statValue={
              data.honors.bestFielder
                ? String(
                    data.honors.bestFielder.catches +
                      data.honors.bestFielder.runOuts +
                      data.honors.bestFielder.stumpings
                  )
                : '—'
            }
            statUnit={
              data.honors.bestFielder
                ? data.honors.bestFielder.catches +
                    data.honors.bestFielder.runOuts +
                    data.honors.bestFielder.stumpings ===
                  1
                  ? 'Dismissal'
                  : 'Dismissals'
                : ''
            }
            miniStats={
              data.honors.bestFielder
                ? [
                    { label: 'Catches', value: data.honors.bestFielder.catches },
                    { label: 'Run-Outs', value: data.honors.bestFielder.runOuts },
                    { label: 'Stumpings', value: data.honors.bestFielder.stumpings },
                  ]
                : []
            }
            emptyText="Leading fielder appears on first catch or run out"
            navigate={navigate}
          />
        </div>
      )}

      {/* Category Group & Filter Bar */}
      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-xl bg-[#F3F4F6] p-1 gap-1">
              {(
                [
                  ['batting', 'Batting', Trophy],
                  ['bowling', 'Bowling', Shield],
                  ['fielding', 'Fielding', Award],
                  ['overall', 'Overall / MVP', BarChart3],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleGroupChange(k)}
                  className={`w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    group === k ? 'bg-[#7A1426] text-white shadow-2xs' : 'text-gray-600 hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={scope} onValueChange={(val) => setScope(val as typeof scope)}>
                <SelectTrigger className="w-full sm:w-auto min-w-[150px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827] h-9">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_TIME">All-Time Career</SelectItem>
                  <SelectItem value="SEASON">Specific Season</SelectItem>
                  <SelectItem value="TOURNAMENT">Specific Tournament</SelectItem>
                  <SelectItem value="TEAM">Specific Team</SelectItem>
                </SelectContent>
              </Select>

              {scope === 'SEASON' && (
                <Select value={seasonId} onValueChange={setSeasonId}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[150px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827] h-9">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {scope === 'TOURNAMENT' && (
                <Select value={tournamentId} onValueChange={setTournamentId}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[150px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827] h-9">
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {scope === 'TEAM' && (
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[150px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827] h-9">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              {groupCategories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    category === c.key
                      ? 'border-[#7A1426] bg-[#7A1426]/10 text-[#7A1426]'
                      : 'border-[#E5E7EB] bg-white text-gray-600 hover:bg-[#F9FAFB]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {data?.qualification && (
              <span className="text-[11px] font-semibold text-gray-500 sm:text-right shrink-0">
                Qualification: {data.qualification}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold text-[#111827]">
            {CATEGORIES.find((c) => c.key === category)?.label ?? 'Leaderboard'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : !data || data.entries.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              No players qualify for this leaderboard under current matches.
            </div>
          ) : (
            <>
              {/* Mobile / Compact Leaderboard Rows (zero horizontal scrolling) */}
              <div className="lg:hidden divide-y divide-gray-100 border-t border-gray-100">
                {data.entries.map((entry) => {
                  const primary = getPrimaryMetric(category, entry)
                  return (
                    <button
                      key={entry.playerId}
                      type="button"
                      onClick={() => navigate(`/players/${entry.playerId}`)}
                      className="w-full text-left px-4 py-3.5 hover:bg-[#F9FAFB] active:bg-gray-100/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#7A1426] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="inline-flex shrink-0 items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full bg-[#7A1426]/10 text-[#7A1426] font-black tabular-nums text-xs">
                            #{entry.rank}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-sm text-[#111827] truncate">{entry.name}</span>
                              {entry.isVerified && (
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-gray-500">
                              {entry.team?.shortName ?? 'Independent'} &bull; {entry.matches} Mat
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg font-black tabular-nums text-[#7A1426] leading-tight">
                            {primary.value}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {primary.label}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[#F9FAFB] border border-gray-100 px-2.5 py-1.5 text-center">
                        {group === 'bowling' ? (
                          <>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Wkts</div>
                              <div className="text-xs font-bold tabular-nums text-[#111827]">{entry.wickets}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Overs</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">{entry.overs}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Econ</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">{entry.economy.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Best</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">{entry.bestBowlingDisplay}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Runs</div>
                              <div className="text-xs font-bold tabular-nums text-[#111827]">{entry.runs}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">Avg</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">
                                {entry.battingAverage !== null ? entry.battingAverage.toFixed(1) : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">SR</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">{entry.strikeRate.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase text-gray-400">POM</div>
                              <div className="text-xs font-semibold tabular-nums text-gray-700">{entry.playerOfMatch}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Desktop Full Leaderboard Table */}
              <div className="hidden lg:block" role="region" aria-label="Player leaderboard rankings">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-y border-[#E5E7EB]">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                      <th className="py-3 pl-5 pr-3 w-14">Rank</th>
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Team</th>
                      <th className="py-3 px-2 text-right">Mat</th>
                      <th className="py-3 px-2 text-right">Runs</th>
                      <th className="py-3 px-2 text-right">Avg</th>
                      <th className="py-3 px-2 text-right">SR</th>
                      <th className="py-3 px-2 text-right">Wkts</th>
                      <th className="py-3 px-2 text-right">Econ</th>
                      <th className="py-3 px-2 text-right">Best</th>
                      <th className="py-3 px-2 text-right">Cat / RO</th>
                      <th className="py-3 pl-2 pr-5 text-right">POM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.entries.map((entry) => {
                      const slug = entry.playerId
                      return (
                        <tr
                          key={entry.playerId}
                          onClick={() => navigate(`/players/${slug}`)}
                          className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                        >
                          <td className="py-3 pl-5 pr-3 font-black tabular-nums text-[#7A1426]">
                            #{entry.rank}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#111827] hover:underline">{entry.name}</span>
                              {entry.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-600">
                            {entry.team?.shortName ?? '—'}
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums">{entry.matches}</td>
                          <td className="py-3 px-2 text-right tabular-nums font-bold text-[#7A1426]">{entry.runs}</td>
                          <td className="py-3 px-2 text-right tabular-nums">
                            {entry.battingAverage !== null ? entry.battingAverage.toFixed(1) : '—'}
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums">{entry.strikeRate.toFixed(1)}</td>
                          <td className="py-3 px-2 text-right tabular-nums font-bold text-[#111827]">{entry.wickets}</td>
                          <td className="py-3 px-2 text-right tabular-nums">{entry.economy.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right tabular-nums">{entry.bestBowlingDisplay}</td>
                          <td className="py-3 px-2 text-right tabular-nums">
                            {entry.catches} / {entry.runOuts}
                          </td>
                          <td className="py-3 pl-2 pr-5 text-right tabular-nums font-bold">{entry.playerOfMatch}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
