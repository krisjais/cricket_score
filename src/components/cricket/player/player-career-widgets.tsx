'use client'

import { useState } from 'react'
import {
  Award,
  BadgeCheck,
  Calendar,
  ExternalLink,
  MapPin,
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

function StatKpi({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        highlight
          ? 'border-[#7A1426]/40 bg-[#7A1426]/10 text-white'
          : 'border-white/10 bg-white/5 text-white'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">{label}</div>
      <div className="mt-1 text-xl sm:text-2xl font-black tabular-nums tracking-tight">{value}</div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-xs">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-bold text-[#111827] tabular-nums">{value}</span>
    </div>
  )
}

export function PlayerOverviewHero({
  player,
  career,
  currentMembership,
  rightSlot,
}: {
  player: PlayerProfileDto
  career: PlayerCareerStatDto | null | undefined
  currentMembership: TeamMembershipDto | null | undefined
  rightSlot?: React.ReactNode
}) {
  const c = career
  const batAvg = c?.battingAverage !== null && c?.battingAverage !== undefined ? c.battingAverage.toFixed(2) : '—'

  return (
    <section className="rounded-3xl bg-[#121826] text-white p-5 sm:p-7 shadow-md border border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#7A1426] border-2 border-white/20 flex items-center justify-center text-xl sm:text-2xl font-black text-white shrink-0">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{player.name}</h1>
              {player.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
              {player.playerCode && (
                <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                  {player.playerCode}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-300">
              <span className="font-bold text-white">{formatCricketLabel(player.role)}</span>
              {player.battingStyle && <span>• {formatCricketLabel(player.battingStyle)}</span>}
              {player.bowlingStyle && <span>• {formatCricketLabel(player.bowlingStyle)}</span>}
              {player.city && (
                <span className="inline-flex items-center gap-1">
                  • <MapPin className="w-3 h-3" /> {player.city}
                </span>
              )}
              {player.dob && (
                <span className="inline-flex items-center gap-1">
                  • <Calendar className="w-3 h-3" /> {fmtDate(player.dob)}
                </span>
              )}
            </div>

            {currentMembership?.team && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs">
                <TeamLogo
                  name={currentMembership.team.name}
                  shortName={currentMembership.team.shortName}
                  color={currentMembership.team.color}
                  logoUrl={currentMembership.team.logoUrl}
                  size="xs"
                />
                <span className="font-bold text-white">{currentMembership.team.name}</span>
                {currentMembership.season && (
                  <span className="text-gray-300">• {currentMembership.season.name}</span>
                )}
              </div>
            )}

            {player.bio && <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">{player.bio}</p>}
          </div>
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatKpi label="Matches" value={c?.matches ?? 0} />
        <StatKpi label="Total Runs" value={c?.runs ?? 0} highlight />
        <StatKpi label="Total Wickets" value={c?.wickets ?? 0} highlight />
        <StatKpi label="Bat Avg" value={batAvg} />
        <StatKpi label="Strike Rate" value={(c?.strikeRate ?? 0).toFixed(1)} />
        <StatKpi label="Economy" value={(c?.economy ?? 0).toFixed(2)} />
      </div>
    </section>
  )
}

export function CareerStatsGrid({ career }: { career: PlayerCareerStatDto | null | undefined }) {
  const c = career
  const batAvg = c?.battingAverage !== null && c?.battingAverage !== undefined ? c.battingAverage.toFixed(2) : '—'
  const bowlAvg = c?.bowlingAverage !== null && c?.bowlingAverage !== undefined ? c.bowlingAverage.toFixed(2) : '—'
  const bowlSr = c?.bowlingStrikeRate !== null && c?.bowlingStrikeRate !== undefined ? c.bowlingStrikeRate.toFixed(1) : '—'
  const hs = c ? `${c.highestScore}${c.highestScoreNotOut && c.highestScore > 0 ? '*' : ''}` : '0'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Batting Career Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MetricRow label="Matches" value={c?.matches ?? 0} />
          <MetricRow label="Innings Batted" value={c?.inningsBatted ?? 0} />
          <MetricRow label="Total Runs" value={c?.runs ?? 0} />
          <MetricRow label="Balls Faced" value={c?.ballsFaced ?? 0} />
          <MetricRow label="Highest Score" value={hs} />
          <MetricRow label="Not Outs" value={c?.notOuts ?? 0} />
          <MetricRow label="Batting Average" value={batAvg} />
          <MetricRow label="Strike Rate" value={(c?.strikeRate ?? 0).toFixed(2)} />
          <MetricRow label="Fours / Sixes" value={`${c?.fours ?? 0} / ${c?.sixes ?? 0}`} />
          <MetricRow label="50s / 100s" value={`${c?.fifties ?? 0} / ${c?.hundreds ?? 0}`} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Bowling Career Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MetricRow label="Innings Bowled" value={c?.inningsBowled ?? 0} />
          <MetricRow label="Overs Bowled" value={c?.oversBowled ?? '0.0'} />
          <MetricRow label="Legal Balls Bowled" value={c?.legalBallsBowled ?? 0} />
          <MetricRow label="Runs Conceded" value={c?.runsConceded ?? 0} />
          <MetricRow label="Wickets Taken" value={c?.wickets ?? 0} />
          <MetricRow label="Maiden Overs" value={c?.maidens ?? 0} />
          <MetricRow label="Best Bowling" value={c?.bestBowlingDisplay ?? '—'} />
          <MetricRow label="Bowling Average" value={bowlAvg} />
          <MetricRow label="Economy Rate" value={(c?.economy ?? 0).toFixed(2)} />
          <MetricRow label="Bowling Strike Rate" value={bowlSr} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
            <Award className="w-4 h-4" />
            Fielding &amp; Career Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MetricRow label="Catches" value={c?.catches ?? 0} />
          <MetricRow label="Run-Outs" value={c?.runOuts ?? 0} />
          <MetricRow label="Stumpings" value={c?.stumpings ?? 0} />
          <MetricRow label="Total Fielding Dismissals" value={(c?.catches ?? 0) + (c?.runOuts ?? 0) + (c?.stumpings ?? 0)} />
          <MetricRow label="Player of the Match Awards" value={c?.playerOfMatchAwards ?? 0} />
          <MetricRow label="Seasons Represented" value={c?.seasonsCount ?? 0} />
          <MetricRow label="Teams Represented" value={c?.teamsCount ?? 0} />
          <MetricRow label="Tournaments Played" value={c?.tournamentsCount ?? 0} />
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
              Permanent Player ID retains full historical team memberships without overwriting past seasons.
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

