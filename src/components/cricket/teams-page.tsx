'use client'

import { useEffect, useState } from 'react'
import { Users, ArrowRight } from 'lucide-react'
import { api, ROLE_LABEL } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import { CricketBatIcon } from '@/components/cricket/cricket-graphics'

interface TeamWithPlayers {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
  captain: string | null
  players: { id: string; name: string; role: string; jerseyNumber: number | null }[]
}

export function TeamsPage({ navigate }: { navigate: (to: string) => void }) {
  const [teams, setTeams] = useState<TeamWithPlayers[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<TeamWithPlayers[]>('/api/teams')
      .then(setTeams)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header (Auction Style) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-serif font-bold text-[#111827] tracking-tight">
            <CricketBatIcon size={22} />
            <span>Cricket Teams</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            {teams ? `${teams.length} clubs enrolled • Select any team to explore squad & stats` : 'Loading tournament franchises...'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Window Frame Container matching Auction Design */}
      <div className="rounded-2xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#e8e2d5]/80 bg-[#faf8f5]/60">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <span className="ml-2 font-mono text-xs text-[#6b7280]">
            teams • {teams?.length ?? 0} total
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {!teams ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#e8e2d5]/50" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e8e2d5] bg-[#faf8f5]/50 p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-[#c59b27]" aria-hidden />
              <p className="text-base font-bold text-[#111827]">No Teams Registered</p>
              <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
                Teams can be registered and configured from the Admin Portal.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {teams.map((t) => {
                const readinessPct = Math.min(100, Math.round((t.players.length / 11) * 100))
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    title="Click to view full team information and squad"
                    onClick={() => navigate(`/team/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/team/${t.id}`)
                      }
                    }}
                    className="group rounded-2xl border border-[#e8e2d5] bg-white p-4 hover:border-[#111827] hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3.5 focus-visible:ring-2 focus-visible:ring-[#0d3a24] focus-visible:outline-none"
                  >
                    {/* Card Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TeamLogo
                          name={t.name}
                          shortName={t.shortName}
                          color={t.color}
                          logoUrl={t.logoUrl}
                          size="md"
                          className="rounded-xl ring-1 ring-[#e8e2d5]"
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate font-bold text-sm text-[#111827] group-hover:text-[#0d3a24] leading-tight">
                            {t.name}
                          </h2>
                          <p className="truncate text-[11px] text-[#6b7280] mt-0.5">
                            {t.captain ? t.captain : t.shortName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-1">
                        <div className="text-lg font-black text-[#111827] tabular-nums leading-none">
                          {t.players.length}
                        </div>
                        <div className="text-[10px] text-[#6b7280] font-medium mt-0.5">
                          players
                        </div>
                      </div>
                    </div>

                    {/* Progress Row */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                        <span className="font-medium">
                          {t.shortName} • {t.players.length}/11 XI
                        </span>
                        <span className="font-semibold text-[#111827] tabular-nums">
                          {readinessPct}% ready
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#e8e2d5]/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0d3a24] transition-all duration-300"
                          style={{ width: `${readinessPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Cream Squad Footer Action Button */}
                    <div className="w-full rounded-xl bg-[#f4efe6] group-hover:bg-[#e8e2d5] border border-[#e8e2d5]/80 py-2 px-3 flex items-center justify-between text-xs font-bold text-[#111827] transition-colors">
                      <span>Squad ({t.players.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0d3a24] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <p className="sr-only">Roles: {Object.values(ROLE_LABEL).join(', ')}</p>
    </div>
  )
}
