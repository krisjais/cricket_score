'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Trophy,
  Crown,
  Award,
  RefreshCcw,
  Shield,
  Sparkles,
  Users,
  CalendarCheck2,
  Flame,
  Zap,
} from 'lucide-react'
import { api, getSocket } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'
import { cn } from '@/lib/utils'

export interface AwardPlayerStat {
  playerId: string
  playerCode?: string | null
  name: string
  role: string
  gender: 'MALE' | 'FEMALE'
  jerseyNumber: number | null
  avatarUrl: string | null
  team: {
    id: string
    name: string
    shortName: string
    color: string
    logoUrl: string | null
  } | null
  matches: number
  inningsBatted: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  highestScore: number
  strikeRate: number
  legalBalls: number
  overs: string
  runsConceded: number
  wickets: number
  economy: number
  catches: number
  runOuts: number
  stumpings: number
  catchRunOuts?: number
  fieldingDismissals: number
  mvpPoints: number
}

interface DivisionAwards {
  playerCount: number
  playerOfTournament: AwardPlayerStat | null
  bestBatsman: AwardPlayerStat | null
  bestBowler: AwardPlayerStat | null
  bestFielder: AwardPlayerStat | null
  mostSixes?: AwardPlayerStat | null
  mostFours?: AwardPlayerStat | null
  topMvp: AwardPlayerStat[]
  topBatsmen: AwardPlayerStat[]
  topBowlers: AwardPlayerStat[]
  topFielders: AwardPlayerStat[]
  topSixes?: AwardPlayerStat[]
  topFours?: AwardPlayerStat[]
}

interface AwardsPayload {
  summary: {
    totalMatches: number
    completedMatches: number
    liveMatches: number
    totalPlayers: number
    menPlayers: number
    womenPlayers: number
  }
  men: DivisionAwards
  women: DivisionAwards
}

type LeaderboardTab = 'BATSMEN' | 'BOWLERS' | 'FIELDERS' | 'MVP' | 'SIXES' | 'FOURS'
type CardAccent = 'maroon' | 'gold' | 'slate' | 'teal' | 'indigo' | 'emerald'

interface MiniStat {
  label: string
  value: string | number
}

const ACCENT_THEMES: Record<
  CardAccent,
  {
    topBar: string
    iconBg: string
    badgeText: string
    statText: string
    avatarRing: string
    highlightBg: string
  }
