'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BadgeCheck,
  CalendarRange,
  Check,
  GitMerge,
  History,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SeasonDto, TournamentDto, fmtDate, formatCricketLabel } from '../player/player-types'

interface SearchPlayerRow {
  id: string
  playerCode: string | null
  name: string
  role: string
  gender: 'MALE' | 'FEMALE'
  isClaimed: boolean
  isVerified: boolean
  status: 'ACTIVE' | 'SUSPENDED' | 'MERGED'
  team: { id: string; name: string; shortName: string } | null
  matches: number
  runs: number
  wickets: number
}

interface TeamOption {
  id: string
  name: string
  shortName: string
}

interface ClaimRow {
  id: string
  targetPlayerId: string
  verificationMethod: string
  otpVerified: boolean
  evidenceNotes: string | null
  status: string
  createdAt: string
  claimantUser: { id: string; name: string; email: string | null; mobile: string | null } | null
  claimantPlayer: { id: string; playerCode: string | null; name: string } | null
  targetPlayer: {
    id: string
    playerCode: string | null
    name: string
    team: { name: string; shortName: string } | null
    matches: number
    runs: number
    wickets: number
  } | null
}

interface AuditLogRow {
  id: string
  action: string
  actorType: string
  actorName: string | null
  matchId: string | null
  playerId: string | null
  reason: string | null
  createdAt: string
}

