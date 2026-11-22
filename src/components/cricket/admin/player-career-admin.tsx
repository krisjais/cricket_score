'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BadgeCheck,
  CalendarRange,
  History,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  Users,
  Trash2,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError, api } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
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
  avatarUrl?: string | null
  team: { id: string; name: string; shortName: string; color?: string; logoUrl?: string | null } | null
  matches: number
  runs: number
  wickets: number
  careerSummary?: {
    matches: number
    runs: number
    wickets: number
    battingAverage: number | null
    economy: number
  }
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
  const [subTab, setSubTab] = useState<'directory' | 'seasons' | 'audit'>('directory')

  const [query, setQuery] = useState('')
  const [searchRows, setSearchRows] = useState<SearchPlayerRow[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(true)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [seasons, setSeasons] = useState<SeasonDto[]>([])
  const [tournaments, setTournaments] = useState<TournamentDto[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [busy, setBusy] = useState(false)

  // Career inspector modal state
  const [inspectedCareer, setInspectedCareer] = useState<any | null>(null)
  const [inspectLoadingId, setInspectLoadingId] = useState<string | null>(null)

  // Season / Tournament creation state
  const [seasonName, setSeasonName] = useState('')
  const [seasonCode, setSeasonCode] = useState('')
  const [seasonYear, setSeasonYear] = useState(String(new Date().getFullYear()))
  const [seasonStatus, setSeasonStatus] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED'>('UPCOMING')

  const [tournName, setTournName] = useState('')
  const [tournSeasonId, setTournSeasonId] = useState('')
  const [tournFormat, setTournFormat] = useState('T20')

  const loadDirectory = useCallback(async (qStr = query) => {
    setLoadingDirectory(true)
    try {
      const res = await api<any[]>(`/api/players/search?q=${encodeURIComponent(qStr.trim())}&limit=50`)
      setSearchRows(
        res.map((p) => ({
          ...p,
          matches: p.matches ?? p.careerSummary?.matches ?? 0,
          runs: p.runs ?? p.careerSummary?.runs ?? 0,
          wickets: p.wickets ?? p.careerSummary?.wickets ?? 0,
        }))
      )
    } catch {
      toast.error('Failed to load players registry')
    } finally {
      setLoadingDirectory(false)
    }
  }, [query])

  const loadReferenceData = useCallback(async () => {
    const [s, tr] = await Promise.all([
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
    ])
    setSeasons(s)
    setTournaments(tr)
    if (s[0]) {
      setTournSeasonId((prev) => prev || s[0].id)
    }
  }, [])

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true)
    try {
      const a = await api<AuditLogRow[]>('/api/admin/audit-logs?limit=60').catch(() => [])
      setAuditLogs(a)
    } finally {
      setLoadingAudit(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoadingDirectory(true)
    api<any[]>('/api/players/search?q=&limit=50')
      .then((res) => {
        if (!alive) return
        setSearchRows(
          res.map((p) => ({
            ...p,
            matches: p.matches ?? p.careerSummary?.matches ?? 0,
            runs: p.runs ?? p.careerSummary?.runs ?? 0,
            wickets: p.wickets ?? p.careerSummary?.wickets ?? 0,
          }))
        )
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingDirectory(false)
      })
    Promise.all([
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
    ]).then(([s, tr]) => {
      if (!alive) return
      setSeasons(s)
      setTournaments(tr)
      if (s[0]) {
        setTournSeasonId((prev) => prev || s[0].id)
      }
    })
    api<AuditLogRow[]>('/api/admin/audit-logs?limit=60')
      .catch(() => [])
      .then((a) => {
        if (!alive) return
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
    setInspectLoadingId(playerId)
    try {
      const res = await api(`/api/players/${playerId}/career`)
      setInspectedCareer(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to inspect career')
    } finally {
      setInspectLoadingId(null)
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

  async function handleDeleteSeason(s: SeasonDto) {
    if (!confirm(`Are you sure you want to delete season "${s.name}"? This action cannot be undone.`)) {
      return
    }
    setBusy(true)
    try {
      await api(`/api/seasons/${s.id}`, { method: 'DELETE' })
      toast.success(`Season "${s.name}" deleted`)
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete season')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteTournament(t: TournamentDto) {
    if (!confirm(`Are you sure you want to delete tournament "${t.name}"?`)) {
      return
    }
    setBusy(true)
    try {
      await api(`/api/tournaments/${t.id}`, { method: 'DELETE' })
      toast.success(`Tournament "${t.name}" deleted`)
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tournament')
    } finally {
      setBusy(false)
    }
  }

  async function handleCleanupTestSeasons() {
    setBusy(true)
    try {
      const res = await api<{ purgedCount: number }>('/api/seasons/cleanup-test-seasons', { method: 'POST' })
      toast.success(`Removed ${res.purgedCount} test season(s)`)
      await loadReferenceData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clean test seasons')
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
      await Promise.all([
        loadDirectory(),
        loadAuditLogs(),
        playerId && inspectedCareer?.player?.id === playerId ? inspectCareer(playerId) : Promise.resolve(),
      ])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setInspectedCareer(null)
        toast.error('Admin session expired or replaced by a player login. Please sign in as Admin again.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Recalculation failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#E5E7EB] p-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['directory', 'ID Registry & Verification', Users],
              ['seasons', 'Seasons & Tournaments', CalendarRange],
              ['audit', 'Stats Audit Logs', History],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setSubTab(k)
                if (k === 'audit') void loadAuditLogs()
                if (k === 'directory' && searchRows.length === 0) void loadDirectory()
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                subTab === k ? 'bg-[#7A1426] text-white shadow-xs' : 'text-gray-600 hover:bg-[#F3F4F6]'
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by player name..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#7A1426]"
              />
            </div>
            <Button
              type="submit"
              disabled={loadingDirectory}
              className="rounded-xl bg-[#121826] hover:bg-black text-white text-xs font-bold cursor-pointer"
            >
              {loadingDirectory ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Search Registry
            </Button>
          </form>

          <Card className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
            {loadingDirectory ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#7A1426]" />
                <span className="text-xs font-medium">Loading player registry...</span>
              </div>
            ) : searchRows.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No registered players found{query ? ` for "${query}"` : ''}.
              </div>
            ) : (
              <>
                {/* Mobile Card List (Zero Horizontal Scrolling) */}
                <div className="md:hidden divide-y divide-gray-100">
                  {searchRows.map((p) => {
                    const matches = p.matches ?? p.careerSummary?.matches ?? 0
                    const runs = p.runs ?? p.careerSummary?.runs ?? 0
                    const wickets = p.wickets ?? p.careerSummary?.wickets ?? 0

                    return (
                      <div key={p.id} className="p-3.5 space-y-2.5">
                        {/* Header: Avatar, Name, Badges, Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-xs font-bold text-[#7A1426] shrink-0">
                                {p.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#111827] flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{p.name}</span>
                                {p.isVerified && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified identity" />
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-gray-600">{formatCricketLabel(p.role)}</span>
                                <span>•</span>
                                <span className={p.isClaimed ? 'text-gray-500' : 'text-amber-700 font-medium'}>
                                  {p.isClaimed ? 'Account Claimed' : 'Unclaimed / Temp'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        {/* Current Team & Career Stats: high contrast and very clear */}
                        <div className="grid grid-cols-2 gap-2 bg-[#F9FAFB] p-2.5 rounded-2xl border border-gray-100 text-xs">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                              Current Team
                            </span>
                            <div className="truncate">
                              {p.team?.name ? (
                                <span className="inline-flex items-center gap-1.5 font-bold text-[#7A1426] truncate">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.team.color || '#7A1426' }}
                                  />
                                  <span className="truncate">{p.team.name}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                                  <UserX className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Free Agent</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                              Career
                            </span>
                            <span className="font-semibold text-gray-800 tabular-nums">
                              {matches}M · {runs}R · {wickets}W
                            </span>
                          </div>
                        </div>

                        {/* Action buttons: prominent, high-contrast, touch-friendly row */}
                        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={inspectLoadingId === p.id}
                            onClick={() => inspectCareer(p.id)}
                            className="h-8.5 rounded-xl text-xs font-bold border-gray-200 hover:bg-[#F3F4F6] text-gray-800 cursor-pointer shadow-2xs"
                          >
                            {inspectLoadingId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Career'
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => toggleVerify(p)}
                            className={`h-8.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs ${
                              p.isVerified
                                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                            }`}
                          >
                            {p.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => toggleStatus(p)}
                            className={`h-8.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs ${
                              p.status === 'SUSPENDED'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                                : 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100'
                            }`}
                          >
                            {p.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto" tabIndex={0} role="region" aria-label="Registered player identities">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-[#7A1426]">
                        <th className="py-3 pl-5 pr-3">Player &amp; Account</th>
                        <th className="py-3 px-3">Current Team</th>
                        <th className="py-3 px-3">Career</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searchRows.map((p) => {
                        const matches = p.matches ?? p.careerSummary?.matches ?? 0
                        const runs = p.runs ?? p.careerSummary?.runs ?? 0
                        const wickets = p.wickets ?? p.careerSummary?.wickets ?? 0

                        return (
                          <tr key={p.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 pl-5 pr-3">
                              <div className="font-bold text-[#111827] flex items-center gap-1.5">
                                {p.name}
                                {p.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {formatCricketLabel(p.role)} • {p.isClaimed ? 'Account Claimed' : 'Unclaimed / Temp'}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-700">
                              {p.team?.name ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.team.color || '#7A1426' }}
                                  />
                                  <span>{p.team.name}</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 font-medium">Free Agent</span>
                              )}
                            </td>
                            <td className="py-3 px-3 tabular-nums text-gray-700">
                              {matches}M · {runs}R · {wickets}W
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
                                  disabled={inspectLoadingId === p.id}
                                  onClick={() => inspectCareer(p.id)}
                                  className="h-7 rounded-lg text-[11px] font-bold cursor-pointer"
                                >
                                  {inspectLoadingId === p.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Career'
                                  )}
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
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          <Dialog
            open={Boolean(inspectedCareer)}
            onOpenChange={(open) => !open && setInspectedCareer(null)}
          >
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
              {inspectedCareer && (
                <>
                  <DialogHeader className="pr-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {inspectedCareer.player.avatarUrl ? (
                          <img
                            src={inspectedCareer.player.avatarUrl}
                            alt={inspectedCareer.player.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-[#7A1426] text-white text-sm font-black flex items-center justify-center shrink-0">
                            {String(inspectedCareer.player.name || 'PL').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <DialogTitle className="text-lg font-extrabold text-[#111827] flex items-center gap-1.5">
                            <span className="truncate">{inspectedCareer.player.name}</span>
                            {inspectedCareer.player.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </DialogTitle>
                          <DialogDescription className="text-xs text-gray-500">
                            {formatCricketLabel(inspectedCareer.player.role)} •{' '}
                            {inspectedCareer.player.gender === 'FEMALE' ? "Women's Division" : "Men's Division"} •{' '}
                            {inspectedCareer.player.isClaimed ? 'Account Claimed' : 'Unclaimed Profile'}
                          </DialogDescription>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => handleRecalculate(inspectedCareer.player.id)}
                        className="rounded-xl text-xs font-bold border-[#7A1426]/30 text-[#7A1426] cursor-pointer"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                        Recalculate Player
                      </Button>
                    </div>
                  </DialogHeader>

                  <div className="space-y-5 pt-2 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        ['Matches', inspectedCareer.career?.matches ?? 0],
                        ['Runs', inspectedCareer.career?.runs ?? 0],
                        ['Wickets', inspectedCareer.career?.wickets ?? 0],
                        ['Catches / RO', (inspectedCareer.career?.catches ?? 0) + (inspectedCareer.career?.runOuts ?? 0)],
                        ['4s / 6s', `${inspectedCareer.career?.fours ?? 0} / ${inspectedCareer.career?.sixes ?? 0}`],
                        ['Strike Rate', Number(inspectedCareer.career?.strikeRate ?? 0).toFixed(1)],
                        ['Economy', Number(inspectedCareer.career?.economy ?? 0).toFixed(2)],
                        ['High Score', inspectedCareer.career?.highestScore ?? 0],
                      ].map(([label, val]) => (
                        <div
                          key={String(label)}
                          className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {label}
                          </div>
                          <div className="text-base font-extrabold text-[#111827] tabular-nums mt-0.5">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="font-bold text-[#7A1426] mb-1.5">Season Team Memberships</div>
                      {(inspectedCareer.memberships ?? []).length === 0 ? (
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-gray-500">
                          No season memberships recorded yet.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(inspectedCareer.memberships ?? []).map((m: any) => (
                            <span
                              key={m.id}
                              className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 font-semibold text-[#111827]"
                            >
                              {m.season?.name ?? 'Season'} → {m.team?.name ?? 'Team'} ({m.designation})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-[#7A1426] mb-1.5">Verified Match History</div>
                      {(inspectedCareer.matchHistory ?? []).length === 0 ? (
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-gray-500">
                          No finalized/verified match records yet.
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[10px] font-bold uppercase text-gray-500">
                              <tr>
                                <th className="py-2 px-3">Match</th>
                                <th className="py-2 px-3 text-right">Bat</th>
                                <th className="py-2 px-3 text-right">Bowl</th>
                                <th className="py-2 px-3 text-right">Field</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(inspectedCareer.matchHistory ?? []).slice(0, 10).map((mh: any) => (
                                <tr key={mh.id}>
                                  <td className="py-2 px-3 font-semibold text-[#111827]">
                                    {mh.team?.shortName ?? 'Team'} vs {mh.opponent?.shortName ?? 'Opp'}
                                    <span className="ml-1.5 text-[10px] text-gray-500 font-normal">
                                      {mh.matchDate ? fmtDate(mh.matchDate) : ''}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right tabular-nums">
                                    {mh.runsScored ?? 0} ({mh.ballsFaced ?? 0})
                                  </td>
                                  <td className="py-2 px-3 text-right tabular-nums">
                                    {mh.wickets ?? 0}/{mh.runsConceded ?? 0}
                                  </td>
                                  <td className="py-2 px-3 text-right tabular-nums">
                                    {(mh.catches ?? 0) + (mh.runOuts ?? 0) + (mh.stumpings ?? 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {subTab === 'seasons' && (
        <div className="max-w-2xl">
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
                <Select value={seasonStatus} onValueChange={(val) => setSeasonStatus(val as typeof seasonStatus)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={busy} className="col-span-2 rounded-xl bg-[#121826] text-white text-xs font-bold cursor-pointer">
                  Create Season
                </Button>
              </form>

              {/* Test Seasons Cleanup Banner */}
              {seasons.filter((s) => s.name.startsWith('Test Season') || s.name.startsWith('NPL Season 2025')).length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-xs">
                      {seasons.filter((s) => s.name.startsWith('Test Season') || s.name.startsWith('NPL Season 2025')).length} test season(s) detected from test runs.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={handleCleanupTestSeasons}
                    className="h-8 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clean Up Test Seasons
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                {seasons.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white p-3 hover:border-gray-300 transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111827] truncate">{s.name}</span>
                        {s.isDefault && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">{s.code} · Year {s.year}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={s.status}
                        onValueChange={(val) => handleSeasonStatus(s, val as SeasonDto['status'])}
                      >
                        <SelectTrigger className="rounded-lg border border-[#E5E7EB] bg-gray-50 px-2 py-1 text-[11px] font-bold text-[#111827] h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                      {!s.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDeleteSeason(s)}
                          className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title={`Delete season ${s.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
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
                <Select value={tournFormat} onValueChange={setTournFormat}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="T10">T10</SelectItem>
                    <SelectItem value="ODI">ODI</SelectItem>
                    <SelectItem value="CUSTOM">CUSTOM</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tournSeasonId} onValueChange={setTournSeasonId}>
                  <SelectTrigger className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={busy || !tournSeasonId} className="rounded-xl bg-[#7A1426] text-white text-xs font-bold cursor-pointer">
                  Add Event
                </Button>
              </form>
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Active Tournament Events ({tournaments.length})
                </div>
                {tournaments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tournaments created yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {tournaments.map((t) => {
                      const parentSeason = seasons.find((s) => s.id === t.seasonId)
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-gray-50/60 px-3 py-2 text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-[#111827] truncate">{t.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {t.format} · Season: {parentSeason?.name ?? t.seasonId}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleDeleteTournament(t)}
                            className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer shrink-0"
                            title={`Delete tournament ${t.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === 'audit' && (
        <Card className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
          <CardHeader>
            <CardTitle className="text-sm font-extrabold text-[#111827]">
              Official Statistics &amp; Identity Audit Logs
            </CardTitle>
          </CardHeader>
          {loadingAudit ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#7A1426]" />
              <span className="text-xs font-medium">Loading audit logs...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile Audit Card List (Zero Horizontal Scrolling) */}
              <div className="md:hidden divide-y divide-gray-100">
                {auditLogs.map((l) => (
                  <div key={l.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[11px] text-[#7A1426] bg-[#7A1426]/10 px-2 py-0.5 rounded-md">
                        {l.action}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {fmtDate(l.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Actor:</span>
                      <span className="font-semibold text-[#111827]">{l.actorName ?? l.actorType}</span>
                    </div>
                    {l.reason && (
                      <div className="text-[11px] text-gray-600 bg-[#F9FAFB] p-2 rounded-xl border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Reason</span>
                        <span>{l.reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto" tabIndex={0} role="region" aria-label="Statistics audit logs">
                <table className="w-full text-left text-xs">
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
            </>
          )}
        </Card>
      )}
    </div>
  )
}
