'use client'

import { useEffect, useState } from 'react'
import { Trophy, Award, RefreshCcw } from 'lucide-react'
import { api, getSocket } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import { AwardsPage } from '@/components/cricket/awards-page'
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
  runsFor: number
  ballsFor: number
  runsAgainst: number
  ballsAgainst: number
  forDisplay: string
  againstDisplay: string
  nrr: number
  recentForm: ('W' | 'L' | 'T' | 'NR')[]
}

export function PointsTablePage({
  navigate,
  defaultSubTab = 'STANDINGS',
  isAdmin = false,
}: {
  navigate: (to: string) => void
  defaultSubTab?: 'STANDINGS' | 'AWARDS'
  isAdmin?: boolean
}) {
  const [subTab, setSubTab] = useState<'STANDINGS' | 'AWARDS'>(defaultSubTab)
  const [rows, setRows] = useState<StandingsRow[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadStandings = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await api<StandingsRow[]>('/api/standings')
      setRows(data)
    } catch {
      setRows([])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let alive = true
    api<StandingsRow[]>('/api/standings')
      .then((data) => {
        if (alive) setRows(data)
      })
      .catch(() => {
        if (alive) setRows([])
      })
    const sock = getSocket()
    const onUpdate = () => void loadStandings(true)
    sock.on('matches:update', onUpdate)
    return () => {
      alive = false
      sock.off('matches:update', onUpdate)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#7A1426]" />
            <span>{subTab === 'STANDINGS' ? 'Points Table & Standings' : 'Tournament Awards & Leaders'}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {subTab === 'STANDINGS'
              ? 'Official Nexcore Premier League team rankings, Net Run Rate (NRR), and recent form.'
              : 'Men & Women separate Best Batsman, Best Bowler, Best Fielder, and Tournament MVP leaders.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="inline-flex flex-wrap rounded-xl bg-gray-100 p-1 border border-gray-200 max-w-full">
            <button
              type="button"
              onClick={() => setSubTab('STANDINGS')}
              className={cn(
                'px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                subTab === 'STANDINGS'
                  ? 'bg-[#7A1426] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Points Table</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('AWARDS')}
              className={cn(
                'px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                subTab === 'AWARDS'
                  ? 'bg-[#7A1426] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Tournament Awards</span>
            </button>
          </div>

          {subTab === 'STANDINGS' && (
            <button
              type="button"
              onClick={() => void loadStandings(false)}
              disabled={refreshing}
              aria-label="Refresh standings"
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-2xs cursor-pointer shrink-0"
              title="Refresh standings"
            >
              <RefreshCcw className={cn('w-4 h-4', refreshing && 'animate-spin')} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {subTab === 'AWARDS' ? (
        <AwardsPage navigate={navigate} embedded isAdmin={isAdmin} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {!rows ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No teams registered in the tournament yet.
            </div>
          ) : (
            <>
              {/* Mobile Card Standings (zero horizontal scrolling) */}
              <div className="md:hidden divide-y divide-gray-100">
                {rows.map((r, idx) => (
                  <button
                    key={r.teamId}
                    type="button"
                    onClick={() => navigate(`/team/${r.teamId}`)}
                    className={cn(
                      'w-full text-left px-3.5 py-3.5 transition-colors hover:bg-gray-50/90 active:bg-gray-100/70 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#7A1426] cursor-pointer space-y-2.5',
                      idx < 4 && rows.length >= 4 && 'bg-[#7A1426]/[0.015]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center justify-center w-6 h-6 rounded-full font-mono text-[11px] font-bold',
                            idx === 0
                              ? 'bg-[#7A1426] text-white'
                              : idx < 4
                              ? 'bg-gray-200 text-gray-900'
                              : 'text-gray-500 bg-gray-100'
                          )}
                        >
                          {idx + 1}
                        </span>
                        <TeamLogo
                          name={r.name}
                          shortName={r.shortName}
                          color={r.color}
                          logoUrl={r.logoUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-gray-900 truncate">{r.name}</div>
                          <div className="text-[11px] text-gray-500 font-semibold">{r.shortName}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#7A1426] px-2 py-0.5 text-white font-black tabular-nums text-xs">
                          <span>{r.points}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/85">PTS</span>
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[11px] font-bold tabular-nums',
                            r.nrr > 0 ? 'text-emerald-700' : r.nrr < 0 ? 'text-rose-700' : 'text-gray-500'
                          )}
                        >
                          NRR {r.nrr > 0 ? `+${r.nrr.toFixed(3)}` : r.nrr.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="grid grid-cols-4 gap-1.5 flex-1 min-w-[180px] rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1.5 text-center">
                        <div>
                          <div className="text-[9px] font-bold uppercase text-gray-400">P</div>
                          <div className="text-xs font-bold tabular-nums text-gray-800">{r.played}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase text-gray-400">W</div>
                          <div className="text-xs font-bold tabular-nums text-emerald-700">{r.won}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase text-gray-400">L</div>
                          <div className="text-xs font-bold tabular-nums text-rose-700">{r.lost}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold uppercase text-gray-400">T/NR</div>
                          <div className="text-xs font-semibold tabular-nums text-gray-600">{r.tied + r.noResult}</div>
                        </div>
                      </div>

                      {r.recentForm.length > 0 && (
                        <div className="inline-flex items-center gap-1 shrink-0" aria-label="Recent form">
                          {r.recentForm.map((f, i) => (
                            <span
                              key={i}
                              className={cn(
                                'w-5 h-5 rounded-full text-[10px] font-bold inline-flex items-center justify-center',
                                f === 'W'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f === 'L'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop / Tablet Full Table */}
              <div className="hidden md:block">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="pl-5 py-3.5 w-12">#</th>
                      <th className="px-4 py-3.5">Team</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-center">P</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-center">W</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-center">L</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-center">T/NR</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-right">NRR</th>
                      <th className="px-2.5 lg:px-3 py-3.5 text-center">PTS</th>
                      <th className="pr-5 py-3.5 text-right">Recent Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, idx) => (
                      <tr
                        key={r.teamId}
                        onClick={() => navigate(`/team/${r.teamId}`)}
                        className={cn(
                          'hover:bg-gray-50/90 transition-colors cursor-pointer',
                          idx < 4 && rows.length >= 4 && 'bg-[#7A1426]/[0.015]'
                        )}
                      >
                        <td className="pl-5 py-3.5 font-mono font-bold">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]',
                              idx === 0
                                ? 'bg-[#7A1426] text-white'
                                : idx < 4
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-500'
                            )}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <TeamLogo
                              name={r.name}
                              shortName={r.shortName}
                              color={r.color}
                              logoUrl={r.logoUrl}
                              size="sm"
                            />
                            <div>
                              <div className="font-bold text-sm text-gray-900">{r.name}</div>
                              <div className="text-[11px] text-gray-500 font-medium">{r.shortName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5 lg:px-3 py-3.5 text-center font-semibold tabular-nums text-gray-700">{r.played}</td>
                        <td className="px-2.5 lg:px-3 py-3.5 text-center font-bold tabular-nums text-emerald-700">{r.won}</td>
                        <td className="px-2.5 lg:px-3 py-3.5 text-center font-semibold tabular-nums text-rose-700">{r.lost}</td>
                        <td className="px-2.5 lg:px-3 py-3.5 text-center tabular-nums text-gray-500">{r.tied + r.noResult}</td>
                        <td
                          className={cn(
                            'px-2.5 lg:px-3 py-3.5 text-right font-mono font-bold tabular-nums',
                            r.nrr > 0 ? 'text-emerald-700' : r.nrr < 0 ? 'text-rose-700' : 'text-gray-500'
                          )}
                        >
                          {r.nrr > 0 ? `+${r.nrr.toFixed(3)}` : r.nrr.toFixed(3)}
                        </td>
                        <td className="px-2.5 lg:px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-[#7A1426] text-white font-black tabular-nums text-xs">
                            {r.points}
                          </span>
                        </td>
                        <td className="pr-5 py-3.5 text-right">
                          {r.recentForm.length === 0 ? (
                            <span className="text-[11px] text-gray-400">—</span>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              {r.recentForm.map((f, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    'w-5 h-5 rounded-full text-[10px] font-bold inline-flex items-center justify-center',
                                    f === 'W'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : f === 'L'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-gray-100 text-gray-600'
                                  )}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>Win = 2 pts • Tie / No Result = 1 pt • Loss = 0 pts</span>
            <span>Ranked by Points, Wins, then Net Run Rate (NRR)</span>
          </div>
        </div>
      )}
    </div>
  )
}
