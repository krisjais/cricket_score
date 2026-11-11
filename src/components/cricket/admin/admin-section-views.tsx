'use client'

import { CalendarClock, Trophy, UserCog, Play, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import type { AdminSession, MatchSummary } from '@/lib/client'
import type { AdminTab } from '@/components/cricket/admin/admin-sidebar'

export function ScheduleAdminView({
  matches,
  onSelectTab,
  onScoreMatch,
}: {
  matches: MatchSummary[]
  onSelectTab: (tab: AdminTab) => void
  onScoreMatch: (id: string) => void
}) {
  const scheduled = matches.filter((m) => ['SCHEDULED', 'TOSS_DONE', 'LIVE', 'PAUSED', 'INNINGS_BREAK'].includes(m.status))

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#F4F5F7] pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] flex items-center gap-2.5 tracking-tight">
            <span className="p-2 rounded-xl bg-[#7A1426]/10 text-[#7A1426]">
              <CalendarClock className="w-5 h-5" />
            </span>
            <span>Match Schedule</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Active and upcoming tournament fixtures ordered for field operations
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('matches')}
          className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer self-start sm:self-auto"
        >
          Manage / Create Fixtures
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {scheduled.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No upcoming or active fixtures scheduled right now.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scheduled.map((m) => (
              <div
                key={m.id}
                className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TeamLogo name={m.teamA.name} shortName={m.teamA.shortName} color={m.teamA.color} logoUrl={m.teamA.logoUrl} size="sm" />
                  <span className="font-bold text-sm text-[#111827]">
                    {m.teamA.name} <span className="text-gray-400 font-normal">vs</span> {m.teamB.name}
                  </span>
                  <TeamLogo name={m.teamB.name} shortName={m.teamB.shortName} color={m.teamB.color} logoUrl={m.teamB.logoUrl} size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                    {m.venue || 'Turf 01'}
                  </span>
                  <span className="text-gray-500 font-medium">
                    {m.format === 'CUSTOM' ? `${m.totalOvers} Overs` : m.format}
                  </span>
                  <StatusBadge status={m.status} />
                  <button
                    type="button"
                    onClick={() => onScoreMatch(m.id)}
                    className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Open Scorer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function OfficialsAdminView({ session }: { session: AdminSession }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#F4F5F7] pb-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] flex items-center gap-2.5 tracking-tight">
          <span className="p-2 rounded-xl bg-[#7A1426]/10 text-[#7A1426]">
            <UserCog className="w-5 h-5" />
          </span>
          <span>Officials &amp; Scorer Access</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Active scorer &amp; administrator authentication details
        </p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#121826] text-white flex items-center justify-center text-lg font-extrabold uppercase">
            {(session.username || 'A')[0]}
          </div>
          <div>
            <div className="text-base font-bold text-[#111827] capitalize">{session.username || 'Admin'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Head Scorer &amp; Super Admin (Authenticated JWT Session)</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Permissions</div>
            <div className="font-bold text-[#111827] mt-1">Full Scoring, Teams, Players &amp; Match Control</div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Real-Time Engine</div>
            <div className="font-bold text-emerald-700 mt-1">MongoDB Persistent + Socket.IO Live Broadcast</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResultsAdminView({
  matches,
  navigate,
  onScoreMatch,
}: {
  matches: MatchSummary[]
  navigate: (to: string) => void
  onScoreMatch: (id: string) => void
}) {
  const completed = matches.filter((m) => m.status === 'COMPLETED' || m.status === 'ABANDONED')

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#F4F5F7] pb-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] flex items-center gap-2.5 tracking-tight">
          <span className="p-2 rounded-xl bg-[#7A1426]/10 text-[#7A1426]">
            <Trophy className="w-5 h-5" />
          </span>
          <span>Completed Match Results</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Official tournament results and full match scorecards
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {completed.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No matches have concluded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {completed.map((m) => (
              <div key={m.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111827]">
                      {m.teamA.name} vs {m.teamB.name}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {m.venue || 'Turf 01'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#7A1426] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{m.resultText || 'Completed'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/match/${m.id}`)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-[#111827] cursor-pointer"
                  >
                    Public Scorecard
                  </button>
                  <button
                    type="button"
                    onClick={() => onScoreMatch(m.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
                  >
                    Scorer Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