> = {
  maroon: {
    topBar: 'from-[#7A1426] via-[#9E1C34] to-[#C89B3C]',
    iconBg: 'bg-[#7A1426] text-white',
    badgeText: 'text-[#7A1426]',
    statText: 'text-[#7A1426]',
    avatarRing: 'ring-2 ring-[#7A1426]/20',
    highlightBg: 'bg-[#7A1426]/[0.03]',
  },
  gold: {
    topBar: 'from-[#B45309] via-[#D97706] to-[#F59E0B]',
    iconBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-800',
    statText: 'text-amber-700',
    avatarRing: 'ring-2 ring-amber-500/25',
    highlightBg: 'bg-amber-50/40',
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
  indigo: {
    topBar: 'from-[#3730A3] via-[#4F46E5] to-[#6366F1]',
    iconBg: 'bg-indigo-600 text-white',
    badgeText: 'text-indigo-800',
    statText: 'text-indigo-700',
    avatarRing: 'ring-2 ring-indigo-500/25',
    highlightBg: 'bg-indigo-50/40',
  },
  emerald: {
    topBar: 'from-[#047857] via-[#059669] to-[#10B981]',
    iconBg: 'bg-emerald-600 text-white',
    badgeText: 'text-emerald-800',
    statText: 'text-emerald-700',
    avatarRing: 'ring-2 ring-emerald-500/25',
    highlightBg: 'bg-emerald-50/40',
  },
}

const ROLE_LABEL: Record<string, string> = {
  BATTER: 'Batter',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WICKETKEEPER: 'Wicketkeeper',
}

export function AwardsPage({
  navigate,
  isAdmin = false,
  embedded = false,
}: {
  navigate: (to: string) => void
  isAdmin?: boolean
  embedded?: boolean
}) {
  const [data, setData] = useState<AwardsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [divisionFilter, setDivisionFilter] = useState<'ALL' | 'MEN' | 'WOMEN'>('ALL')

  const loadAwards = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await api<AwardsPayload>('/api/awards')
      setData(res)
    } catch {
      // keep existing snapshot on transient failures
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    api<AwardsPayload>('/api/awards')
      .then((res) => {
        if (alive) setData(res)
      })
      .catch(() => {
        // keep existing snapshot on transient failures
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    const sock = getSocket()
    const onUpdate = () => void loadAwards(true)
    sock.on('matches:update', onUpdate)
    sock.on('match:update', onUpdate)
    return () => {
      alive = false
      sock.off('matches:update', onUpdate)
      sock.off('match:update', onUpdate)
    }
  }, [loadAwards])

  return (
    <div className="space-y-6">
      {/* Standalone Page Header (hidden when embedded inside PointsTablePage) */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-[#7A1426]" />
              <span>Tournament Awards &amp; Leaders</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Separate Men&apos;s and Women&apos;s standings for Best Batsman, Best Bowler, Best Fielder, and MVP.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAwards(false)}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* ===================== EXECUTIVE SUMMARY STRIP ===================== */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <SummaryKpiCard
            icon={<CalendarCheck2 className="w-4 h-4 text-[#7A1426]" />}
            iconBg="bg-[#7A1426]/10"
            label="Matches Tracked"
            value={String(data.summary.totalMatches)}
            hint={`${data.summary.completedMatches} completed • ${data.summary.liveMatches} live`}
          />
          <SummaryKpiCard
            icon={<Users className="w-4 h-4 text-[#121826]" />}
            iconBg="bg-slate-100"
            label="Men's Division"
            value={String(data.summary.menPlayers)}
            hint="Male players competing"
          />
          <SummaryKpiCard
            icon={<Crown className="w-4 h-4 text-rose-700" />}
            iconBg="bg-rose-50"
            label="Women's Division"
            value={String(data.summary.womenPlayers)}
            hint="Female players competing"
          />
          <SummaryKpiCard
            icon={<Flame className="w-4 h-4 text-amber-600" />}
            iconBg="bg-amber-50"
            label="MVP Point System"
            value="1 / 20 / 10"
            hint="1 pt/run • 20/wkt • 10/out"
          />
        </div>
      )}

      {/* ===================== DIVISION FILTER & REFRESH BAR ===================== */}
      <section
        aria-label="Division filter"
        className="bg-white border border-gray-200 rounded-2xl p-2 sm:p-1.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div
          role="tablist"
          aria-label="Filter tournament awards by division"
          className="grid grid-cols-2 sm:inline-flex items-stretch sm:items-center gap-1.5 w-full sm:w-auto"
        >
          {(
            [
              ['ALL', 'Both Divisions', null],
              ['MEN', "Men's Awards", data?.men.playerCount ?? 0],
              ['WOMEN', "Women's Awards", data?.women.playerCount ?? 0],
            ] as const
          ).map(([key, label, count]) => {
            const active = divisionFilter === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDivisionFilter(key)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap',
                  key === 'ALL' && 'col-span-2 sm:col-span-1',
                  active
                    ? 'bg-[#7A1426] border-[#7A1426] text-white shadow-xs'
                    : 'bg-[#F8F9FB] border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-[#111827]'
                )}
              >
                <span>{label}</span>
                {count !== null && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums leading-none',
                      active ? 'bg-white/20 text-white' : 'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {embedded && (
          <button
            type="button"
            onClick={() => void loadAwards(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#F8F9FB] border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            title="Refresh live tournament awards"
          >
            <RefreshCcw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>Refresh Live Leaders</span>
          </button>
        )}
      </section>

      {/* ===================== MAIN CONTENT ===================== */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200/70" />
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs font-medium text-gray-500">
          Unable to load tournament awards right now.
        </div>
      ) : (
        <div className="space-y-8">
          {(divisionFilter === 'ALL' || divisionFilter === 'MEN') && (
            <DivisionShowcase
              division="MEN"
              title="Men's Division Honors"
              mvpTitle="Man of the Tournament"
              awards={data.men}
              navigate={navigate}
              isAdmin={isAdmin}
            />
          )}

          {(divisionFilter === 'ALL' || divisionFilter === 'WOMEN') && (
            <DivisionShowcase
              division="WOMEN"
              title="Women's Division Honors"
              mvpTitle="Woman of the Tournament"
              awards={data.women}
              navigate={navigate}
              isAdmin={isAdmin}
            />
          )}
        </div>
      )}
    </div>
  )
}

function SummaryKpiCard({
  icon,
  iconBg,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-600 leading-tight">
          {label}
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-xl font-extrabold text-[#111827] tabular-nums leading-tight">
          {value}
        </div>
        <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{hint}</div>
      </div>
    </div>
  )
}

function DivisionShowcase({
  division,
  title,
  mvpTitle,
  awards,
  navigate,
  isAdmin,
}: {
  division: 'MEN' | 'WOMEN'
  title: string
  mvpTitle: string
  awards: DivisionAwards
  navigate: (to: string) => void
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<LeaderboardTab>('BATSMEN')
  const isWomen = division === 'WOMEN'

  const tableRows =
    tab === 'BATSMEN'
      ? awards.topBatsmen
      : tab === 'BOWLERS'
      ? awards.topBowlers
      : tab === 'FIELDERS'
      ? awards.topFielders
      : tab === 'SIXES'
      ? (awards.topSixes ?? [])
      : tab === 'FOURS'
      ? (awards.topFours ?? [])
      : awards.topMvp

  return (
    <section className="space-y-4">
      {/* Division Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7A1426]/10 border border-[#7A1426]/15 flex items-center justify-center">
            <Crown className="w-4.5 h-4.5 text-[#7A1426]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">{title}</h2>
            <p className="text-xs text-gray-500">
              {awards.playerCount} registered {isWomen ? 'female' : 'male'} player
              {awards.playerCount === 1 ? '' : 's'} competing separately
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-gray-200 text-[#7A1426] shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7A1426]" />
          <span>{isWomen ? 'Women Category' : 'Men Category'}</span>
        </span>
      </div>

      {/* Empty Division State when 0 players exist in this gender */}
      {awards.playerCount === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5 max-w-xl">
            <div className="w-11 h-11 rounded-2xl bg-[#7A1426]/8 border border-[#7A1426]/15 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-[#7A1426]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                {title} Ready for Registration
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                No {isWomen ? 'female' : 'male'} players are registered yet. As soon as players are added under
                this division and matches begin, leaders for all {isWomen ? 4 : 6} honor categories populate automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0">
            {(isWomen
              ? [mvpTitle, 'Best Batsman', 'Best Bowler', 'Best Fielder']
              : [mvpTitle, 'Best Batsman', 'Best Bowler', 'Best Fielder', 'Most 6s', 'Most 4s']
            ).map((label) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] font-semibold text-gray-600"
              >
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Spotlight Award Trophy Cards (6 in Men's incl. Most 6s & Most 4s; 4 in Women's) */}
          <div
            className={cn(
              'grid gap-4 grid-cols-1 sm:grid-cols-2',
              isWomen ? 'xl:grid-cols-4' : 'lg:grid-cols-3'
            )}
          >
            <AwardSpotlightCard
              title={mvpTitle}
              subtitle="All-Round MVP Impact"
              badgeLabel="#1 MVP"
              player={awards.playerOfTournament}
              accent="maroon"
              icon={<Crown className="w-4 h-4" />}
              statValue={awards.playerOfTournament ? String(awards.playerOfTournament.mvpPoints) : '—'}
              statUnit={
                awards.playerOfTournament
                  ? awards.playerOfTournament.mvpPoints === 1
                    ? 'Point'
                    : 'Points'
                  : ''
              }
              miniStats={
                awards.playerOfTournament
                  ? [
                      { label: 'Runs', value: awards.playerOfTournament.runs },
                      { label: 'Wkts', value: awards.playerOfTournament.wickets },
                      { label: 'Fielding', value: awards.playerOfTournament.fieldingDismissals },
                    ]
                  : []
              }
              emptyText="Runs, wickets & fielding earn MVP points"
              navigate={navigate}
              isAdmin={isAdmin}
            />

            <AwardSpotlightCard
              title="Best Batsman"
              subtitle="Highest Run Scorer"
              badgeLabel="Golden Bat"
              player={awards.bestBatsman}
              accent="gold"
              icon={<CricketBatIcon size={15} />}
              statValue={awards.bestBatsman ? String(awards.bestBatsman.runs) : '—'}
              statUnit={
                awards.bestBatsman ? (awards.bestBatsman.runs === 1 ? 'Run' : 'Runs') : ''
              }
              miniStats={
                awards.bestBatsman
                  ? [
                      { label: 'Balls', value: awards.bestBatsman.ballsFaced },
                      { label: 'SR', value: awards.bestBatsman.strikeRate.toFixed(1) },
                      { label: '4s / 6s', value: `${awards.bestBatsman.fours}/${awards.bestBatsman.sixes}` },
                    ]
                  : []
              }
              emptyText="Top run scorer appears after batting stats"
              navigate={navigate}
              isAdmin={isAdmin}
            />

            <AwardSpotlightCard
              title="Best Bowler"
              subtitle="Most Tournament Wickets"
              badgeLabel="Top Wickets"
              player={awards.bestBowler}
              accent="slate"
              icon={<CricketBallIcon size={14} variant="white" />}
              statValue={awards.bestBowler ? String(awards.bestBowler.wickets) : '—'}
              statUnit={
                awards.bestBowler ? (awards.bestBowler.wickets === 1 ? 'Wicket' : 'Wickets') : ''
              }
              miniStats={
                awards.bestBowler
                  ? [
                      { label: 'Overs', value: awards.bestBowler.overs },
                      { label: 'Econ', value: awards.bestBowler.economy.toFixed(2) },
                      { label: 'Runs', value: awards.bestBowler.runsConceded },
                    ]
                  : []
              }
              emptyText="Leading wicket-taker appears on first dismissal"
              navigate={navigate}
              isAdmin={isAdmin}
            />

            <AwardSpotlightCard
              title="Best Fielder"
              subtitle="Most Catches & Run Outs"
              badgeLabel="Safe Hands"
              player={awards.bestFielder}
              accent="teal"
              icon={<CricketStumpsIcon size={15} broken />}
              statValue={
                awards.bestFielder
                  ? String(
                      awards.bestFielder.catchRunOuts ??
                        awards.bestFielder.catches + awards.bestFielder.runOuts
                    )
                  : '—'
              }
              statUnit={
                awards.bestFielder
                  ? (awards.bestFielder.catchRunOuts ??
                      awards.bestFielder.catches + awards.bestFielder.runOuts) === 1
                    ? 'Catch / Run Out'
                    : 'Catches & Run Outs'
                  : ''
              }
              miniStats={
                awards.bestFielder
                  ? [
                      { label: 'Catches', value: awards.bestFielder.catches },
                      { label: 'Run Outs', value: awards.bestFielder.runOuts },
                      { label: 'Stumped', value: awards.bestFielder.stumpings },
                    ]
                  : []
              }
              emptyText="Record catches & run-outs on wickets"
              navigate={navigate}
              isAdmin={isAdmin}
            />

            {!isWomen && (
              <>
                <AwardSpotlightCard
                  title="Most 6s"
                  subtitle="6 Runs in One Ball"
                  badgeLabel="Maximum 6s"
                  player={awards.mostSixes ?? null}
                  accent="indigo"
                  icon={<Flame className="w-4 h-4" />}
                  statValue={awards.mostSixes ? String(awards.mostSixes.sixes) : '—'}
                  statUnit={
                    awards.mostSixes ? (awards.mostSixes.sixes === 1 ? 'Six' : 'Sixes') : ''
                  }
                  miniStats={
                    awards.mostSixes
                      ? [
                          { label: 'Runs', value: awards.mostSixes.runs },
                          { label: '4s', value: awards.mostSixes.fours },
                          { label: 'SR', value: awards.mostSixes.strikeRate.toFixed(1) },
                        ]
                      : []
                  }
                  emptyText="Hit 6 in a single ball to lead Most 6s"
                  navigate={navigate}
                  isAdmin={isAdmin}
                />

                <AwardSpotlightCard
                  title="Most 4s"
                  subtitle="4 Runs in One Ball"
                  badgeLabel="Boundary King"
                  player={awards.mostFours ?? null}
                  accent="emerald"
                  icon={<Zap className="w-4 h-4" />}
                  statValue={awards.mostFours ? String(awards.mostFours.fours) : '—'}
                  statUnit={
                    awards.mostFours ? (awards.mostFours.fours === 1 ? 'Four' : 'Fours') : ''
                  }
                  miniStats={
                    awards.mostFours
                      ? [
                          { label: 'Runs', value: awards.mostFours.runs },
                          { label: '6s', value: awards.mostFours.sixes },
                          { label: 'SR', value: awards.mostFours.strikeRate.toFixed(1) },
                        ]
                      : []
                  }
                  emptyText="Hit 4 in a single ball to lead Most 4s"
                  navigate={navigate}
                  isAdmin={isAdmin}
                />
              </>
            )}
          </div>

          {/* Interactive Division Leaderboard Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#7A1426]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#111827]">
                  {isWomen ? "Women's" : "Men's"} Leaderboard Rankings
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 tabular-nums">
                  {tableRows.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 bg-[#F4F5F7] border border-gray-200 p-1 rounded-xl">
                {(
                  (isWomen
                    ? [
                        ['BATSMEN', 'Top Batsmen'],
                        ['BOWLERS', 'Top Bowlers'],
                        ['FIELDERS', 'Best Fielders'],
                        ['MVP', 'MVP Race'],
                      ]
                    : [
                        ['BATSMEN', 'Top Batsmen'],
                        ['BOWLERS', 'Top Bowlers'],
                        ['FIELDERS', 'Best Fielders'],
                        ['SIXES', 'Most 6s'],
                        ['FOURS', 'Most 4s'],
                        ['MVP', 'MVP Race'],
                      ]) as readonly [LeaderboardTab, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                      tab === key
                        ? 'bg-[#7A1426] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-[#111827]'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tableRows.length === 0 ? (
              <div className="py-10 px-6 text-center text-xs text-gray-500">
                No recorded {tab.toLowerCase()} stats yet for {isWomen ? 'women' : 'men'} players.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-gray-200">
                    <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="pl-5 py-3 w-14">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Team</th>
                      {tab === 'BATSMEN' && (
                        <>
                          <th className="px-3 py-3 text-right">Runs</th>
                          <th className="px-3 py-3 text-right">Balls</th>
                          <th className="px-3 py-3 text-right">4s / 6s</th>
                          <th className="px-3 py-3 text-right">HS</th>
                          <th className="pr-5 py-3 text-right">SR</th>
                        </>
                      )}
                      {tab === 'BOWLERS' && (
                        <>
                          <th className="px-3 py-3 text-right">Wkts</th>
                          <th className="px-3 py-3 text-right">Overs</th>
                          <th className="px-3 py-3 text-right">Runs</th>
                          <th className="pr-5 py-3 text-right">Econ</th>
                        </>
                      )}
                      {tab === 'FIELDERS' && (
                        <>
                          <th className="px-3 py-3 text-right">Catches</th>
                          <th className="px-3 py-3 text-right">Run Outs</th>
                          <th className="px-3 py-3 text-right">Stumped</th>
                          <th className="pr-5 py-3 text-right">Catch + RO</th>
                        </>
                      )}
                      {tab === 'MVP' && (
                        <>
                          <th className="px-3 py-3 text-right">Runs</th>
                          <th className="px-3 py-3 text-right">Wkts</th>
                          <th className="px-3 py-3 text-right">Fielding</th>
                          <th className="pr-5 py-3 text-right">MVP Pts</th>
                        </>
                      )}
                      {tab === 'SIXES' && (
                        <>
                          <th className="px-3 py-3 text-right">6s</th>
                          <th className="px-3 py-3 text-right">Runs</th>
                          <th className="px-3 py-3 text-right">Balls</th>
                          <th className="px-3 py-3 text-right">4s</th>
                          <th className="pr-5 py-3 text-right">SR</th>
                        </>
                      )}
                      {tab === 'FOURS' && (
                        <>
                          <th className="px-3 py-3 text-right">4s</th>
                          <th className="px-3 py-3 text-right">Runs</th>
                          <th className="px-3 py-3 text-right">Balls</th>
                          <th className="px-3 py-3 text-right">6s</th>
                          <th className="pr-5 py-3 text-right">SR</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableRows.map((p, idx) => (
                      <tr
                        key={p.playerId}
                        className={cn(
                          'hover:bg-[#F9FAFB] transition-colors',
                          idx === 0 && 'bg-[#7A1426]/[0.025]'
                        )}
                      >
                        <td className="pl-5 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold tabular-nums',
                              idx === 0
                                ? 'bg-[#7A1426] text-white shadow-2xs'
                                : idx === 1
                                ? 'bg-gray-200 text-gray-800'
                                : idx === 2
                                ? 'bg-amber-100 text-amber-900'
                                : 'text-gray-500'
                            )}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                            <div>
                              <div className="font-bold text-sm text-[#111827] leading-tight">
                                {!isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/players/${encodeURIComponent(p.playerId)}`)}
                                    className="hover:text-[#7A1426] hover:underline cursor-pointer text-left font-bold"
                                  >
                                    {p.name}
                                  </button>
                                ) : (
                                  p.name
                                )}
                              </div>
                              <div className="text-[10px] font-semibold text-gray-400">
                                {ROLE_LABEL[p.role] ?? p.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.team ? (
                            <button
                              type="button"
                              onClick={() => !isAdmin && navigate(`/team/${p.team!.id}`)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-[#111827]',
                                !isAdmin && 'hover:border-[#7A1426]/40 hover:text-[#7A1426] cursor-pointer'
                              )}
                            >
                              <TeamLogo
                                name={p.team.name}
                                shortName={p.team.shortName}
                                color={p.team.color}
                                logoUrl={p.team.logoUrl}
                                size="xs"
                              />
                              <span>{p.team.shortName}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {tab === 'BATSMEN' && (
                          <>
                            <td className="px-3 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.runs}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.ballsFaced}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.fours}/{p.sixes}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.highestScore}
                            </td>
                            <td className="pr-5 py-3 text-right font-bold tabular-nums text-[#111827]">
                              {p.strikeRate.toFixed(1)}
                            </td>
                          </>
                        )}

                        {tab === 'BOWLERS' && (
                          <>
                            <td className="px-3 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.wickets}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.overs}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.runsConceded}
                            </td>
                            <td className="pr-5 py-3 text-right font-bold tabular-nums text-[#111827]">
                              {p.economy.toFixed(2)}
                            </td>
                          </>
                        )}

                        {tab === 'FIELDERS' && (
                          <>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-[#111827]">
                              {p.catches}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-[#111827]">
                              {p.runOuts}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.stumpings}
                            </td>
                            <td className="pr-5 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.catchRunOuts ?? p.catches + p.runOuts}
                            </td>
                          </>
                        )}

                        {tab === 'MVP' && (
                          <>
                            <td className="px-3 py-3 text-right tabular-nums text-[#111827]">
                              {p.runs}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-[#111827]">
                              {p.wickets}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.fieldingDismissals}
                            </td>
                            <td className="pr-5 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.mvpPoints}
                            </td>
                          </>
                        )}

                        {tab === 'SIXES' && (
                          <>
                            <td className="px-3 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.sixes}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-[#111827]">
                              {p.runs}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.ballsFaced}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.fours}
                            </td>
                            <td className="pr-5 py-3 text-right font-bold tabular-nums text-[#111827]">
                              {p.strikeRate.toFixed(1)}
                            </td>
                          </>
                        )}

                        {tab === 'FOURS' && (
                          <>
                            <td className="px-3 py-3 text-right font-extrabold text-sm text-[#7A1426] tabular-nums">
                              {p.fours}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-[#111827]">
                              {p.runs}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.ballsFaced}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                              {p.sixes}
                            </td>
                            <td className="pr-5 py-3 text-right font-bold tabular-nums text-[#111827]">
                              {p.strikeRate.toFixed(1)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function AwardSpotlightCard({
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
  isAdmin,
}: {
  title: string
  subtitle: string
  badgeLabel: string
  player: AwardPlayerStat | null
  accent: CardAccent
  icon: React.ReactNode
  statValue: string
  statUnit: string
  miniStats: MiniStat[]
  emptyText: string
  navigate: (to: string) => void
  isAdmin: boolean
}) {
  const theme = ACCENT_THEMES[accent]

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Sleek Top Accent Ribbon */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', theme.topBar)} />

      {/* Header */}
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

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {player ? (
          <>
            {/* Leader Identity */}
            <div className="flex items-center gap-3">
              <PlayerAvatar
                name={player.name}
                avatarUrl={player.avatarUrl}
                size="lg"
                ringClass={theme.avatarRing}
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-base text-[#111827] truncate leading-snug">
                  {!isAdmin ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/players/${encodeURIComponent(player.playerId)}`)}
                      className="hover:text-[#7A1426] hover:underline cursor-pointer text-left truncate max-w-full"
                    >
                      {player.name}
                    </button>
                  ) : (
                    player.name
                  )}
                </div>
                {player.team ? (
                  <button
                    type="button"
                    onClick={() => !isAdmin && navigate(`/team/${player.team!.id}`)}
                    className={cn(
                      'mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600',
                      !isAdmin && 'hover:text-[#7A1426] cursor-pointer'
                    )}
                  >
                    <TeamLogo
                      name={player.team.name}
                      shortName={player.team.shortName}
                      color={player.team.color}
                      logoUrl={player.team.logoUrl}
                      size="xs"
                    />
                    <span className="truncate">{player.team.name}</span>
                  </button>
                ) : (
                  <span className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Free Agent
                  </span>
                )}
              </div>
            </div>

            {/* Hero Metric & Breakdown Grid */}
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
          <div className="my-auto rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-6 px-4 text-center space-y-1.5">
            <div className="mx-auto w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
              {icon}
            </div>
            <div className="text-xs font-bold text-gray-600">Awaiting First Leader</div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerAvatar({
  name,
  avatarUrl,
  size = 'sm',
  ringClass,
}: {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'lg'
  ringClass?: string
}) {
  const dim = size === 'lg' ? 'w-12 h-12 text-sm rounded-2xl' : 'w-8 h-8 text-[11px] rounded-full'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('object-cover border border-gray-200 bg-white shrink-0', dim, ringClass)}
      />
    )
  }
  return (
    <div
      className={cn(
        'bg-[#7A1426]/8 border border-[#7A1426]/15 flex items-center justify-center font-extrabold text-[#7A1426] shrink-0',
        dim,
        ringClass
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
