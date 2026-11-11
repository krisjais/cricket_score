'use client'

import { useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Crown,
  Flame,
  History,
  MapPin,
  Medal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import {
  type AchievementCategory,
  type PerformanceSeriesPoint,
  type PersonalBestsDto,
  type PlayerAchievementDto,
  type PlayerMatchHistoryRow,
  type SeasonPerformancePoint,
  type UpcomingPlayerMatchDto,
  fmtDate,
  fmtDateTime,
} from './player-types'

const RESULT_PILLS: Record<string, { label: string; className: string }> = {
  WON: { label: 'Won', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  LOST: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  TIED: { label: 'Tied', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  NO_RESULT: { label: 'No Result', className: 'border-gray-200 bg-gray-100 text-gray-600' },
}

function ResultPill({ result }: { result: string }) {
  const cfg = RESULT_PILLS[result] ?? RESULT_PILLS.NO_RESULT
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

function OverviewSectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7A1426]/15 bg-[#7A1426]/10 text-[#7A1426]"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#111827] truncate">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

function EmptySectionCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs">
      <CardContent className="flex flex-col items-center justify-center py-8 px-5 text-center">
        <div
          aria-hidden="true"
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400"
        >
          {icon}
        </div>
        <p className="text-sm font-bold text-[#111827]">{title}</p>
        <p className="mt-1 max-w-md text-xs text-gray-500 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

export function RecentFormSection({
  matches,
  onOpenMatch,
}: {
  matches: PlayerMatchHistoryRow[]
  onOpenMatch?: (matchId: string) => void
}) {
  const recent = matches.slice(0, 5)

  return (
    <section aria-label="Recent Form" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<Activity className="h-4 w-4" />}
        title="Recent Form"
        subtitle={
          recent.length > 0
            ? `Your last ${recent.length} completed official ${recent.length === 1 ? 'match' : 'matches'}`
            : 'Match-by-match momentum across your latest 5 official scorecards'
        }
        right={
          recent.length > 0 ? (
            <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 tabular-nums shadow-2xs">
              Last {recent.length}
            </span>
          ) : undefined
        }
      />

      {recent.length === 0 ? (
        <EmptySectionCard
          icon={<Activity className="h-5 w-5" />}
          title="No verified match form yet"
          description="Your runs scored, balls faced, wickets taken, and results from your last 5 matches will populate automatically once scorecards are finalized."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {recent.map((m) => {
            const batted = m.batting.innings > 0
            const bowled = m.bowling.innings > 0 || m.bowling.legalBalls > 0
            const oppShort = m.opponent?.shortName || m.opponent?.name || 'OPP'
            const runsLabel = batted ? `${m.batting.runs}${m.batting.notOut ? '*' : ''}` : 'DNB'
            const ballsLabel = batted ? `${m.batting.balls}` : '—'
            const wicketsLabel = bowled ? `${m.bowling.wickets}/${m.bowling.runsConceded}` : '—'

            return (
              <Card
                key={m.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:border-[#7A1426]/35 transition-colors min-w-0"
              >
                <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo
                        name={m.opponent?.name || oppShort}
                        shortName={oppShort}
                        color={m.opponent?.color || '#121826'}
                        logoUrl={m.opponent?.logoUrl}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-extrabold text-[#111827] truncate">
                          vs {oppShort}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate">{fmtDate(m.matchDate)}</p>
                      </div>
                    </div>
                    <ResultPill result={m.result} />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-gray-100 bg-[#F9FAFB] p-2.5 text-center">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Runs
                      </div>
                      <div className="mt-0.5 text-sm font-black tabular-nums text-[#111827] truncate">
                        {runsLabel}
                      </div>
                    </div>
                    <div className="min-w-0 border-x border-gray-200/70 px-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Balls
                      </div>
                      <div className="mt-0.5 text-sm font-black tabular-nums text-gray-700 truncate">
                        {ballsLabel}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Wkts
                      </div>
                      <div className="mt-0.5 text-sm font-black tabular-nums text-[#7A1426] truncate">
                        {wicketsLabel}
                      </div>
                    </div>
                  </div>

                  {onOpenMatch && (
                    <button
                      type="button"
                      onClick={() => onOpenMatch(m.matchId)}
                      className="inline-flex items-center justify-between w-full text-[11px] font-bold text-[#7A1426] hover:text-[#5E0E1D] transition-colors cursor-pointer pt-0.5"
                    >
                      <span className="truncate">{m.opponent?.name || 'View Scorecard'}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

interface BestRecordCardItem {
  key: string
  label: string
  value: string
  detail: string
  subnote?: string
  icon: ReactNode
  accent?: boolean
}

export function PersonalBestsSection({
  bests,
  onOpenMatch,
}: {
  bests: PersonalBestsDto | null | undefined
  onOpenMatch?: (matchId: string) => void
}) {
  const oppOf = (ref?: { opponentShortName: string | null; opponentName: string | null; matchDate: string } | null) =>
    ref ? `vs ${ref.opponentShortName || ref.opponentName || 'Opponent'} · ${fmtDate(ref.matchDate)}` : ''

  const items: Array<BestRecordCardItem & { matchId?: string }> = [
    {
      key: 'hs',
      label: 'Highest Individual Score',
      value: bests?.highestScore ? `${bests.highestScore.runs}${bests.highestScore.notOut ? '*' : ''}` : '—',
      detail: bests?.highestScore
        ? `${bests.highestScore.balls} balls · SR ${bests.highestScore.strikeRate.toFixed(1)}`
        : 'No batted innings yet',
      subnote: bests?.highestScore ? oppOf(bests.highestScore) : undefined,
      matchId: bests?.highestScore?.matchId,
      icon: <Trophy className="h-4 w-4" />,
      accent: true,
    },
    {
      key: 'bb',
      label: 'Best Bowling Figures',
      value: bests?.bestBowling ? bests.bestBowling.display : '—',
      detail: bests?.bestBowling
        ? `${bests.bestBowling.overs} overs · Econ ${bests.bestBowling.economy.toFixed(2)}`
        : 'No bowling spell yet',
      subnote: bests?.bestBowling ? oppOf(bests.bestBowling) : undefined,
      matchId: bests?.bestBowling?.matchId,
      icon: <Target className="h-4 w-4" />,
      accent: true,
    },
    {
      key: 'sixes',
      label: 'Most Sixes in One Match',
      value: bests?.mostSixesInMatch ? `${bests.mostSixesInMatch.sixes}` : '—',
      detail: bests?.mostSixesInMatch
        ? bests.mostSixesInMatch.sixes > 0
          ? `In knock of ${bests.mostSixesInMatch.runs} (${bests.mostSixesInMatch.balls}b)`
          : '0 sixes across batted innings'
        : 'No batted innings yet',
      subnote:
        bests?.mostSixesInMatch && bests.mostSixesInMatch.sixes > 0 ? oppOf(bests.mostSixesInMatch) : undefined,
      matchId: bests?.mostSixesInMatch && bests.mostSixesInMatch.sixes > 0 ? bests.mostSixesInMatch.matchId : undefined,
      icon: <Flame className="h-4 w-4" />,
    },
    {
      key: 'fours',
      label: 'Most Fours in One Match',
      value: bests?.mostFoursInMatch ? `${bests.mostFoursInMatch.fours}` : '—',
      detail: bests?.mostFoursInMatch
        ? bests.mostFoursInMatch.fours > 0
          ? `In knock of ${bests.mostFoursInMatch.runs} (${bests.mostFoursInMatch.balls}b)`
          : '0 fours across batted innings'
        : 'No batted innings yet',
      subnote:
        bests?.mostFoursInMatch && bests.mostFoursInMatch.fours > 0 ? oppOf(bests.mostFoursInMatch) : undefined,
      matchId: bests?.mostFoursInMatch && bests.mostFoursInMatch.fours > 0 ? bests.mostFoursInMatch.matchId : undefined,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      key: 'sr',
      label: 'Best Batting Strike Rate',
      value:
        bests?.bestStrikeRateQualified && bests?.bestStrikeRate
          ? bests.bestStrikeRate.strikeRate.toFixed(1)
          : '—',
      detail:
        bests?.bestStrikeRateQualified && bests?.bestStrikeRate
          ? `${bests.bestStrikeRate.runs}${bests.bestStrikeRate.notOut ? '*' : ''} off ${bests.bestStrikeRate.balls} balls`
          : 'Qualification not yet met',
      subnote:
        bests?.bestStrikeRateQualified && bests?.bestStrikeRate
          ? oppOf(bests.bestStrikeRate)
          : bests?.bestStrikeRateCriteria || 'Min. 2 batted innings & 10+ balls in an innings',
      matchId: bests?.bestStrikeRateQualified ? bests?.bestStrikeRate?.matchId : undefined,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      key: 'wkts',
      label: 'Most Wickets in One Match',
      value: bests?.mostWicketsInMatch ? `${bests.mostWicketsInMatch.wickets}` : '—',
      detail: bests?.mostWicketsInMatch
        ? bests.mostWicketsInMatch.wickets > 0
          ? `Spell ${bests.mostWicketsInMatch.wickets}/${bests.mostWicketsInMatch.runsConceded} (${bests.mostWicketsInMatch.overs} ov)`
          : '0 wickets across bowled spells'
        : 'No bowling spell yet',
      subnote:
        bests?.mostWicketsInMatch && bests.mostWicketsInMatch.wickets > 0
          ? oppOf(bests.mostWicketsInMatch)
          : undefined,
      matchId:
        bests?.mostWicketsInMatch && bests.mostWicketsInMatch.wickets > 0 ? bests.mostWicketsInMatch.matchId : undefined,
      icon: <Medal className="h-4 w-4" />,
    },
  ]

  return (
    <section aria-label="Personal Best Records" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<Trophy className="h-4 w-4" />}
        title="Personal Best Records"
        subtitle="Career single-match highs derived strictly from finalized official scorecards"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => (
          <Card
            key={item.key}
            className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs min-w-0"
          >
            <CardContent className="p-4 flex flex-col justify-between gap-2.5 h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {item.label}
                  </p>
                  <div
                    className={`mt-1.5 text-2xl sm:text-[28px] font-black tabular-nums tracking-tight leading-none ${
                      item.accent && item.value !== '—' ? 'text-[#7A1426]' : 'text-[#111827]'
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    item.accent
                      ? 'border-[#7A1426]/20 bg-[#7A1426]/10 text-[#7A1426]'
                      : 'border-gray-200 bg-[#F9FAFB] text-[#121826]'
                  }`}
                >
                  {item.icon}
                </div>
              </div>

              <div className="pt-1 border-t border-gray-100 space-y-0.5">
                <p className="text-xs font-semibold text-[#111827]">{item.detail}</p>
                {item.subnote && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-500 truncate">{item.subnote}</p>
                    {item.matchId && onOpenMatch && (
                      <button
                        type="button"
                        onClick={() => onOpenMatch(item.matchId!)}
                        className="shrink-0 text-[11px] font-bold text-[#7A1426] hover:underline cursor-pointer"
                      >
                        Match
                      </button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

const ACHIEVEMENT_STYLES: Record<AchievementCategory, { icon: ReactNode; badgeBg: string; ring: string }> = {
  BATTING: {
    icon: <Flame className="h-4 w-4" />,
    badgeBg: 'bg-[#7A1426]/10 text-[#7A1426] border-[#7A1426]/20',
    ring: 'border-[#E5E7EB]',
  },
  BOWLING: {
    icon: <Target className="h-4 w-4" />,
    badgeBg: 'bg-[#121826]/10 text-[#121826] border-[#121826]/20',
    ring: 'border-[#E5E7EB]',
  },
  CAREER: {
    icon: <Star className="h-4 w-4" />,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'border-amber-200/70',
  },
  MATCH: {
    icon: <Award className="h-4 w-4" />,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'border-emerald-200/70',
  },
  TOURNAMENT: {
    icon: <Crown className="h-4 w-4" />,
    badgeBg: 'bg-[#7A1426] text-white border-[#7A1426]',
    ring: 'border-[#7A1426]/25',
  },
}

export function RecentAchievementsSection({
  achievements,
}: {
  achievements: PlayerAchievementDto[]
}) {
  return (
    <section aria-label="Recent Achievements" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="Recent Achievements"
        subtitle="Verified career milestones unlocked through official league play"
        right={
          achievements.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#7A1426]/20 bg-[#7A1426]/[0.06] px-2.5 py-1 text-[11px] font-bold text-[#7A1426] tabular-nums">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {achievements.length} Earned
            </span>
          ) : undefined
        }
      />

      {achievements.length === 0 ? (
        <EmptySectionCard
          icon={<Award className="h-5 w-5" />}
          title="No milestones unlocked yet"
          description="Milestones like First Fifty, First Hundred, First Five-Wicket Haul, 100 Career Runs, 50 Career Wickets, Player of the Match, and Tournament Winner appear here as soon as you earn them."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {achievements.map((ach) => {
            const style = ACHIEVEMENT_STYLES[ach.category] ?? ACHIEVEMENT_STYLES.CAREER
            return (
              <Card
                key={ach.id}
                className={`rounded-2xl border bg-white shadow-2xs min-w-0 ${style.ring}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.badgeBg}`}
                  >
                    {style.icon}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-[#111827] truncate">{ach.title}</h3>
                      {ach.count && ach.count > 1 && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-[#121826] tabular-nums">
                          {ach.count}x
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-600 leading-snug">{ach.subtitle}</p>
                    {ach.achievedAt && (
                      <p className="text-[10px] font-semibold text-gray-400">
                        Earned {fmtDate(ach.achievedAt)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

function MatchChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean
  payload?: Array<{ payload: PerformanceSeriesPoint }>
  mode: 'BATTING' | 'BOWLING'
}) {
  if (!active || !payload || payload.length === 0) return null
  const pt = payload[0]?.payload
  if (!pt) return null

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-md text-xs space-y-1">
      <div className="font-extrabold text-[#111827]">
        Match #{pt.matchIndex} · vs {pt.opponentName || pt.opponentShortName || 'OPP'}
      </div>
      <div className="text-[11px] text-gray-500">{fmtDate(pt.date)}</div>
      {mode === 'BATTING' ? (
        <div className="font-bold text-[#7A1426] tabular-nums">
          {pt.batted === false
            ? 'Did Not Bat'
            : `${pt.runs}${pt.notOut ? '*' : ''} runs (${pt.balls} balls)`}
        </div>
      ) : (
        <div className="font-bold text-[#121826] tabular-nums">
          {pt.bowled === false
            ? 'Did Not Bowl'
            : `${pt.wickets}/${pt.runsConceded} (${pt.overs || '0.0'} ov · Econ ${(pt.economy ?? 0).toFixed(2)})`}
        </div>
      )}
    </div>
  )
}

function SeasonChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean
  payload?: Array<{ payload: SeasonPerformancePoint }>
  mode: 'BATTING' | 'BOWLING'
}) {
  if (!active || !payload || payload.length === 0) return null
  const pt = payload[0]?.payload
  if (!pt) return null

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-md text-xs space-y-1">
      <div className="font-extrabold text-[#111827]">{pt.label}</div>
      <div className="text-[11px] text-gray-500">
        {pt.matches} {pt.matches === 1 ? 'match' : 'matches'}
        {pt.teams.length > 0 ? ` · ${pt.teams.join(' / ')}` : ''}
      </div>
      {mode === 'BATTING' ? (
        <div className="font-bold text-[#7A1426] tabular-nums">
          {pt.runs} runs ({pt.balls} balls · SR {pt.strikeRate.toFixed(1)})
        </div>
      ) : (
        <div className="font-bold text-[#121826] tabular-nums">
          {pt.wickets} wickets ({pt.overs} ov · Econ {pt.economy.toFixed(2)})
        </div>
      )}
    </div>
  )
}

export function PerformanceOverviewSection({
  performanceSeries,
  seasonPerformance,
}: {
  performanceSeries: PerformanceSeriesPoint[]
  seasonPerformance: SeasonPerformancePoint[]
}) {
  const [mode, setMode] = useState<'BATTING' | 'BOWLING'>('BATTING')
  const isBatting = mode === 'BATTING'

  return (
    <section aria-label="Performance Overview" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<BarChart3 className="h-4 w-4" />}
        title="Performance Overview"
        subtitle="Runs scored, wickets taken, and season-by-season totals across all teams"
        right={
          <div
            role="group"
            aria-label="Performance chart category"
            className="inline-flex rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-2xs"
          >
            <button
              type="button"
              aria-pressed={isBatting}
              onClick={() => setMode('BATTING')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                isBatting ? 'bg-[#7A1426] text-white' : 'text-gray-600 hover:text-[#111827]'
              }`}
            >
              Batting
            </button>
            <button
              type="button"
              aria-pressed={!isBatting}
              onClick={() => setMode('BOWLING')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                !isBatting ? 'bg-[#121826] text-white' : 'text-gray-600 hover:text-[#111827]'
              }`}
            >
              Bowling
            </button>
          </div>
        }
      />

      {performanceSeries.length === 0 ? (
        <EmptySectionCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="No performance chart data yet"
          description="Interactive match and season charts unlock automatically once you complete at least one verified match."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-extrabold text-[#111827]">
                  {isBatting ? 'Runs Scored Across Matches' : 'Wickets Taken Across Matches'}
                </CardTitle>
                <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                  {performanceSeries.length} {performanceSeries.length === 1 ? 'Match' : 'Matches'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 min-w-0">
              <div className="h-60 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="matchKey"
                      tick={{ fontSize: 11, fill: '#4B5563' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#4B5563' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<MatchChartTooltip mode={mode} />} cursor={{ fill: '#F3F4F6' }} />
                    <Bar
                      dataKey={isBatting ? 'runs' : 'wickets'}
                      fill={isBatting ? '#7A1426' : '#121826'}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                      name={isBatting ? 'Runs' : 'Wickets'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <details className="rounded-xl border border-gray-100 bg-[#F9FAFB] px-3 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-gray-600 select-none">
                  View match-by-match values table
                </summary>
                <div className="table-wrapper mt-2 max-h-44 overflow-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-gray-200 text-gray-500 uppercase">
                      <tr>
                        <th className="py-1.5 pr-2">Match</th>
                        <th className="py-1.5 px-2">Date</th>
                        <th className="py-1.5 pl-2 text-right">{isBatting ? 'Runs (Balls)' : 'Wkts / Runs (Ov)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {performanceSeries.map((pt) => (
                        <tr key={pt.matchId}>
                          <td className="py-1.5 pr-2 font-semibold text-[#111827]">{pt.label}</td>
                          <td className="py-1.5 px-2 text-gray-500">{fmtDate(pt.date)}</td>
                          <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-[#111827]">
                            {isBatting
                              ? `${pt.runs}${pt.notOut ? '*' : ''} (${pt.balls}b)`
                              : `${pt.wickets}/${pt.runsConceded} (${pt.overs || '0.0'})`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-extrabold text-[#111827]">
                  {isBatting ? 'Season-Wise Runs Scored' : 'Season-Wise Wickets Taken'}
                </CardTitle>
                <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                  {seasonPerformance.length} {seasonPerformance.length === 1 ? 'Season' : 'Seasons'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 min-w-0">
              <div className="h-60 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonPerformance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#4B5563' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#4B5563' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<SeasonChartTooltip mode={mode} />} cursor={{ fill: '#F3F4F6' }} />
                    <Bar
                      dataKey={isBatting ? 'runs' : 'wickets'}
                      fill={isBatting ? '#7A1426' : '#121826'}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                      name={isBatting ? 'Runs' : 'Wickets'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <details className="rounded-xl border border-gray-100 bg-[#F9FAFB] px-3 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-gray-600 select-none">
                  View season-wise values table
                </summary>
                <div className="table-wrapper mt-2 max-h-44 overflow-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-gray-200 text-gray-500 uppercase">
                      <tr>
                        <th className="py-1.5 pr-2">Season</th>
                        <th className="py-1.5 px-2 text-right">Mat</th>
                        <th className="py-1.5 pl-2 text-right">{isBatting ? 'Runs (SR)' : 'Wkts (Econ)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {seasonPerformance.map((sp) => (
                        <tr key={sp.seasonId}>
                          <td className="py-1.5 pr-2 font-semibold text-[#111827]">{sp.label}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums text-gray-600">{sp.matches}</td>
                          <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-[#111827]">
                            {isBatting
                              ? `${sp.runs} (${sp.strikeRate.toFixed(1)})`
                              : `${sp.wickets} (${sp.economy.toFixed(2)})`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

export function UpcomingMatchesSection({
  upcomingMatches,
  onOpenMatch,
}: {
  upcomingMatches: UpcomingPlayerMatchDto[]
  onOpenMatch: (matchId: string) => void
}) {
  if (!upcomingMatches || upcomingMatches.length === 0) {
    return null
  }

  return (
    <section aria-label="Upcoming Matches" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<CalendarClock className="h-4 w-4" />}
        title="Upcoming Matches"
        subtitle="Fixtures linked to your current active tournament registration"
        right={
          <span className="inline-flex items-center rounded-full border border-[#7A1426]/20 bg-[#7A1426]/10 px-2.5 py-1 text-[11px] font-bold text-[#7A1426] tabular-nums">
            {upcomingMatches.length} Scheduled
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMatches.map((m) => (
          <Card
            key={m.id}
            className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:border-[#7A1426]/40 transition-colors min-w-0"
          >
            <CardContent className="p-4 flex flex-col justify-between gap-3.5 h-full">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A1426] truncate">
                    {m.tournament.name}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {m.format} {m.season ? `· ${m.season.name}` : ''}
                  </p>
                </div>
                <StatusBadge status={m.status} className="shrink-0" />
              </div>

              <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-3 flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogo
                    name={m.opponent?.name || 'Opponent'}
                    shortName={m.opponent?.shortName || 'OPP'}
                    color={m.opponent?.color || '#121826'}
                    logoUrl={m.opponent?.logoUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Opponent Team
                    </div>
                    <h3 className="text-sm font-extrabold text-[#111827] truncate">
                      {m.opponent?.name || 'Opponent TBA'}
                    </h3>
                  </div>
                </div>
                {m.playerTeam && (
                  <span className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#121826]">
                    Your XI: {m.playerTeam.shortName}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs text-gray-600">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-[#111827] truncate">{fmtDateTime(m.matchDate)}</p>
                  {m.venue && (
                    <p className="inline-flex items-center gap-1 text-[11px] text-gray-500 truncate max-w-full">
                      <MapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="truncate">{m.venue}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenMatch(m.matchId)}
                  className="shrink-0 rounded-xl border-gray-200 text-xs font-bold text-[#7A1426] hover:bg-[#7A1426]/5 cursor-pointer"
                >
                  Match Hub
                  <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function RecentMatchHistorySection({
  matches,
  onViewAll,
  onOpenMatch,
}: {
  matches: PlayerMatchHistoryRow[]
  onViewAll: () => void
  onOpenMatch: (matchId: string) => void
}) {
  const latestThree = matches.slice(0, 3)

  return (
    <section aria-label="Recent Match History" className="space-y-3.5">
      <OverviewSectionHeader
        icon={<History className="h-4 w-4" />}
        title="Recent Match History"
        subtitle="Latest 3 completed matches with verified batting and bowling scorecards"
        right={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="rounded-xl border-[#7A1426]/25 bg-white text-xs font-bold text-[#7A1426] hover:bg-[#7A1426]/5 hover:text-[#5E0E1D] cursor-pointer"
          >
            View All
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        }
      />

      {latestThree.length === 0 ? (
        <EmptySectionCard
          icon={<History className="h-5 w-5" />}
          title="No completed match history yet"
          description="Once your finalized match scorecards are verified, your latest 3 match summaries will appear here with a direct link to full scorecards."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {latestThree.map((m) => {
            const batted = m.batting.innings > 0
            const bowled = m.bowling.innings > 0 || m.bowling.legalBalls > 0
            const oppShort = m.opponent?.shortName || m.opponent?.name || 'OPP'

            return (
              <Card
                key={m.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:border-[#7A1426]/35 transition-colors min-w-0"
              >
                <CardContent className="p-4 flex flex-col justify-between gap-3.5 h-full">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426] truncate">
                          {m.tournament?.name || m.season?.name || 'League Match'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{fmtDate(m.matchDate)}</p>
                      </div>
                      <ResultPill result={m.result} />
                    </div>

                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamLogo
                        name={m.opponent?.name || oppShort}
                        shortName={oppShort}
                        color={m.opponent?.color || '#121826'}
                        logoUrl={m.opponent?.logoUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-[#111827] truncate">
                          vs {m.opponent?.name || oppShort}
                        </h3>
                        {m.matchResultText && (
                          <p className="text-[11px] text-gray-500 truncate">{m.matchResultText}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-[#F9FAFB] p-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Batting
                      </div>
                      <div className="mt-1 text-sm font-black tabular-nums text-[#111827]">
                        {batted ? `${m.batting.runs}${m.batting.notOut ? '*' : ''}` : 'Did not bat'}
                      </div>
                      {batted && (
                        <div className="text-[11px] text-gray-500 tabular-nums">
                          {m.batting.balls}b · {m.batting.fours}x4 · {m.batting.sixes}x6
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 border-l border-gray-200/70 pl-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Bowling
                      </div>
                      <div className="mt-1 text-sm font-black tabular-nums text-[#7A1426]">
                        {bowled ? `${m.bowling.wickets}/${m.bowling.runsConceded}` : 'Did not bowl'}
                      </div>
                      {bowled && (
                        <div className="text-[11px] text-gray-500 tabular-nums">
                          {m.bowling.overs} ov · Econ {m.bowling.economy.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {m.isPlayerOfMatch ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                        <Award className="h-3 w-3" aria-hidden="true" />
                        Player of Match
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400">
                        {m.format || 'T20'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenMatch(m.matchId)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] cursor-pointer"
                    >
                      Scorecard
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

