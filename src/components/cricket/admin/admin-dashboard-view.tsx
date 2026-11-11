'use client'

import { useState, useEffect, useMemo } from 'react'
import { api, type MatchSummary } from '@/lib/client'
import {
  Radio,
  Users,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Bell,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { LiveBadge } from '@/components/cricket/ui-bits'
import type { AdminTab } from './admin-sidebar'
import { cn } from '@/lib/utils'

interface AdminDashboardViewProps {
  matches: MatchSummary[]
  username?: string | null
  onSelectTab: (tab: AdminTab) => void
  onSelectMatchForScoring?: (matchId: string) => void
}

function calcCrr(runs: number, oversDisplay: string): string {
  const [ovPart, ballPart] = (oversDisplay || '0.0').split('.')
  const totalOvers = Number(ovPart || 0) + Number(ballPart || 0) / 6
  if (!totalOvers || totalOvers <= 0) return '0.00'
  return (runs / totalOvers).toFixed(2)
}

export function AdminDashboardView({
  matches,
  username,
  onSelectTab,
  onSelectMatchForScoring,
}: AdminDashboardViewProps) {
  const [teamsCount, setTeamsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState('NPL 2026')
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    let alive = true
    api<any[]>('/api/teams')
      .then((teams) => {
        if (!alive) return
        setTeamsCount(Array.isArray(teams) ? teams.length : 0)
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'LIVE' || m.status === 'PAUSED' || m.status === 'INNINGS_BREAK'),
    [matches]
  )
  const completedMatches = useMemo(
    () => matches.filter((m) => m.status === 'COMPLETED'),
    [matches]
  )
  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'TOSS_DONE'),
    [matches]
  )

  const featuredTurfMatches = liveMatches.length > 0 ? liveMatches.slice(0, 2) : upcomingMatches.slice(0, 2)

  // Donut Chart Calculations
  const totalCount = matches.length
  const completedCount = completedMatches.length
  const liveCount = liveMatches.length
  const upcomingCount = upcomingMatches.length
  const completedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const completedArc = totalCount > 0 ? (completedCount / totalCount) * circumference : 0
  const liveArc = totalCount > 0 ? (liveCount / totalCount) * circumference : 0
  const upcomingArc = totalCount > 0 ? (upcomingCount / totalCount) * circumference : circumference

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#F4F5F7] pb-8 space-y-6">
      {/* ===================== DASHBOARD HEADER (Panel 3 Reference) ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Welcome back, {username || 'Admin'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Season Selector */}
          <div className="relative">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              aria-label="Select Season"
              className="appearance-none bg-white border border-gray-200 rounded-full pl-3.5 pr-8 py-1.5 text-xs font-bold text-[#111827] shadow-2xs focus:outline-none focus:border-[#7A1426] cursor-pointer"
            >
              <option value="NPL 2026">NPL 2026</option>
              <option value="Season 8">Season 8</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-2xs cursor-pointer"
              aria-label="Tournament notifications"
            >
              <Bell className="w-4 h-4" />
              {liveCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7A1426]" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-gray-200 shadow-xl p-4 z-30 text-xs space-y-2">
                <div className="font-bold text-[#111827] border-b border-gray-100 pb-2 flex items-center justify-between">
                  <span>Live Alerts</span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                {liveCount > 0 ? (
                  <p className="text-gray-600">
                    <b className="text-[#7A1426]">{liveCount} live match{liveCount === 1 ? '' : 'es'}</b> currently broadcasting on Socket.IO.
                  </p>
                ) : (
                  <p className="text-gray-500">No live matches running. Create or start a fixture from Matches.</p>
                )}
              </div>
            )}
          </div>

          {/* Admin Avatar Profile Chip */}
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-full pl-1.5 pr-3.5 py-1 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-[#121826] text-white flex items-center justify-center text-xs font-extrabold uppercase">
              {(username || 'A')[0]}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-[#111827] capitalize">{username || 'Admin'}</div>
              <div className="text-[10px] text-gray-500">Super Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== TOP 4 STATS ROW (Panel 3 Reference) ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectTab('matches')}
          className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Total Matches</div>
            <div className="text-2xl font-extrabold text-[#111827] tabular-nums">{totalCount}</div>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('scoring')}
          className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7A1426]/10 text-[#7A1426] flex items-center justify-center shrink-0">
            <Radio className={cn('w-5 h-5', liveCount > 0 && 'animate-pulse')} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Live Matches</div>
            <div className="text-2xl font-extrabold text-[#7A1426] tabular-nums">{liveCount}</div>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('results')}
          className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Completed</div>
            <div className="text-2xl font-extrabold text-[#111827] tabular-nums">{completedCount}</div>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('teams')}
          className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Teams</div>
            <div className="text-2xl font-extrabold text-[#111827] tabular-nums">
              {loading ? '—' : teamsCount}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MAIN CONTENT GRID (Panel 3 Reference) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Turf Match Cards + Upcoming Matches Table */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Turf Cards */}
          {featuredTurfMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredTurfMatches.map((m, idx) => {
                const isLive = m.status === 'LIVE' || m.status === 'PAUSED' || m.status === 'INNINGS_BREAK'
                const activeInn =
                  m.scores.find((s) => s.number === m.currentInnings) ?? m.scores[m.scores.length - 1]
                const crr = activeInn ? calcCrr(activeInn.runs, activeInn.overs) : '0.00'

                return (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#111827]">
                        {m.venue || `Turf 0${idx + 1}`}
                      </span>
                      {isLive ? (
                        <LiveBadge />
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {m.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-gray-700">
                      {m.teamA.name} <span className="text-gray-400">vs</span> {m.teamB.name}
                    </div>

                    <div className="flex items-end justify-between gap-3 pt-1">
                      <div>
                        <div className="text-2xl font-extrabold text-[#111827] tabular-nums leading-none">
                          {activeInn ? `${activeInn.runs}/${activeInn.wickets}` : '0/0'}{' '}
                          <span className="text-xs font-medium text-gray-500">
                            ({activeInn ? `${activeInn.overs} Overs` : `${m.totalOvers} ov`})
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-gray-500 mt-1.5">
                          CRR {crr}
                          {m.target ? ` • Target ${m.target}` : ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectMatchForScoring) onSelectMatchForScoring(m.id)
                          onSelectTab('scoring')
                        }}
                        className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer shrink-0 active:scale-98"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">No Active Fixtures on Turfs</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create a new match or start toss from Matches Manager to launch live scoring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('matches')}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Match</span>
              </button>
            </div>
          )}

          {/* Upcoming Matches Table Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <h2 className="text-sm sm:text-base font-bold text-[#111827]">Upcoming Matches</h2>
              <button
                type="button"
                onClick={() => onSelectTab('matches')}
                className="text-xs font-semibold text-[#7A1426] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingMatches.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No upcoming fixtures scheduled right now.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {upcomingMatches.slice(0, 5).map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectMatchForScoring) onSelectMatchForScoring(m.id)
                      onSelectTab('scoring')
                    }}
                    className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[11px] shrink-0">
                        Match {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-bold text-[#111827] truncate">
                        {m.teamA.shortName} vs {m.teamB.shortName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 font-medium shrink-0">
                      <span>{m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}</span>
                      <span className="text-gray-700 font-semibold">{m.venue || 'Turf 01'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tournament Progress Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-[#111827]">Tournament Progress</h2>
          </div>

          <div className="flex items-center justify-around gap-4 py-2">
            {/* SVG Donut Ring */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                {totalCount > 0 && upcomingArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="12"
                    strokeDasharray={`${upcomingArc} ${circumference}`}
                    strokeDashoffset={-(completedArc + liveArc)}
                  />
                )}
                {totalCount > 0 && liveArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#7A1426"
                    strokeWidth="12"
                    strokeDasharray={`${liveArc} ${circumference}`}
                    strokeDashoffset={-completedArc}
                  />
                )}
                {totalCount > 0 && completedArc > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#15803D"
                    strokeWidth="12"
                    strokeDasharray={`${completedArc} ${circumference}`}
                    strokeDashoffset={0}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-[#111827] leading-none">{completedPct}%</span>
                <span className="text-[10px] font-semibold text-gray-500 mt-0.5">Completed</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] shrink-0" />
                <span className="text-gray-700 font-semibold">
                  Completed <span className="text-gray-400 font-normal">({completedCount})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7A1426] shrink-0" />
                <span className="text-gray-700 font-semibold">
                  Live <span className="text-gray-400 font-normal">({liveCount})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB] shrink-0" />
                <span className="text-gray-700 font-semibold">
                  Upcoming <span className="text-gray-400 font-normal">({upcomingCount})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total Fixtures Tracked</span>
            <span className="font-bold text-[#111827]">{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
