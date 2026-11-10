'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Trophy, Users, UserCheck, Shield } from 'lucide-react'
import { api, ROLE_LABEL } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'

interface TeamDetail {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
  captain: string | null
  players: { id: string; name: string; role: string; jerseyNumber: number | null }[]
  stats: Record<
    string,
    {
      matches: number
      inningsBatted: number
      runs: number
      ballsFaced: number
      fours: number
      sixes: number
      highest: number
      notOuts: number
      oversBowled: number
      runsConceded: number
      wickets: number
    }
  >
}

export function TeamDetailPage({ teamId, navigate }: { teamId: string; navigate: (to: string) => void }) {
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<TeamDetail>(`/api/teams/${teamId}`)
      .then(setTeam)
      .catch((e) => setError(e.message))
  }, [teamId])

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-16 text-center">
        <p className="text-base font-bold text-[#111827]">Team not found.</p>
        <button
          onClick={() => navigate('/teams')}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Teams</span>
        </button>
      </div>
    )
  }

  if (!team) {
    return <div className="h-64 animate-pulse rounded-3xl bg-[#e8e2d5]/60" />
  }

  const players = [...team.players].sort(
    (a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) || a.name.localeCompare(a.name)
  )
  const hasAnyStat = Object.values(team.stats).some((s) => s.matches > 0)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/teams')}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#6b7280] hover:text-[#0d3a24] transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span>Back to All Teams</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3a24] via-[#12422a] to-[#082618] border border-[#c59b27]/30 text-white shadow-md">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="lg" />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 text-[#c59b27] text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>Franchise Profile</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-white">
              {team.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#f8f6f0]/80 pt-1">
              <span className="font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10">
                Code: {team.shortName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>{team.players.length} Registered Players</span>
              </span>
              {team.captain && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-[#c59b27]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Captain: {team.captain}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Squad Roster Table */}
      <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="bg-[#faf8f5] border-b border-[#e8e2d5] p-5">
          <CardTitle className="text-base font-serif font-bold text-[#111827] flex items-center justify-between">
            <span>Official Squad Roster</span>
            <span className="text-xs font-bold text-[#6b7280]">{players.length} players listed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f4efe6]">
              <TableRow className="border-b border-[#e8e2d5]">
                <TableHead className="pl-6 text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider w-16">Jersey #</TableHead>
                <TableHead className="text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Player Name</TableHead>
                <TableHead className="text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider text-right">Role</TableHead>
                {hasAnyStat && (
                  <TableHead className="text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider text-right pr-6">
                    Tournament Record
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => {
                const s = team.stats[p.id]
                return (
                  <TableRow key={p.id} className="border-b border-[#e8e2d5] hover:bg-[#f8f6f0] transition-colors">
                    <TableCell className="pl-6 font-bold tabular-nums text-xs text-[#6b7280]">
                      {p.jerseyNumber != null ? `#${p.jerseyNumber}` : '—'}
                    </TableCell>
                    <TableCell className="font-bold text-sm text-[#111827]">
                      {p.name}
                      {team.captain === p.name && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 text-[#916922]">
                          Captain
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#f4efe6] border border-[#e8e2d5] text-[#0d3a24]">
                        {ROLE_LABEL[p.role] ?? p.role}
                      </span>
                    </TableCell>
                    {hasAnyStat && (
                      <TableCell className="pr-6 text-right tabular-nums text-xs">
                        {s && s.matches > 0 ? (
                          <div className="font-bold text-[#111827]">
                            <span className="text-[#0d3a24]">{s.runs} runs</span>
                            {s.wickets > 0 && <span className="text-emerald-700 ml-1.5">• {s.wickets} wkts</span>}
                            <span className="ml-1.5 text-[11px] font-normal text-[#6b7280]">({s.matches} mat)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">No matches yet</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
