'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trophy, Crown, Award, RefreshCcw, Shield, Sparkles } from 'lucide-react'
import { api, getSocket } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import {
  CricketGroundBackdrop,
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'
import { cn } from '@/lib/utils'

export interface AwardPlayerStat {
  playerId: string
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
  fieldingDismissals: number
  mvpPoints: number
}

interface DivisionAwards {
  playerCount: number
  playerOfTournament: AwardPlayerStat | null
  bestBatsman: AwardPlayerStat | null
  bestBowler: AwardPlayerStat | null
  bestFielder: AwardPlayerStat | null
  topMvp: AwardPlayerStat[]
  topBatsmen: AwardPlayerStat[]
  topBowlers: AwardPlayerStat[]
  topFielders: AwardPlayerStat[]
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

type LeaderboardTab = 'BATSMEN' | 'BOWLERS' | 'FIELDERS' | 'MVP'

export function AwardsPage({
  navigate,
  isAdmin = false,
}: {
  navigate: (to: string) => void
  isAdmin?: boolean
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
    void loadAwards(true)
    const sock = getSocket()
    const onUpdate = () => void loadAwards(true)
    sock.on('matches:update', onUpdate)
    sock.on('match:update', onUpdate)
    return () => {
      sock.off('matches:update', onUpdate)
      sock.off('match:update', onUpdate)
    }
  }, [loadAwards])

  return (
    <div className="space-y-8">
      {/* ===================== HERO HEADER ===================== */}
      <CricketGroundBackdrop className="border border-[#c59b27]/35 shadow-lg" showPitch={false}>
        <div className="p-6 sm:p-8 bg-gradient-to-r from-black/75 via-black/55 to-black/75 backdrop-blur-[2px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 text-[#c59b27] text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>Tournament Honor Roll • Men &amp; Women</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-white tracking-tight">
                Tournament Awards &amp; Leaderboards
              </h1>
              <p className="text-xs sm:text-sm text-[#f8f6f0]/80 leading-relaxed">
                Separate official standings for Men&apos;s and Women&apos;s divisions — tracking Top Run Scorers,
                Highest Wicket Takers, Best Fielders (Catches &amp; Run Outs), and Players of the Tournament live.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {data && (
                <div className="bg-black/45 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white/85 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-serif font-black text-[#c59b27] leading-none">
                      {data.summary.totalMatches}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/60 mt-1">Matches</div>
                  </div>
                  <div className="h-7 w-px bg-white/15" />
                  <div className="text-center">
                    <div className="text-lg font-serif font-black text-emerald-400 leading-none">
                      {data.summary.menPlayers}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/60 mt-1">Men</div>
                  </div>
                  <div className="h-7 w-px bg-white/15" />
                  <div className="text-center">
                    <div className="text-lg font-serif font-black text-rose-300 leading-none">
                      {data.summary.womenPlayers}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/60 mt-1">Women</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => void loadAwards(false)}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCcw className={cn('w-3.5 h-3.5 text-[#c59b27]', refreshing && 'animate-spin')} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </CricketGroundBackdrop>

      {/* ===================== DIVISION FILTER PILLS ===================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4efe6] border border-[#e8e2d5] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setDivisionFilter('ALL')}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              divisionFilter === 'ALL'
                ? 'bg-[#0d3a24] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#0d3a24]'
            )}
          >
            Both Divisions
          </button>
          <button
            type="button"
            onClick={() => setDivisionFilter('MEN')}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              divisionFilter === 'MEN'
                ? 'bg-[#0d3a24] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#0d3a24]'
            )}
          >
            Men&apos;s Awards ({data?.men.playerCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setDivisionFilter('WOMEN')}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              divisionFilter === 'WOMEN'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-[#6b7280] hover:text-rose-700'
            )}
          >
            Women&apos;s Awards ({data?.women.playerCount ?? 0})
          </button>
        </div>

        <span className="text-[11px] font-medium text-[#6b7280]">
          MVP Formula: <b className="text-[#0d3a24]">1 pt/run</b> • <b className="text-[#0d3a24]">20 pts/wicket</b> •{' '}
          <b className="text-[#0d3a24]">10 pts/catch or run-out</b>
        </span>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#e8e2d5]/60" />
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center text-xs text-[#6b7280]">
          Unable to load tournament awards right now.
        </div>
      ) : (
        <div className="space-y-10">
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
      : awards.topMvp

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e2d5] pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs',
              isWomen
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-[#0d3a24]/10 border border-[#0d3a24]/20 text-[#0d3a24]'
            )}
          >
            <Crown className="w-5 h-5 text-[#c59b27]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111827]">{title}</h2>
            <p className="text-xs text-[#6b7280]">
              {awards.playerCount} registered {isWomen ? 'female' : 'male'} player{awards.playerCount === 1 ? '' : 's'} competing separately
            </p>
          </div>
        </div>

        <span
          className={cn(
            'text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border',
            isWomen
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[#f4efe6] border-[#e8e2d5] text-[#0d3a24]'
          )}
        >
          {isWomen ? 'Women Category' : 'Men Category'}
        </span>
      </div>

      {/* 4 Spotlight Award Trophy Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Man / Woman of the Tournament */}
        <AwardSpotlightCard
          title={mvpTitle}
          subtitle="Highest All-Round MVP Impact"
          player={awards.playerOfTournament}
          accent={isWomen ? 'rose' : 'gold'}
          icon={<Crown className="w-4 h-4" />}
          primaryStat={
            awards.playerOfTournament
              ? `${awards.playerOfTournament.mvpPoints} pts`
              : '—'
          }
          secondaryStat={
            awards.playerOfTournament
              ? `${awards.playerOfTournament.runs}R • ${awards.playerOfTournament.wickets}W • ${awards.playerOfTournament.fieldingDismissals}F`
              : 'Awaiting match stats'
          }
          emptyText="Scored runs, wickets & fielding determine MVP"
          navigate={navigate}
          isAdmin={isAdmin}
        />

        {/* 2. Best Batsman */}
        <AwardSpotlightCard
          title="Best Batsman"
          subtitle="Most Tournament Runs"
          player={awards.bestBatsman}
          accent="emerald"
          icon={<CricketBatIcon size={15} />}
          primaryStat={awards.bestBatsman ? `${awards.bestBatsman.runs} Runs` : '—'}
          secondaryStat={
            awards.bestBatsman
              ? `${awards.bestBatsman.ballsFaced}b • SR ${awards.bestBatsman.strikeRate.toFixed(1)} • ${awards.bestBatsman.fours}x4 ${awards.bestBatsman.sixes}x6`
              : 'No runs scored yet'
          }
          emptyText="Top run scorer will appear here"
          navigate={navigate}
          isAdmin={isAdmin}
        />

        {/* 3. Best Bowler */}
        <AwardSpotlightCard
          title="Best Bowler"
          subtitle="Most Tournament Wickets"
          player={awards.bestBowler}
          accent="dark"
          icon={<CricketBallIcon size={14} variant="red" />}
          primaryStat={awards.bestBowler ? `${awards.bestBowler.wickets} Wkts` : '—'}
          secondaryStat={
            awards.bestBowler
              ? `${awards.bestBowler.overs} ov • Econ ${awards.bestBowler.economy.toFixed(2)} • ${awards.bestBowler.runsConceded}R`
              : 'No wickets taken yet'
          }
          emptyText="Highest wicket taker will appear here"
          navigate={navigate}
          isAdmin={isAdmin}
        />

        {/* 4. Best Fielder */}
        <AwardSpotlightCard
          title="Best Fielder"
          subtitle="Most Catches & Run Outs"
          player={awards.bestFielder}
          accent="amber"
          icon={<CricketStumpsIcon size={15} broken />}
          primaryStat={
            awards.bestFielder
              ? `${awards.bestFielder.fieldingDismissals} Outs`
              : '—'
          }
          secondaryStat={
            awards.bestFielder
              ? `${awards.bestFielder.catches} Catch${awards.bestFielder.catches === 1 ? '' : 'es'} • ${awards.bestFielder.runOuts} Run Out${awards.bestFielder.runOuts === 1 ? '' : 's'}${awards.bestFielder.stumpings > 0 ? ` • ${awards.bestFielder.stumpings} St` : ''}`
              : 'No fielding dismissals yet'
          }
          emptyText="Record fielder catches & run outs during wickets"
          navigate={navigate}
          isAdmin={isAdmin}
        />
      </div>

      {/* Interactive Division Leaderboard Table */}
      <div className="rounded-2xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-[#faf8f5] border-b border-[#e8e2d5]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0d3a24] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#c59b27]" />
            <span>{isWomen ? "Women's" : "Men's"} Leaderboard Rankings</span>
          </span>

          <div className="flex flex-wrap gap-1 bg-[#f4efe6] border border-[#e8e2d5] p-1 rounded-xl">
            {(
              [
                ['BATSMEN', 'Top Batsmen (Runs)'],
                ['BOWLERS', 'Top Bowlers (Wkts)'],
                ['FIELDERS', 'Best Fielders (Catches & Run Outs)'],
                ['MVP', 'MVP Race'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                  tab === key
                    ? isWomen
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'bg-[#0d3a24] text-white shadow-2xs'
                    : 'text-[#6b7280] hover:text-[#111827]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tableRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6b7280]">
            No recorded stats in this category yet for {isWomen ? 'women' : 'men'} players.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4efe6]/70 border-b border-[#e8e2d5]">
                <tr className="font-bold text-[#0d3a24] uppercase tracking-wider">
                  <th className="pl-5 py-3 w-12">Rank</th>
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
                      <th className="px-3 py-3 text-right">Stumpings</th>
                      <th className="pr-5 py-3 text-right">Total Outs</th>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d5]">
                {tableRows.map((p, idx) => (
                  <tr
                    key={p.playerId}
                    className={cn(
                      'hover:bg-[#f8f6f0] transition-colors',
                      idx === 0 && 'bg-amber-50/40'
                    )}
                  >
                    <td className="pl-5 py-3 font-mono font-black">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]',
                          idx === 0
                            ? 'bg-[#c59b27] text-white'
                            : idx === 1
                            ? 'bg-[#e8e2d5] text-[#111827]'
                            : idx === 2
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-[#6b7280]'
                        )}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                        <span className="font-bold text-sm text-[#111827]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.team ? (
                        <button
                          type="button"
                          onClick={() => !isAdmin && navigate(`/team/${p.team!.id}`)}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d3a24]',
                            !isAdmin && 'hover:underline cursor-pointer'
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
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {tab === 'BATSMEN' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono font-black text-sm text-[#0d3a24] tabular-nums">
                          {p.runs}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.ballsFaced}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.fours}/{p.sixes}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.highestScore}
                        </td>
                        <td className="pr-5 py-3 text-right font-mono font-bold tabular-nums text-[#111827]">
                          {p.strikeRate.toFixed(1)}
                        </td>
                      </>
                    )}

                    {tab === 'BOWLERS' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono font-black text-sm text-[#0d3a24] tabular-nums">
                          {p.wickets}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.overs}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.runsConceded}
                        </td>
                        <td className="pr-5 py-3 text-right font-mono font-bold tabular-nums text-[#111827]">
                          {p.economy.toFixed(2)}
                        </td>
                      </>
                    )}

                    {tab === 'FIELDERS' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-[#111827]">
                          {p.catches}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-[#111827]">
                          {p.runOuts}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.stumpings}
                        </td>
                        <td className="pr-5 py-3 text-right font-mono font-black text-sm text-[#0d3a24] tabular-nums">
                          {p.fieldingDismissals}
                        </td>
                      </>
                    )}

                    {tab === 'MVP' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#111827]">
                          {p.runs}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#111827]">
                          {p.wickets}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-[#6b7280]">
                          {p.fieldingDismissals}
                        </td>
                        <td className="pr-5 py-3 text-right font-mono font-black text-sm text-[#c59b27] tabular-nums">
                          {p.mvpPoints}
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
    </section>
  )
}

function AwardSpotlightCard({
  title,
  subtitle,
  player,
  accent,
  icon,
  primaryStat,
  secondaryStat,
  emptyText,
  navigate,
  isAdmin,
}: {
  title: string
  subtitle: string
  player: AwardPlayerStat | null
  accent: 'gold' | 'rose' | 'emerald' | 'dark' | 'amber'
  icon: React.ReactNode
  primaryStat: string
  secondaryStat: string
  emptyText: string
  navigate: (to: string) => void
  isAdmin: boolean
}) {
  const topBarClass =
    accent === 'gold'
      ? 'from-[#0d3a24] via-[#154d32] to-[#c59b27]/90 text-white'
      : accent === 'rose'
      ? 'from-rose-800 via-rose-700 to-[#c59b27] text-white'
      : accent === 'emerald'
      ? 'from-emerald-800 to-[#0d3a24] text-white'
      : accent === 'amber'
      ? 'from-amber-700 to-[#916922] text-white'
      : 'from-[#111827] to-[#1f2937] text-white'

  return (
    <div className="rounded-2xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden flex flex-col justify-between">
      {/* Header Banner */}
      <div className={cn('bg-gradient-to-r px-4 py-3 flex items-center justify-between gap-2', topBarClass)}>
        <div>
          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-[10px] opacity-80 font-medium">{subtitle}</div>
        </div>
        <Sparkles className="w-4 h-4 text-[#c59b27] shrink-0 opacity-85" />
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {player ? (
          <>
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="font-serif font-black text-base text-[#111827] truncate">
                  {player.name}
                </div>
                {player.team ? (
                  <button
                    type="button"
                    onClick={() => !isAdmin && navigate(`/team/${player.team!.id}`)}
                    className={cn(
                      'mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#6b7280]',
                      !isAdmin && 'hover:text-[#0d3a24] cursor-pointer'
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
                  <span className="text-[11px] text-[#9ca3af] flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Free Agent
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#faf8f5] border border-[#e8e2d5] px-3.5 py-2.5 flex items-baseline justify-between gap-2">
              <span className="text-xl font-serif font-black text-[#0d3a24] tabular-nums">
                {primaryStat}
              </span>
              <span className="text-[11px] font-mono text-[#6b7280] text-right truncate">
                {secondaryStat}
              </span>
            </div>
          </>
        ) : (
          <div className="py-5 text-center space-y-1">
            <div className="text-sm font-bold text-[#6b7280]">No Leader Yet</div>
            <p className="text-[11px] text-[#9ca3af]">{emptyText}</p>
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
}: {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'lg'
}) {
  const dim = size === 'lg' ? 'w-12 h-12 text-sm rounded-2xl' : 'w-7 h-7 text-[10px] rounded-full'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('object-cover border border-[#e8e2d5] bg-white shrink-0', dim)}
      />
    )
  }
  return (
    <div
      className={cn(
        'bg-[#f4efe6] border border-[#e8e2d5] flex items-center justify-center font-bold text-[#0d3a24] shrink-0',
        dim
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