export function PlayerCareerAdminPanel({ onPlayersChanged }: { onPlayersChanged?: () => Promise<void> | void }) {
  const [subTab, setSubTab] = useState<'directory' | 'seasons' | 'claims' | 'audit'>('directory')

  const [query, setQuery] = useState('')
  const [searchRows, setSearchRows] = useState<SearchPlayerRow[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [seasons, setSeasons] = useState<SeasonDto[]>([])
  const [tournaments, setTournaments] = useState<TournamentDto[]>([])
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [busy, setBusy] = useState(false)

  // Career inspector drawer state
  const [inspectedCareer, setInspectedCareer] = useState<any | null>(null)

  // Season / Tournament creation state
  const [seasonName, setSeasonName] = useState('')
  const [seasonCode, setSeasonCode] = useState('')
  const [seasonYear, setSeasonYear] = useState(String(new Date().getFullYear()))
  const [seasonStatus, setSeasonStatus] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED'>('UPCOMING')

  const [tournName, setTournName] = useState('')
  const [tournSeasonId, setTournSeasonId] = useState('')
  const [tournFormat, setTournFormat] = useState('T20')

  // Season membership assignment state
  const [assignPlayerId, setAssignPlayerId] = useState('')
  const [assignSeasonId, setAssignSeasonId] = useState('')
  const [assignTeamId, setAssignTeamId] = useState('')
  const [assignDesignation, setAssignDesignation] = useState<'PLAYER' | 'CAPTAIN' | 'VICE_CAPTAIN' | 'WICKETKEEPER'>('PLAYER')
  const [replaceExisting, setReplaceExisting] = useState(false)

  // Duplicate merge state
  const [mergeSourceId, setMergeSourceId] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeReason, setMergeReason] = useState('')

  const loadDirectory = useCallback(async (qStr = query) => {
    const res = await api<SearchPlayerRow[]>(`/api/players/search?q=${encodeURIComponent(qStr.trim())}&limit=50`)
    setSearchRows(res)
  }, [query])

  const loadReferenceData = useCallback(async () => {
    const [tm, s, tr] = await Promise.all([
      api<TeamOption[]>('/api/teams').catch(() => []),
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
    ])
    setTeams(tm)
    setSeasons(s)
    setTournaments(tr)
    if (s[0]) {
      setTournSeasonId((prev) => prev || s[0].id)
      setAssignSeasonId((prev) => prev || s[0].id)
    }
    if (tm[0]) setAssignTeamId((prev) => prev || tm[0].id)
  }, [])

  const loadClaimsAndAudit = useCallback(async () => {
    const [c, a] = await Promise.all([
      api<ClaimRow[]>('/api/admin/claims?status=ALL').catch(() => []),
      api<AuditLogRow[]>('/api/admin/audit-logs?limit=60').catch(() => []),
    ])
    setClaims(c)
    setAuditLogs(a)
  }, [])

  useEffect(() => {
    let alive = true
    api<SearchPlayerRow[]>('/api/players/search?q=&limit=50')
      .then((res) => alive && setSearchRows(res))
      .catch(() => {})
    Promise.all([
      api<TeamOption[]>('/api/teams').catch(() => []),
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
    ]).then(([tm, s, tr]) => {
      if (!alive) return
      setTeams(tm)
      setSeasons(s)
      setTournaments(tr)
      if (s[0]) {
        setTournSeasonId((prev) => prev || s[0].id)
        setAssignSeasonId((prev) => prev || s[0].id)
      }
      if (tm[0]) setAssignTeamId((prev) => prev || tm[0].id)
    })
    Promise.all([
      api<ClaimRow[]>('/api/admin/claims?status=ALL').catch(() => []),
      api<AuditLogRow[]>('/api/admin/audit-logs?limit=60').catch(() => []),
    ]).then(([c, a]) => {
      if (!alive) return
      setClaims(c)
      setAuditLogs(a)
    })
    return () => {
      alive = false
    }
  }, [])

  async function toggleVerify(p: SearchPlayerRow) {
    setBusy(true)
    try {
      await api(`/api/players/${p.id}/verify`, {
        method: 'PATCH',
        json: { isVerified: !p.isVerified, reason: 'Admin verification toggle' },
      })
      toast.success(`${p.name} marked ${!p.isVerified ? 'verified' : 'unverified'}`)
      await loadDirectory()
      await onPlayersChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update verification')
    } finally {
      setBusy(false)
    }
  }

  async function toggleStatus(p: SearchPlayerRow) {
    const next = p.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setBusy(true)
    try {
      await api(`/api/players/${p.id}/status`, {
        method: 'PATCH',
        json: { status: next, reason: `Admin set status to ${next}` },
      })
      toast.success(`${p.name} status updated to ${next}`)
      await loadDirectory()
      await onPlayersChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update player status')
    } finally {
      setBusy(false)
    }
  }

  async function inspectCareer(playerId: string) {
    try {
      const res = await api(`/api/players/${playerId}/career`)
      setInspectedCareer(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to inspect career')
    }
  }

  async function handleAssignMembership(e: React.FormEvent) {
    e.preventDefault()
    if (!assignPlayerId || !assignSeasonId || !assignTeamId) return
    setBusy(true)
    try {
      await api('/api/memberships', {
        method: 'POST',
        json: {
          playerId: assignPlayerId,
          seasonId: assignSeasonId,
          teamId: assignTeamId,
          designation: assignDesignation,
          replaceExisting,
        },
      })
      toast.success('Season team membership assigned')
      await Promise.all([loadDirectory(), loadClaimsAndAudit()])
      await onPlayersChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Membership assignment failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api('/api/seasons', {
        method: 'POST',
        json: {
          name: seasonName.trim(),
          code: seasonCode.trim() || undefined,
          year: Number(seasonYear),
          status: seasonStatus,
        },
      })
      toast.success('Season created')
      setSeasonName('')
      setSeasonCode('')
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create season')
    } finally {
      setBusy(false)
    }
  }

  async function handleSeasonStatus(s: SeasonDto, status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED') {
    setBusy(true)
    try {
      await api(`/api/seasons/${s.id}`, { method: 'PATCH', json: { status } })
      toast.success(`${s.name} status changed to ${status}`)
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update season')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api('/api/tournaments', {
        method: 'POST',
        json: {
          name: tournName.trim(),
          seasonId: tournSeasonId,
          format: tournFormat,
          status: 'ACTIVE',
        },
      })
      toast.success('Tournament created')
      setTournName('')
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tournament')
    } finally {
      setBusy(false)
    }
  }

  async function handleResolveClaim(id: string, decision: 'APPROVE' | 'REJECT') {
    setBusy(true)
    try {
      await api(`/api/admin/claims/${id}/resolve`, {
        method: 'POST',
        json: { decision, reason: `${decision} from Admin Panel` },
      })
      toast.success(decision === 'APPROVE' ? 'Claim approved & records merged' : 'Claim rejected')
      await Promise.all([loadClaimsAndAudit(), loadDirectory()])
      await onPlayersChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve claim')
    } finally {
      setBusy(false)
    }
  }

  async function handleMergePlayers(e: React.FormEvent) {
    e.preventDefault()
    if (!mergeSourceId || !mergeTargetId) return
    setBusy(true)
    try {
      await api('/api/players/merge', {
        method: 'POST',
        json: {
          sourcePlayerId: mergeSourceId,
          targetPlayerId: mergeTargetId,
          reason: mergeReason.trim() || 'Admin duplicate profile merge',
        },
      })
      toast.success('Duplicate profiles merged & stats recalculated')
      setMergeSourceId('')
      setMergeTargetId('')
      setMergeReason('')
      await Promise.all([loadDirectory(), loadClaimsAndAudit()])
      await onPlayersChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Merge failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleRecalculate(playerId?: string) {
    setBusy(true)
    try {
      const res = await api<{ playersRecalculated: number; verifiedMatchesCount: number }>('/api/admin/stats/recalculate', {
        method: 'POST',
        json: { playerId: playerId ?? null, reason: 'Triggered from Admin Career Management' },
      })
      toast.success(`Recalculated ${res.playersRecalculated} player(s) across ${res.verifiedMatchesCount} verified matches`)
      await Promise.all([loadDirectory(), loadClaimsAndAudit()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Recalculation failed')
    } finally {
      setBusy(false)
    }
  }

  const pendingClaimsCount = claims.filter((c) => c.status === 'PENDING').length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#E5E7EB] p-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['directory', 'ID Registry & Verification', Users],
              ['seasons', 'Seasons, Teams & Rosters', CalendarRange],
              ['claims', `Claims (${pendingClaimsCount} Pending) & Merge`, UserCheck],
              ['audit', 'Stats Audit Logs', History],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSubTab(k)}
              className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                subTab === k ? 'bg-[#7A1426] text-white' : 'text-gray-600 hover:bg-[#F3F4F6]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => handleRecalculate()}
          className="rounded-xl text-xs font-bold border-[#7A1426]/30 text-[#7A1426] cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Recalculate All Stats
        </Button>
      </div>

      {subTab === 'directory' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void loadDirectory()
            }}
            className="flex flex-wrap gap-2 bg-white p-3.5 rounded-2xl border border-[#E5E7EB]"
          >
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by player name or permanent PLR-YYYY-NNNNNN ID..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] pl-9 pr-3 py-2 text-xs"
              />
            </div>
            <Button type="submit" className="rounded-xl bg-[#121826] hover:bg-black text-white text-xs font-bold cursor-pointer">
              Search Registry
            </Button>
          </form>

          <Card className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Registered player identities">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                    <th className="py-3 pl-5 pr-3">Player ID</th>
                    <th className="py-3 px-3">Player &amp; Account</th>
                    <th className="py-3 px-3">Current Team</th>
                    <th className="py-3 px-3">Career</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchRows.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 pl-5 pr-3 font-mono font-bold text-[#7A1426]">
                        {p.playerCode ?? '—'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#111827] flex items-center gap-1.5">
                          {p.name}
                          {p.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {formatCricketLabel(p.role)} • {p.isClaimed ? 'Account Claimed' : 'Unclaimed / Temp'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-700">{p.team?.name ?? 'Free Agent'}</td>
                      <td className="py-3 px-3 tabular-nums text-gray-700">
                        {p.matches}M · {p.runs}R · {p.wickets}W
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => inspectCareer(p.id)}
                            className="h-7 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Career
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => toggleVerify(p)}
                            className="h-7 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {p.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => toggleStatus(p)}
                            className="h-7 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {p.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {inspectedCareer && (
            <Card className="rounded-3xl border border-[#7A1426]/30 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-extrabold text-[#111827]">
                    {inspectedCareer.player.name} ({inspectedCareer.player.playerCode})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {inspectedCareer.career?.matches ?? 0} Matches • {inspectedCareer.career?.runs ?? 0} Runs • {inspectedCareer.career?.wickets ?? 0} Wickets
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecalculate(inspectedCareer.player.id)}
                    className="rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Recalculate Player
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setInspectedCareer(null)}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <div className="font-bold text-[#7A1426] mb-1">Season Team Memberships:</div>
                  <div className="flex flex-wrap gap-2">
                    {(inspectedCareer.memberships ?? []).map((m: any) => (
                      <span key={m.id} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 font-semibold">
                        {m.season?.name ?? 'Season'} → {m.team?.name ?? 'Team'} ({m.designation})
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {subTab === 'seasons' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-3xl border border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-[#111827]">Assign Player to Season Team</CardTitle>
              <CardDescription className="text-xs">
                Preserves completed season history while assigning teams per season without changing permanent PLR IDs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignMembership} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Player</label>
                  <select
                    required
                    value={assignPlayerId}
                    onChange={(e) => setAssignPlayerId(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                  >
                    <option value="">Select registered/unclaimed player...</option>
                    {searchRows.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.playerCode ?? p.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Season</label>
                    <select
                      required
                      value={assignSeasonId}
                      onChange={(e) => setAssignSeasonId(e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                    >
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Team</label>
                    <select
                      required
                      value={assignTeamId}
                      onChange={(e) => setAssignTeamId(e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1">Role / Designation</label>
                  <select
                    value={assignDesignation}
                    onChange={(e) => setAssignDesignation(e.target.value as typeof assignDesignation)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                  >
                    <option value="PLAYER">Squad Player</option>
                    <option value="CAPTAIN">Captain</option>
                    <option value="VICE_CAPTAIN">Vice-Captain</option>
                    <option value="WICKETKEEPER">Wicketkeeper</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded h-4 w-4"
                  />
                  <span className="font-semibold text-gray-700">Allow mid-season transfer in ACTIVE/UPCOMING season</span>
                </label>
                <Button type="submit" disabled={busy || !assignPlayerId} className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer">
                  Assign Season Membership
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-[#111827]">Manage Seasons &amp; Tournaments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-xs">
              <form onSubmit={handleCreateSeason} className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="Season name (e.g. Season 2027)"
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                />
                <input
                  type="number"
                  required
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(e.target.value)}
                  placeholder="Year"
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                />
                <input
                  type="text"
                  value={seasonCode}
                  onChange={(e) => setSeasonCode(e.target.value)}
                  placeholder="Code (e.g. S2027)"
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                />
                <select
                  value={seasonStatus}
                  onChange={(e) => setSeasonStatus(e.target.value as typeof seasonStatus)}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                <Button type="submit" disabled={busy} className="col-span-2 rounded-xl bg-[#121826] text-white text-xs font-bold cursor-pointer">
                  Create Season
                </Button>
              </form>

              <div className="space-y-1.5">
                {seasons.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2">
                    <div>
                      <span className="font-bold text-[#111827]">{s.name}</span>
                      <span className="ml-2 text-gray-500 font-mono">{s.code}</span>
                    </div>
                    <select
                      value={s.status}
                      onChange={(e) => handleSeasonStatus(s, e.target.value as SeasonDto['status'])}
                      className="rounded-lg border border-[#E5E7EB] px-2 py-1 text-[11px] font-bold"
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateTournament} className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  placeholder="New tournament name"
                  className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                />
                <select
                  value={tournFormat}
                  onChange={(e) => setTournFormat(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2"
                >
                  <option value="T20">T20</option>
                  <option value="T10">T10</option>
                  <option value="ODI">ODI</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
                <select
                  value={tournSeasonId}
                  onChange={(e) => setTournSeasonId(e.target.value)}
                  className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Button type="submit" disabled={busy || !tournSeasonId} className="rounded-xl bg-[#7A1426] text-white text-xs font-bold cursor-pointer">
                  Add Event
                </Button>
              </form>
              {tournaments.length > 0 && (
                <div className="text-[11px] text-gray-500">
                  Active tournaments: {tournaments.map((t) => t.name).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === 'claims' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-3xl border border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#7A1426]" />
                Profile Claim Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {claims.length === 0 ? (
                <p className="text-gray-400 py-4">No player claim requests yet.</p>
              ) : (
                claims.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#111827]">
                        {c.claimantUser?.name ?? 'User'} → {c.targetPlayer?.name ?? 'Unclaimed'}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-white border border-[#E5E7EB]">
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Claimant ID: {c.claimantPlayer?.playerCode ?? '—'} • Target: {c.targetPlayer?.playerCode ?? '—'} (
                      {c.targetPlayer?.matches ?? 0}M, {c.targetPlayer?.runs ?? 0}R)
                    </div>
                    {c.evidenceNotes && <div className="text-[11px] italic text-gray-600">&ldquo;{c.evidenceNotes}&rdquo;</div>}
                    {c.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleResolveClaim(c.id, 'APPROVE')}
                          className="h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <Check className="w-3 h-3 mr-1" /> Approve &amp; Merge
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleResolveClaim(c.id, 'REJECT')}
                          className="h-7 rounded-lg text-rose-700 border-rose-200 text-[11px] font-bold cursor-pointer"
                        >
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#E5E7EB] bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-[#7A1426]" />
                Merge Duplicate Player Profiles
              </CardTitle>
              <CardDescription className="text-xs">
                Reassigns all ball-by-ball events, innings, awards, and non-conflicting season memberships from the duplicate record into the primary permanent Player ID inside a transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMergePlayers} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Duplicate Source Player (will be marked MERGED)</label>
                  <select
                    required
                    value={mergeSourceId}
                    onChange={(e) => setMergeSourceId(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                  >
                    <option value="">Select duplicate record...</option>
                    {searchRows.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.playerCode}) · {p.matches}M
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Surviving Target Player (retains permanent PLR ID)</label>
                  <select
                    required
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                  >
                    <option value="">Select surviving profile...</option>
                    {searchRows
                      .filter((p) => p.id !== mergeSourceId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.playerCode}) · {p.matches}M
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Verification Reason</label>
                  <input
                    type="text"
                    required
                    value={mergeReason}
                    onChange={(e) => setMergeReason(e.target.value)}
                    placeholder="e.g. Verified same player across offline temp record and self-signup"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy || !mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
                  className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
                >
                  Merge Profiles &amp; Recalculate
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === 'audit' && (
        <Card className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-extrabold text-[#111827]">
              Official Statistics &amp; Identity Audit Logs
            </CardTitle>
          </CardHeader>
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Statistics audit logs">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-[#F9FAFB] border-y border-[#E5E7EB]">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                  <th className="py-3 pl-5 pr-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 pl-3 pr-5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 pl-5 pr-3 text-gray-500 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#7A1426]">{l.action}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#111827]">
                      {l.actorName ?? l.actorType}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-gray-600">{l.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
