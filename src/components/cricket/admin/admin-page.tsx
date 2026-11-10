'use client'

import { useMemo, useState } from 'react'
import { useMatchChannel, type AdminSession, type MatchSummary } from '@/lib/client'
import { LoginForm } from '@/components/cricket/admin/login-form'
import { AdminSidebar, type AdminTab } from '@/components/cricket/admin/admin-sidebar'
import { AdminDashboardView } from '@/components/cricket/admin/admin-dashboard-view'
import { AdminLogView } from '@/components/cricket/admin/admin-log-view'
import { AdminResetView } from '@/components/cricket/admin/admin-reset-view'
import { MatchesAdmin } from '@/components/cricket/admin/matches-admin'
import { TeamsAdmin } from '@/components/cricket/admin/teams-admin'
import { PlayersAdmin } from '@/components/cricket/admin/players-admin'
import { ScoringConsole } from '@/components/cricket/admin/scoring-console'
import { AwardsPage } from '@/components/cricket/awards-page'
import { Radio } from 'lucide-react'

const PRIORITY: Record<string, number> = {
  LIVE: 0,
  PAUSED: 1,
  INNINGS_BREAK: 2,
  TOSS_DONE: 3,
  SCHEDULED: 4,
  COMPLETED: 5,
  ABANDONED: 6,
}

export function AdminPage({
  session,
  matches,
  navigate,
}: {
  session: AdminSession
  matches: MatchSummary[]
  navigate: (to: string) => void
}) {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const actionable = useMemo(
    () =>
      [...matches].sort(
        (a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt)
      ),
    [matches]
  )

  const effectiveId = selectedId ?? actionable[0]?.id ?? null
  const liveCount = matches.filter((m) => m.status === 'LIVE').length

  if (session.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0d3a24] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#0d3a24]">Loading APL Admin...</p>
        </div>
      </div>
    )
  }

  if (!session.isAdmin) {
    return <LoginForm session={session} />
  }

  return (
    <div className="flex min-h-screen bg-[#f8f6f0] text-[#111827]">
      <AdminSidebar
        currentTab={tab}
        onSelectTab={setTab}
        session={session}
        navigate={navigate}
        liveCount={liveCount}
      />

      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f8f6f0] pt-14 lg:pt-0">
        {tab === 'dashboard' && (
          <AdminDashboardView
            matches={matches}
            onSelectTab={setTab}
            onSelectMatchForScoring={(id) => {
              setSelectedId(id)
              setTab('scoring')
            }}
          />
        )}

        {tab === 'scoring' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <Radio className="w-6 h-6" />
                  </span>
                  <span>Live Match Scoring Cockpit</span>
                </h1>
                <p className="text-xs text-[#6b7280] mt-1 font-medium">
                  Select a fixture to record deliveries, manage toss, and broadcast live ball-by-ball updates
                </p>
              </div>

              {actionable.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6b7280] shrink-0">Active Match:</span>
                  <select
                    value={effectiveId ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="bg-white border border-[#e8e2d5] text-xs font-bold text-[#111827] px-3.5 py-2 rounded-xl focus:border-[#0d3a24] focus:outline-none shadow-xs cursor-pointer max-w-xs truncate"
                  >
                    {actionable.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.teamA.shortName} vs {m.teamB.shortName} ({m.format}) — {m.status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {effectiveId ? (
              <div className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-xs">
                <ScoringConsole key={effectiveId} matchId={effectiveId} matches={actionable} navigate={navigate} />
              </div>
            ) : (
              <div className="bg-white border border-dashed border-[#e8e2d5] rounded-3xl p-12 text-center text-[#6b7280]">
                <p className="text-base font-bold text-[#111827] mb-1">No Matches Found</p>
                <p className="text-xs text-[#9ca3af] mb-4">Create a match in the Matches tab to begin live scoring.</p>
                <button
                  onClick={() => setTab('matches')}
                  className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Create Match
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'matches' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <MatchesAdmin
              matches={matches}
              onChanged={async () => {
                // socket takes care of state refresh
              }}
              onScoreMatch={(id) => {
                setSelectedId(id)
                setTab('scoring')
              }}
            />
          </div>
        )}

        {tab === 'teams' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <TeamsAdmin defaultTab="teams" />
          </div>
        )}

        {tab === 'players' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <PlayersAdmin />
          </div>
        )}

        {tab === 'awards' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <AwardsPage isAdmin navigate={navigate} />
          </div>
        )}

        {tab === 'log' && (
          <AdminLogView matches={matches} selectedMatchId={effectiveId ?? undefined} />
        )}

        {tab === 'reset' && (
          <AdminResetView
            onResetSuccess={() => {
              setTab('dashboard')
            }}
          />
        )}
      </main>
    </div>
  )
}
