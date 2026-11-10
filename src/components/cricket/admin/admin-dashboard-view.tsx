'use client'

import { useState, useEffect } from 'react'
import { api, type MatchSummary } from '@/lib/client'
import {
  Radio,
  Trophy,
  Users,
  Shield,
  ArrowRight,
  PlusCircle,
  PlayCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import type { AdminTab } from './admin-sidebar'

interface AdminDashboardViewProps {
  matches: MatchSummary[]
  onSelectTab: (tab: AdminTab) => void
  onSelectMatchForScoring?: (matchId: string) => void
}

export function AdminDashboardView({ matches, onSelectTab, onSelectMatchForScoring }: AdminDashboardViewProps) {
  const [teamsCount, setTeamsCount] = useState<number>(0)
  const [playersCount, setPlayersCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      api<any[]>('/api/teams').catch(() => []),
      api<any[]>('/api/players').catch(() => []),
    ]).then(([teams, players]) => {
      if (!alive) return
      setTeamsCount(Array.isArray(teams) ? teams.length : 0)
      setPlayersCount(Array.isArray(players) ? players.length : 0)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const liveMatches = matches.filter((m) => m.status === 'LIVE')
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED')
  const scheduledMatches = matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'TOSS_DONE')

  const metricCards = [
    { label: 'Total Matches', value: matches.length, color: 'text-[#0d3a24]', sub: 'Scheduled & Played' },
    { label: 'Live Now', value: liveMatches.length, color: 'text-[#c59b27]', isLive: liveMatches.length > 0 },
    { label: 'Tournament Teams', value: teamsCount, color: 'text-[#0d3a24]', sub: 'Registered Franchises' },
    { label: 'Total Players', value: playersCount, color: 'text-[#c59b27]', sub: 'Active Squad Members' },
    { label: 'Completed', value: completedMatches.length, color: 'text-[#6b7280]', sub: 'Official Results' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#f8f6f0]">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-[#c59b27]/15 text-[#916922]">
              <Trophy className="w-6 h-6" />
            </span>
            <span>Cricket Admin Dashboard</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">
            Live tournament orchestration, scoring operations, and squad registries
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelectTab('matches')}
            className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Match</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {metricCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-[#e8e2d5] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
                <span className={c.color}>{loading ? '—' : c.value}</span>
              </div>
              {c.isLive && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </div>
            <div className="text-[#6b7280] text-xs font-bold uppercase tracking-wider">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Action Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          onClick={() => onSelectTab('scoring')}
          className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/40 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="font-bold text-base text-[#0d3a24] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600" />
              <span>Live Scoring Cockpit</span>
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[#6b7280] text-xs mt-2 leading-relaxed">
            Record balls, extras, wickets, swap strike, manage toss, and broadcast live scoreboard updates.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('teams')}
          className="bg-white border border-[#e8e2d5] hover:border-[#c59b27]/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="font-bold text-base text-[#0d3a24] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c59b27]" />
              <span>Tournament Teams</span>
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[#6b7280] text-xs mt-2 leading-relaxed">
            Register new franchises, assign captains, customize team jersey colors, and inspect squad sizes.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('players')}
          className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/40 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
        >
          <div className="font-bold text-base text-[#0d3a24] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0d3a24]" />
              <span>Players Registry</span>
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[#6b7280] text-xs mt-2 leading-relaxed">
            Manage player rosters, assign player roles (Batter, Bowler, All-Rounder, Wicket-Keeper), and jersey numbers.
          </p>
        </div>
      </div>

      {/* Matches Table Section */}
      <div className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e8e2d5]">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#111827]">Tournament Matches</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">Live, upcoming, and recent fixture states</p>
          </div>
          <button
            onClick={() => onSelectTab('matches')}
            className="text-xs font-bold text-[#0d3a24] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All Fixtures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="py-12 text-center text-[#6b7280]">
            <Calendar className="w-10 h-10 mx-auto text-[#9ca3af] mb-2" />
            <p className="text-sm font-semibold">No matches scheduled yet.</p>
            <p className="text-xs text-[#9ca3af] mt-1">Use "Create Match" or load demo fixtures to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e8e2d5] text-[#9ca3af] uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-2">Teams</th>
                  <th className="pb-3">Format</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Scores / Result</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d5]/60">
                {matches.slice(0, 8).map((m) => {
                  const isLive = m.status === 'LIVE'
                  return (
                    <tr key={m.id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-sm text-[#111827]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.teamA.color }} />
                          <span>{m.teamA.shortName}</span>
                          <span className="text-xs text-[#9ca3af] font-normal">vs</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.teamB.color }} />
                          <span>{m.teamB.shortName}</span>
                        </div>
                        {m.venue && (
                          <div className="text-[11px] font-normal text-[#6b7280] mt-0.5">{m.venue}</div>
                        )}
                      </td>
                      <td className="py-3.5 font-semibold text-[#4b5563]">
                        <span className="px-2 py-0.5 rounded-md bg-[#f4efe6] text-[#0d3a24] text-[11px] font-bold">
                          {m.format} ({m.totalOvers} ov)
                        </span>
                      </td>
                      <td className="py-3.5">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live
                          </span>
                        ) : m.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
                            <CheckCircle2 className="w-3 h-3 text-stone-500" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5]">
                            {m.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-xs">
                        {m.resultText ? (
                          <span className="font-bold text-[#0d3a24]">{m.resultText}</span>
                        ) : m.scores.length > 0 ? (
                          <div className="space-y-0.5">
                            {m.scores.map((s) => (
                              <div key={s.number} className="tabular-nums font-semibold text-[#111827]">
                                Inn {s.number}: {s.runs}/{s.wickets} <span className="text-[10px] text-[#6b7280]">({s.overs} ov)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#9ca3af] italic">Match scheduled</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          onClick={() => {
                            if (onSelectMatchForScoring) onSelectMatchForScoring(m.id)
                            onSelectTab('scoring')
                          }}
                          className="bg-[#0d3a24]/10 hover:bg-[#0d3a24] text-[#0d3a24] hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Console</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
