'use client'

import { useEffect, useMemo, useState } from 'react'
import { type AdminSession, type MatchSummary } from '@/lib/client'
import { AdminSidebar, type AdminTab, type ScorerSubView } from '@/components/cricket/admin/admin-sidebar'
import { AdminDashboardView } from '@/components/cricket/admin/admin-dashboard-view'
import { AdminLogView } from '@/components/cricket/admin/admin-log-view'
import { AdminResetView } from '@/components/cricket/admin/admin-reset-view'
import {
  ScheduleAdminView,
  OfficialsAdminView,
  ResultsAdminView,
} from '@/components/cricket/admin/admin-section-views'
import { MatchesAdmin } from '@/components/cricket/admin/matches-admin'
import { TeamsAdmin } from '@/components/cricket/admin/teams-admin'
import { PlayersAdmin } from '@/components/cricket/admin/players-admin'
import { PlayerCareerAdminPanel } from '@/components/cricket/admin/player-career-admin'
import { ScoringConsole } from '@/components/cricket/admin/scoring-console'
import { PointsTablePage } from '@/components/cricket/points-table-page'

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
  const [scorerSubView, setScorerSubView] = useState<ScorerSubView>('score')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const actionable = useMemo(
    () =>
      [...matches].sort(
        (a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt)
      ),
    [matches]
  )

  const effectiveId =
    selectedId && actionable.some((m) => m.id === selectedId) ? selectedId : actionable[0]?.id ?? null

  useEffect(() => {
    if (!session.loading && !session.isAdmin) {
      navigate('/login')
    }
  }, [session.loading, session.isAdmin, navigate])

  if (session.loading || !session.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7A1426] border-t-transparent" />
      </div>
    )
  }

  const liveCount = matches.filter((m) => m.status === 'LIVE').length

  const openMatchForScoring = (id: string) => {
    setSelectedId(id)
    setScorerSubView('score')
    setTab('scoring')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4F5F7] text-[#111827]">
      {/* Dark Left Sidebar (Dashboard & Scorer Modes) */}
      <AdminSidebar
        currentTab={tab}
        onSelectTab={(nextTab) => {
          if (nextTab === 'scoring') setScorerSubView('score')
          setTab(nextTab)
        }}
        scorerSubView={scorerSubView}
        onSelectScorerSubView={setScorerSubView}
        session={session}
        navigate={navigate}
        liveCount={liveCount}
      />

      {/* Right Light Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {tab === 'dashboard' && (
          <AdminDashboardView
            matches={matches}
            username={session.username}
            onSelectTab={setTab}
            onSelectMatchForScoring={(id) => {
              setSelectedId(id)
              setScorerSubView('score')
            }}
          />
        )}

        {tab === 'scoring' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  Umpire &amp; Scorer Panel
                </h1>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Fast ball-by-ball match control with live audience broadcasting
                </p>
              </div>

              {actionable.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Match:</span>
                  <select
                    value={effectiveId ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#111827] shadow-2xs focus:border-[#7A1426] focus:outline-none cursor-pointer"
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
              <ScoringConsole
                key={effectiveId}
                matchId={effectiveId}
                matches={actionable}
                navigate={navigate}
                scorerSubView={scorerSubView}
                onSelectSubView={setScorerSubView}
                onSelectMatch={setSelectedId}
              />
            ) : (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500">
                <p className="text-base font-bold text-[#111827] mb-1">No Matches Found</p>
                <p className="text-xs text-gray-400 mb-4">Create a match in the Matches tab to begin live scoring.</p>
                <button
                  type="button"
                  onClick={() => setTab('matches')}
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Create Match
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'matches' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <MatchesAdmin
              matches={matches}
              onChanged={async () => {
                // Socket.IO handles feed refresh
              }}
              onScoreMatch={openMatchForScoring}
            />
          </div>
        )}

        {tab === 'schedule' && (
          <ScheduleAdminView
            matches={matches}
            onSelectTab={setTab}
            onScoreMatch={openMatchForScoring}
          />
        )}

        {tab === 'teams' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <TeamsAdmin defaultTab="teams" />
          </div>
        )}

        {tab === 'players' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <PlayersAdmin navigate={navigate} />
          </div>
        )}

        {tab === 'career' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <PlayerCareerAdminPanel />
          </div>
        )}

        {tab === 'officials' && <OfficialsAdminView session={session} />}

        {tab === 'results' && (
          <ResultsAdminView
            matches={matches}
            navigate={navigate}
            onScoreMatch={openMatchForScoring}
          />
        )}

        {tab === 'awards' && (
          <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-8">
            <PointsTablePage navigate={navigate} defaultSubTab="AWARDS" isAdmin />
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
