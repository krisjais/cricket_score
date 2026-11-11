'use client'

import { useEffect, useState } from 'react'
import { Award, BadgeCheck, BarChart3, Shield, Trophy } from 'lucide-react'
import { api } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  sixes: number
  fifties: number
  hundreds: number
  highestScore: number
  battingAverage: number | null
  strikeRate: number
  overs: string
  wickets: number
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
  entries: LeaderboardEntry[]
}

interface TeamOption {
  id: string
  name: string
  shortName: string
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
    let alive = true
    const params = new URLSearchParams({ category, scope })
    if (scope === 'SEASON' && seasonId) params.set('seasonId', seasonId)
    if (scope === 'TOURNAMENT' && tournamentId) params.set('tournamentId', tournamentId)
    if (scope === 'TEAM' && teamId) params.set('teamId', teamId)

    api<LeaderboardPayload>(`/api/leaderboards?${params.toString()}`)
      .then((res) => {
        if (alive) setData(res)
      })
      .catch(() => {
        if (alive) setData(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [category, scope, seasonId, tournamentId, teamId])

  const groupCategories = CATEGORIES.filter((c) => c.group === group)

  const handleGroupChange = (g: LeaderboardGroup) => {
    setGroup(g)
    const first = CATEGORIES.find((c) => c.group === g)
    if (first) setCategory(first.key)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#121826] text-white px-6 py-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4" /> Official Career Rankings
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Player Leaderboards</h1>
          <p className="text-xs text-gray-300 mt-1">
            Computed exclusively from finalized &amp; admin-verified match scorecards with minimum qualification criteria.
          </p>
        </div>
        {data && (
          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs shrink-0">
            <div className="text-gray-300">Verified Matches In Scope</div>
            <div className="text-lg font-black tabular-nums">{data.totalVerifiedMatches}</div>
          </div>
        )}
      </div>

      {/* Category Group & Filter Bar */}
      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-[#F3F4F6] p-1 gap-1">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                    group === k ? 'bg-[#7A1426] text-white shadow-2xs' : 'text-gray-600 hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
                className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827] focus:border-[#7A1426] focus:outline-none"
              >
                <option value="ALL_TIME">All-Time Career</option>
                <option value="SEASON">Specific Season</option>
                <option value="TOURNAMENT">Specific Tournament</option>
                <option value="TEAM">Specific Team</option>
              </select>

              {scope === 'SEASON' && (
                <select
                  aria-label="Select season"
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827]"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </option>
                  ))}
                </select>
              )}

              {scope === 'TOURNAMENT' && (
                <select
                  aria-label="Select tournament"
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827]"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              {scope === 'TEAM' && (
                <select
                  aria-label="Select team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-bold text-[#111827]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
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
            {data?.qualification && (
              <span className="ml-auto text-[11px] font-semibold text-gray-500">
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
          ) : (
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Player leaderboard rankings">
              <table className="w-full min-w-[740px] text-left text-xs">
                <thead className="bg-[#F9FAFB] border-y border-[#E5E7EB]">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                    <th className="py-3 pl-5 pr-3 w-14">Rank</th>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-2.5 text-right">Mat</th>
                    <th className="py-3 px-2.5 text-right">Runs</th>
                    <th className="py-3 px-2.5 text-right">Avg</th>
                    <th className="py-3 px-2.5 text-right">SR</th>
                    <th className="py-3 px-2.5 text-right">Wkts</th>
                    <th className="py-3 px-2.5 text-right">Econ</th>
                    <th className="py-3 px-2.5 text-right">Best</th>
                    <th className="py-3 px-2.5 text-right">Cat / RO</th>
                    <th className="py-3 pl-2.5 pr-5 text-right">POM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!data || data.entries.length === 0) ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-gray-400">
                        No players qualify for this leaderboard under current verified matches.
                      </td>
                    </tr>
                  ) : (
                    data.entries.map((entry) => {
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
                          <td className="py-3 px-2.5 text-right tabular-nums">{entry.matches}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#7A1426]">{entry.runs}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">
                            {entry.battingAverage !== null ? entry.battingAverage.toFixed(1) : '—'}
                          </td>
                          <td className="py-3 px-2.5 text-right tabular-nums">{entry.strikeRate.toFixed(1)}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#111827]">{entry.wickets}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">{entry.economy.toFixed(2)}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">{entry.bestBowlingDisplay}</td>
                          <td className="py-3 px-2.5 text-right tabular-nums">
                            {entry.catches} / {entry.runOuts}
                          </td>
                          <td className="py-3 pl-2.5 pr-5 text-right tabular-nums font-bold">{entry.playerOfMatch}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
