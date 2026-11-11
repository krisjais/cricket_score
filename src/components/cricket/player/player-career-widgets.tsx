'use client'

import { useState } from 'react'
import {
  Award,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Shield,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamLogo } from '@/components/cricket/ui-bits'
import {
  CareerBreakdownRow,
  PlayerCareerStatDto,
  PlayerMatchHistoryRow,
  PlayerProfileDto,
  TeamMembershipDto,
  fmtDate,
  formatCricketLabel,
} from './player-types'

function StatKpi({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 transition-colors ${
        highlight
          ? 'border-[#7A1426]/60 bg-[#7A1426]/20 text-white'
          : 'border-white/10 bg-white/[0.04] text-white'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{label}</div>
      <div className="mt-1 text-xl sm:text-2xl font-black tabular-nums tracking-tight leading-none">{value}</div>
    </div>
  )
}

function CardSpotlightMetric({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 ${
        accent ? 'border-[#7A1426]/20 bg-[#7A1426]/[0.04]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-black tabular-nums tracking-tight leading-none ${
          accent ? 'text-[#7A1426]' : 'text-[#111827]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  prominent = false,
}: {
  label: string
  value: string | number
  prominent?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0 text-xs sm:text-[13px]">
      <span className="text-gray-600 font-medium">{label}</span>
      <span
        className={`tabular-nums shrink-0 ${
          prominent ? 'text-sm sm:text-[15px] font-black text-[#111827]' : 'font-bold text-[#111827]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function PlayerDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading player career dashboard">
      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl bg-[#121826] border border-[#1E293B] p-5 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 shrink-0" />
            <div className="space-y-2.5 min-w-0 flex-1 max-w-md">
              <div className="h-6 w-48 sm:w-64 rounded-lg bg-white/15" />
              <div className="h-3.5 w-40 sm:w-56 rounded-md bg-white/10" />
              <div className="h-7 w-44 rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-32 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[68px] rounded-2xl bg-white/[0.06] border border-white/10 p-3.5 space-y-2">
              <div className="h-2.5 w-14 rounded bg-white/10" />
              <div className="h-5 w-10 rounded bg-white/15" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="h-12 rounded-2xl bg-white border border-[#E5E7EB] px-3 flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-24 sm:w-28 rounded-xl bg-gray-100" />
        ))}
      </div>

      {/* Three Career Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 ${
              idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-14 rounded-xl bg-gray-100" />
              <div className="h-14 rounded-xl bg-gray-100" />
            </div>
            <div className="space-y-2.5 pt-1">
              {Array.from({ length: 6 }).map((__, r) => (
                <div key={r} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <div className="h-3 w-28 rounded bg-gray-100" />
                  <div className="h-3.5 w-10 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Form Strip Skeleton */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4">
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PlayerOverviewHero({
  player,
  career,
  currentMembership,
  rightSlot,
  compact = false,
}: {
  player: PlayerProfileDto
  career: PlayerCareerStatDto | null | undefined
  currentMembership: TeamMembershipDto | null | undefined
  rightSlot?: React.ReactNode
  compact?: boolean
}) {
  const c = career
  const batAvg = c?.battingAverage !== null && c?.battingAverage !== undefined ? c.battingAverage.toFixed(2) : '—'

  return (
    <section
      aria-label="Player Profile Header"
      className={`rounded-3xl bg-[#121826] text-white shadow-sm border border-[#1E293B] ${
        compact ? 'px-5 py-4 sm:px-6 sm:py-5' : 'px-5 py-5 sm:px-7 sm:py-6'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              width={compact ? 56 : 80}
              height={compact ? 56 : 80}
              fetchPriority={compact ? 'auto' : 'high'}
              className={`block aspect-square rounded-2xl object-cover border-2 border-white/20 shrink-0 ${
                compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
              }`}
            />
          ) : (
            <div
              className={`rounded-2xl bg-[#7A1426] border-2 border-white/20 flex items-center justify-center font-black text-white shrink-0 ${
                compact ? 'w-14 h-14 text-lg' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl'
              }`}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate max-w-full">
                {player.name}
              </h1>
              {player.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shrink-0">
                  <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
              <span className="font-bold text-white">{formatCricketLabel(player.role)}</span>
              {player.battingStyle && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-500" aria-hidden="true">•</span>
                  <span>{formatCricketLabel(player.battingStyle)}</span>
                </span>
              )}
              {player.bowlingStyle && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-500" aria-hidden="true">•</span>
                  <span>{formatCricketLabel(player.bowlingStyle)}</span>
                </span>
              )}
              {player.dob && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-500" aria-hidden="true">•</span>
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <span>{fmtDate(player.dob)}</span>
                </span>
              )}
            </div>

            {currentMembership?.team && (
              <div className="pt-0.5">
                <div className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs">
                  <TeamLogo
                    name={currentMembership.team.name}
                    shortName={currentMembership.team.shortName}
                    color={currentMembership.team.color}
                    logoUrl={currentMembership.team.logoUrl}
                    size="xs"
                  />
                  <span className="font-bold text-white truncate">{currentMembership.team.name}</span>
                  {currentMembership.season && (
                    <span className="text-slate-300 shrink-0">• {currentMembership.season.name}</span>
                  )}
                </div>
              </div>
            )}

            {player.bio && <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{player.bio}</p>}
          </div>
        </div>

        {rightSlot && <div className="shrink-0 flex flex-wrap items-center gap-2">{rightSlot}</div>}
      </div>

      {!compact && (
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatKpi label="Matches" value={c?.matches ?? 0} />
          <StatKpi label="Total Runs" value={c?.runs ?? 0} highlight />
          <StatKpi label="Total Wickets" value={c?.wickets ?? 0} highlight />
          <StatKpi label="Bat Avg" value={batAvg} />
          <StatKpi label="Strike Rate" value={(c?.strikeRate ?? 0).toFixed(1)} />
          <StatKpi label="Economy" value={(c?.economy ?? 0).toFixed(2)} />
        </div>
      )}
    </section>
  )
}

export function CareerStatsGrid({ career }: { career: PlayerCareerStatDto | null | undefined }) {
  const c = career
  const batAvg = c?.battingAverage !== null && c?.battingAverage !== undefined ? c.battingAverage.toFixed(2) : '—'
  const bowlAvg = c?.bowlingAverage !== null && c?.bowlingAverage !== undefined ? c.bowlingAverage.toFixed(2) : '—'
  const bowlSr = c?.bowlingStrikeRate !== null && c?.bowlingStrikeRate !== undefined ? c.bowlingStrikeRate.toFixed(1) : '—'
  const hs = c ? `${c.highestScore}${c.highestScoreNotOut && c.highestScore > 0 ? '*' : ''}` : '0'
  const totalFielding = (c?.catches ?? 0) + (c?.runOuts ?? 0) + (c?.stumpings ?? 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Batting Career Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <CardSpotlightMetric label="Total Runs" value={c?.runs ?? 0} accent />
            <CardSpotlightMetric label="Batting Average" value={batAvg} />
          </div>
          <div>
            <MetricRow label="Matches" value={c?.matches ?? 0} />
            <MetricRow label="Innings Batted" value={c?.inningsBatted ?? 0} />
            <MetricRow label="Total Runs" value={c?.runs ?? 0} prominent />
            <MetricRow label="Balls Faced" value={c?.ballsFaced ?? 0} />
            <MetricRow label="Highest Score" value={hs} prominent />
            <MetricRow label="Not Outs" value={c?.notOuts ?? 0} />
            <MetricRow label="Batting Average" value={batAvg} />
            <MetricRow label="Strike Rate" value={(c?.strikeRate ?? 0).toFixed(2)} prominent />
            <MetricRow label="Fours / Sixes" value={`${c?.fours ?? 0} / ${c?.sixes ?? 0}`} />
            <MetricRow label="50s / 100s" value={`${c?.fifties ?? 0} / ${c?.hundreds ?? 0}`} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Bowling Career Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <CardSpotlightMetric label="Wickets Taken" value={c?.wickets ?? 0} accent />
            <CardSpotlightMetric label="Best Bowling" value={c?.bestBowlingDisplay ?? '—'} />
          </div>
          <div>
            <MetricRow label="Innings Bowled" value={c?.inningsBowled ?? 0} />
            <MetricRow label="Overs Bowled" value={c?.oversBowled ?? '0.0'} />
            <MetricRow label="Legal Balls Bowled" value={c?.legalBallsBowled ?? 0} />
            <MetricRow label="Runs Conceded" value={c?.runsConceded ?? 0} />
            <MetricRow label="Wickets Taken" value={c?.wickets ?? 0} prominent />
            <MetricRow label="Maiden Overs" value={c?.maidens ?? 0} />
            <MetricRow label="Best Bowling" value={c?.bestBowlingDisplay ?? '—'} prominent />
            <MetricRow label="Bowling Average" value={bowlAvg} />
            <MetricRow label="Economy Rate" value={(c?.economy ?? 0).toFixed(2)} prominent />
            <MetricRow label="Bowling Strike Rate" value={bowlSr} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Fielding &amp; Career Milestones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <CardSpotlightMetric label="Fielding Dismissals" value={totalFielding} accent />
            <CardSpotlightMetric label="POM Awards" value={c?.playerOfMatchAwards ?? 0} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1">
            <div>
              <MetricRow label="Catches" value={c?.catches ?? 0} />
              <MetricRow label="Run-Outs" value={c?.runOuts ?? 0} />
              <MetricRow label="Stumpings" value={c?.stumpings ?? 0} />
              <MetricRow label="Total Fielding Dismissals" value={totalFielding} prominent />
            </div>
            <div>
              <MetricRow label="Player of the Match Awards" value={c?.playerOfMatchAwards ?? 0} prominent />
              <MetricRow label="Seasons Represented" value={c?.seasonsCount ?? 0} />
              <MetricRow label="Teams Represented" value={c?.teamsCount ?? 0} />
              <MetricRow label="Tournaments Played" value={c?.tournamentsCount ?? 0} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BreakdownTable({
  caption,
  firstColumnLabel,
  rows,
  nameAccessor,
}: {
  caption: string
  firstColumnLabel: string
  rows: CareerBreakdownRow[]
  nameAccessor: (row: CareerBreakdownRow) => string
}) {
  return (
    <div className="table-wrapper rounded-2xl border border-[#E5E7EB] bg-white" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
            <th className="py-3 pl-4 pr-3">{firstColumnLabel}</th>
            <th className="py-3 px-2.5 text-right">Mat</th>
            <th className="py-3 px-2.5 text-right">Runs</th>
            <th className="py-3 px-2.5 text-right">HS</th>
            <th className="py-3 px-2.5 text-right">Avg</th>
            <th className="py-3 px-2.5 text-right">SR</th>
            <th className="py-3 px-2.5 text-right">Wkts</th>
            <th className="py-3 px-2.5 text-right">Overs</th>
            <th className="py-3 px-2.5 text-right">Econ</th>
            <th className="py-3 pl-2.5 pr-4 text-right">POM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-8 text-center text-gray-400">
                No verified match records yet.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.key} className="hover:bg-[#F9FAFB]">
                <td className="py-3 pl-4 pr-3 font-bold text-[#111827]">{nameAccessor(r)}</td>
                <td className="py-3 px-2.5 text-right tabular-nums">{r.matches}</td>
                <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#7A1426]">{r.runs}</td>
                <td className="py-3 px-2.5 text-right tabular-nums">
                  {r.highestScore}
                  {r.highestScoreNotOut && r.highestScore > 0 ? '*' : ''}
                </td>
                <td className="py-3 px-2.5 text-right tabular-nums">
                  {r.battingAverage !== null ? r.battingAverage.toFixed(1) : '—'}
                </td>
                <td className="py-3 px-2.5 text-right tabular-nums">{r.strikeRate.toFixed(1)}</td>
                <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#111827]">{r.wickets}</td>
                <td className="py-3 px-2.5 text-right tabular-nums text-gray-600">{r.overs}</td>
                <td className="py-3 px-2.5 text-right tabular-nums">{r.economy.toFixed(2)}</td>
                <td className="py-3 pl-2.5 pr-4 text-right tabular-nums font-bold">{r.playerOfMatchAwards}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function SeasonAndTeamHistorySection({
  career,
  memberships,
}: {
  career: PlayerCareerStatDto | null | undefined
  memberships: TeamMembershipDto[]
}) {
  const seasons = career?.seasonBreakdown ?? []
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('ALL')
  const selectedSeason =
    selectedSeasonId === 'ALL' ? null : seasons.find((s) => (s.seasonId ?? s.key) === selectedSeasonId) ?? null

  const filteredSeasonRows = selectedSeason ? [selectedSeason] : seasons

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7A1426]" />
              Team Representation History (By Season)
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Your verified career profile retains full historical team memberships without overwriting past seasons.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No season team memberships recorded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {memberships.map((m) => {
                const seasonStat = (career?.seasonBreakdown ?? []).find((s) => s.seasonId === m.seasonId)
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.team ? (
                        <TeamLogo
                          name={m.team.name}
                          shortName={m.team.shortName}
                          color={m.team.color}
                          logoUrl={m.team.logoUrl}
                          size="sm"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                          {m.season ? `${m.season.name} (${m.season.year})` : 'Season'}
                        </div>
                        <div className="text-sm font-extrabold text-[#111827] truncate">
                          {m.team?.name ?? 'Free Agent'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {m.designation !== 'PLAYER' ? `${formatCricketLabel(m.designation)} • ` : ''}
                          Joined {fmtDate(m.joinedAt)}
                        </div>
                      </div>
                    </div>
                    {seasonStat && (
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-[#111827] tabular-nums">{seasonStat.runs} R</div>
                        <div className="text-[11px] font-bold text-gray-500 tabular-nums">{seasonStat.wickets} W</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-[#111827]">Season-Wise Career Statistics</h3>
          {seasons.length > 0 && (
            <select
              aria-label="Filter season history"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-bold text-[#111827] focus:border-[#7A1426] focus:outline-none"
            >
              <option value="ALL">All Seasons ({seasons.length})</option>
              {seasons.map((s) => (
                <option key={s.key} value={s.seasonId ?? s.key}>
                  {s.seasonName ?? s.key}
                </option>
              ))}
            </select>
          )}
        </div>
        <BreakdownTable
          caption="Season-wise career statistics"
          firstColumnLabel="Season"
          rows={filteredSeasonRows}
          nameAccessor={(r) => `${r.seasonName ?? 'Season'}${r.teamName ? ` (${r.teamName})` : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-[#111827]">Team-Wise Breakdown</h3>
          <BreakdownTable
            caption="Team-wise career statistics"
            firstColumnLabel="Team"
            rows={career?.teamBreakdown ?? []}
            nameAccessor={(r) => r.teamName ?? r.teamShortName ?? 'Team'}
          />
        </div>
        <div className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-[#111827]">Tournament-Wise Breakdown</h3>
          <BreakdownTable
            caption="Tournament-wise career statistics"
            firstColumnLabel="Tournament"
            rows={career?.tournamentBreakdown ?? []}
            nameAccessor={(r) => r.tournamentName ?? 'Tournament'}
          />
        </div>
      </div>
    </div>
  )
}

export function MatchHistorySection({
  matches,
  navigate,
}: {
  matches: PlayerMatchHistoryRow[]
  navigate: (to: string) => void
}) {
  return (
    <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-extrabold text-[#111827] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#7A1426]" />
          Verified Match History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Player match history table">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#F9FAFB] border-y border-[#E5E7EB]">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                <th className="py-3 pl-5 pr-3">Date &amp; Match</th>
                <th className="py-3 px-3">Tournament / Season</th>
                <th className="py-3 px-3">Batting</th>
                <th className="py-3 px-3">Bowling</th>
                <th className="py-3 px-3">Fielding</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 pl-3 pr-5 text-right">Scorecard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No verified matches played yet. Stats appear after official scorecard verification.
                  </td>
                </tr>
              ) : (
                matches.map((m) => {
                  const batText =
                    m.batting.innings > 0
                      ? `${m.batting.runs}${m.batting.notOut ? '*' : ''} (${m.batting.balls}b)`
                      : 'DNB'
                  const bowlText =
                    m.bowling.innings > 0
                      ? `${m.bowling.wickets}/${m.bowling.runsConceded} (${m.bowling.overs} ov)`
                      : '—'
                  const fldTotal = m.fielding.catches + m.fielding.runOuts + m.fielding.stumpings
                  const fldText =
                    fldTotal > 0
                      ? [
                          m.fielding.catches ? `${m.fielding.catches}c` : '',
                          m.fielding.runOuts ? `${m.fielding.runOuts}ro` : '',
                          m.fielding.stumpings ? `${m.fielding.stumpings}st` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : '—'

                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/match/${m.matchId}`)}
                      className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    >
                      <td className="py-3 pl-5 pr-3">
                        <div className="font-bold text-[#111827]">
                          {m.team?.shortName ?? 'Team'} vs {m.opponent?.name ?? 'Opponent'}
                        </div>
                        <div className="text-[11px] text-gray-500">{fmtDate(m.matchDate)}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111827]">{m.tournament?.name ?? 'Tournament'}</div>
                        <div className="text-[11px] text-gray-500">{m.season?.name ?? ''}</div>
                      </td>
                      <td className="py-3 px-3 tabular-nums font-bold text-[#7A1426]">{batText}</td>
                      <td className="py-3 px-3 tabular-nums font-bold text-[#111827]">{bowlText}</td>
                      <td className="py-3 px-3 text-gray-600">{fldText}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.result === 'WON'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.result === 'LOST'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {m.result}
                        </span>
                        {m.isPlayerOfMatch && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            POM
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-[#7A1426]">
                          View <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

