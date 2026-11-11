'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Shield,
  ArrowRightLeft,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react'
import { api, ROLE_LABEL } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TeamItem {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
  captain: string | null
}

interface PlayerItem {
  id: string
  playerCode?: string | null
  isClaimed?: boolean
  isVerified?: boolean
  status?: string
  name: string
  role: string
  gender?: 'MALE' | 'FEMALE'
  jerseyNumber: number | null
  teamId: string | null
  avatarUrl?: string | null
  team?: TeamItem | null
}

export function PlayersAdmin({ navigate }: { navigate?: (to: string) => void } = {}) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<PlayerItem[] | null>(null)
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')

  const [playerDialog, setPlayerDialog] = useState<{ open: boolean; player?: PlayerItem }>({ open: false })
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; player?: PlayerItem }>({ open: false })
  const [importOpen, setImportOpen] = useState(false)
  const [deletePlayer, setDeletePlayer] = useState<PlayerItem | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const loadData = async () => {
    try {
      const [pList, tList] = await Promise.all([
        api<PlayerItem[]>('/api/players'),
        api<TeamItem[]>('/api/teams').catch(() => []),
      ])
      setPlayers(pList)
      setTeams(tList)
    } catch {
      setPlayers([])
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    try {
      await fn()
      toast({ title: okMsg })
      await loadData()
      return true
    } catch (e) {
      toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' })
      return false
    } finally {
      setBusy(false)
    }
  }

  // Filtered and searched players
  const filteredPlayers = useMemo(() => {
    if (!players) return []
    return players.filter((p) => {
      // Team filter
      if (teamFilter === 'UNASSIGNED') {
        if (p.teamId) return false
      } else if (teamFilter !== 'ALL') {
        if (p.teamId !== teamFilter) return false
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        if (p.role !== roleFilter) return false
      }

      // Gender filter
      if (genderFilter !== 'ALL') {
        const g = p.gender === 'FEMALE' ? 'FEMALE' : 'MALE'
        if (g !== genderFilter) return false
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const text = `${p.name} ${p.jerseyNumber ?? ''} ${p.team?.name ?? ''} ${p.team?.shortName ?? ''}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [players, teamFilter, roleFilter, genderFilter, search])

  const unassignedCount = useMemo(() => {
    return players ? players.filter((p) => !p.teamId).length : 0
  }, [players])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A1426] mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Tournament Players Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#111827]">
            Players & Squad Assignment
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            Create players, import auction CSVs, assign squads, and manage roles and jersey numbers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Delete All Players Button */}
          {players && players.length > 0 && (
            <button
              onClick={() => setDeleteAllOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Delete all registered players"
            >
              <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
              <span>Delete All Players</span>
            </button>
          )}

          {/* CSV Import Button */}
          <button
            onClick={() => setImportOpen(true)}
            className="bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#7A1426] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#7A1426]" aria-hidden />
            <span>Import CSV</span>
          </button>

          {/* Add Player Button */}
          <button
            onClick={() => setPlayerDialog({ open: true })}
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="h-4 w-4 text-white" aria-hidden />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name, jersey, or team..."
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7A1426]"
          />
        </div>

        {/* Team Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#7A1426] cursor-pointer"
          >
            <option value="ALL">All Franchises ({players?.length ?? 0})</option>
            <option value="UNASSIGNED">Unassigned / Free Agents ({unassignedCount})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#7A1426] cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="BATTER">Batters</option>
            <option value="BOWLER">Bowlers</option>
            <option value="ALL_ROUNDER">All-Rounders</option>
            <option value="WICKETKEEPER">Wicketkeepers</option>
          </select>

          {/* Division / Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#7A1426] cursor-pointer"
          >
            <option value="ALL">All Divisions</option>
            <option value="MALE">Men&apos;s Division</option>
            <option value="FEMALE">Women&apos;s Division</option>
          </select>
        </div>
      </div>

      {/* Players List Table */}
      {!players ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#E5E7EB]/60" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-[#7A1426]" aria-hidden />
          <p className="text-base font-bold text-[#111827]">
            {search || teamFilter !== 'ALL' || roleFilter !== 'ALL' || genderFilter !== 'ALL'
              ? 'No Players Match Your Filter'
              : 'No Players Registered Yet'}
          </p>
          <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
            {search || teamFilter !== 'ALL' || roleFilter !== 'ALL' || genderFilter !== 'ALL'
              ? 'Try resetting the filters or clear your search query.'
              : 'Click "+ Add Player" or "Import CSV" to populate tournament players and assign them into teams.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#7A1426] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#7A1426]" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setPlayerDialog({ open: true })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Player</span>
            </button>
          </div>
        </div>
      ) : (
        <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <tr className="font-bold text-[#7A1426] uppercase tracking-wider">
                  <th className="pl-6 py-3.5 w-16">Jersey #</th>
                  <th className="px-4 py-3.5">Player Name</th>
                  <th className="px-4 py-3.5">Division</th>
                  <th className="px-4 py-3.5">Playing Role</th>
                  <th className="px-4 py-3.5">Assigned Franchise / Team</th>
                  <th className="pr-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredPlayers.map((p) => {
                  const assignedTeam = teams.find((t) => t.id === p.teamId) || p.team
                  const isFemale = p.gender === 'FEMALE'
                  return (
                    <tr key={p.id} className="hover:bg-[#F4F5F7] transition-colors">
                      <td className="pl-6 py-3.5 font-bold tabular-nums text-[#6b7280]">
                        {p.jerseyNumber != null ? `#${p.jerseyNumber}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-sm text-[#111827]">
                        <div className="flex items-center gap-2.5">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-7 h-7 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#7A1426] shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isVerified && (
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified profile" />
                              )}
                              {assignedTeam?.captain === p.name && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A1426]/20 border border-[#7A1426]/40 text-[#916922]">
                                  Captain
                                </span>
                              )}
                            </div>
                            {p.isClaimed === false && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  Unclaimed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            void act(
                              () =>
                                api(`/api/players/${p.id}`, {
                                  method: 'PATCH',
                                  json: { gender: isFemale ? 'MALE' : 'FEMALE' },
                                }),
                              `${p.name} moved to ${isFemale ? "Men's" : "Women's"} division`
                            )
                          }
                          title="Click to switch Men / Women award category"
                          className={cn(
                            'inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors',
                            isFemale
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-[#7A1426] hover:bg-emerald-100'
                          )}
                        >
                          {isFemale ? 'Women' : 'Men'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#7A1426]">
                          {ROLE_LABEL[p.role] ?? p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {assignedTeam ? (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]">
                            <TeamLogo
                              name={assignedTeam.name}
                              shortName={assignedTeam.shortName}
                              color={assignedTeam.color}
                              logoUrl={assignedTeam.logoUrl}
                              size="xs"
                            />
                            <span className="font-bold text-xs text-[#7A1426]">{assignedTeam.name}</span>
                            <button
                              onClick={() => setAssignDialog({ open: true, player: p })}
                              className="ml-1 text-[10px] font-bold text-[#6b7280] hover:text-[#7A1426] hover:underline cursor-pointer"
                              title="Change team assignment"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                              <UserX className="w-3.5 h-3.5 text-amber-600" />
                              <span>Unassigned / Free Agent</span>
                            </span>
                            <button
                              onClick={() => setAssignDialog({ open: true, player: p })}
                              className="px-2.5 py-1 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                            >
                              Put in Team
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="pr-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {navigate && (
                            <button
                              type="button"
                              onClick={() => navigate(`/players/${encodeURIComponent(p.id)}`)}
                              className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-gray-700 transition-colors cursor-pointer"
                              title="View Public Career Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setAssignDialog({ open: true, player: p })}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#7A1426] transition-colors cursor-pointer"
                            title="Move / Assign to Team"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPlayerDialog({ open: true, player: p })}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#7A1426] transition-colors cursor-pointer"
                            title="Edit Player"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletePlayer(p)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Player Dialog */}
      {playerDialog.open && (
        <PlayerFormDialog
          player={playerDialog.player}
          teams={teams}
          onClose={() => setPlayerDialog({ open: false })}
          onSubmit={async (data) => {
            const done = playerDialog.player
              ? await act(() => api(`/api/players/${playerDialog.player!.id}`, { method: 'PATCH', json: data }), 'Player updated')
              : await act(() => api('/api/players', { method: 'POST', json: data }), 'Player registered')
            if (done) setPlayerDialog({ open: false })
          }}
        />
      )}

      {/* CSV Import Dialog */}
      {importOpen && (
        <ImportCsvDialog
          onClose={() => setImportOpen(false)}
          onImportSuccess={async () => {
            setImportOpen(false)
            await loadData()
          }}
        />
      )}

      {/* Quick Team Assignment Dialog ("Put them in a team") */}
      {assignDialog.open && assignDialog.player && (
        <AssignTeamDialog
          player={assignDialog.player}
          teams={teams}
          onClose={() => setAssignDialog({ open: false })}
          onSubmit={async (teamId) => {
            const done = await act(
              () => api(`/api/players/${assignDialog.player!.id}`, { method: 'PATCH', json: { teamId } }),
              teamId ? 'Player assigned to team' : 'Player moved to free agent pool'
            )
            if (done) setAssignDialog({ open: false })
          }}
        />
      )}

      {/* Delete Player Alert Dialog */}
      <AlertDialog open={!!deletePlayer} onOpenChange={(o) => !o && setDeletePlayer(null)}>
        <AlertDialogContent className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-serif font-bold text-[#111827]">
              Delete Player “{deletePlayer?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6b7280]">
              This permanently removes the player from the tournament registry. Players with deliveries in live matches cannot be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98"
              onClick={async () => {
                if (!deletePlayer) return
                await act(() => api(`/api/players/${deletePlayer.id}`, { method: 'DELETE' }), 'Player deleted')
                setDeletePlayer(null)
              }}
            >
              Delete Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Players Confirmation Dialog */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-serif font-black text-[#111827]">
              Delete All Players?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#6b7280] space-y-2">
              <p>
                Are you sure you want to permanently delete all{' '}
                <strong className="text-rose-700 font-bold">{players?.length ?? 0}</strong> registered players?
              </p>
              <p>
                All team rosters and squad assignments will be cleared. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-3">
            <AlertDialogCancel
              disabled={busy}
              className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98"
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault()
                const count = players?.length ?? 0
                await act(
                  () => api('/api/players?force=true', { method: 'DELETE' }),
                  `All ${count} players deleted`
                )
                setDeleteAllOpen(false)
              }}
            >
              {busy ? 'Deleting...' : 'Yes, Delete All Players'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PlayerFormDialog({
  player,
  teams,
  onClose,
  onSubmit,
}: {
  player?: PlayerItem
  teams: TeamItem[]
  onClose: () => void
  onSubmit: (data: {
    name: string
    role: string
    gender: 'MALE' | 'FEMALE'
    jerseyNumber: number | null
    teamId: string | null
    avatarUrl?: string | null
  }) => void
}) {
  const [name, setName] = useState(player?.name ?? '')
  const [role, setRole] = useState(player?.role ?? 'ALL_ROUNDER')
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(player?.gender === 'FEMALE' ? 'FEMALE' : 'MALE')
  const [jersey, setJersey] = useState(player?.jerseyNumber !== null && player?.jerseyNumber !== undefined ? String(player.jerseyNumber) : '')
  const [teamId, setTeamId] = useState(player?.teamId ?? 'none')
  const [avatarUrl, setAvatarUrl] = useState(player?.avatarUrl ?? '')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-[#111827]">
            {player ? 'Edit Player Details' : 'Add New Player'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6b7280]">
            Enter player identity, division (Men/Women), playing role, and team assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="player-name" className="text-xs font-bold text-[#111827]">Player Full Name</Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Virat Kohli"
              className="rounded-xl border-[#E5E7EB] text-xs font-medium focus-visible:ring-[#7A1426]"
            />
          </div>

          {/* Playing Role + Gender Division */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#111827]">Playing Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB] text-xs font-medium bg-[#F9FAFB]">
                  <SelectValue placeholder="Select playing role" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg">
                  <SelectItem value="ALL_ROUNDER">All-Rounder</SelectItem>
                  <SelectItem value="BATTER">Batter</SelectItem>
                  <SelectItem value="BOWLER">Bowler</SelectItem>
                  <SelectItem value="WICKETKEEPER">Wicketkeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#111827]">Division (Awards)</Label>
              <Select value={gender} onValueChange={(v) => setGender(v === 'FEMALE' ? 'FEMALE' : 'MALE')}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB] text-xs font-medium bg-[#F9FAFB]">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg">
                  <SelectItem value="MALE">Men (Male)</SelectItem>
                  <SelectItem value="FEMALE">Women (Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Assignment ("then we will team put them in a team") */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#111827]">Assign to Team Franchise</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="rounded-xl border-[#E5E7EB] text-xs font-medium bg-[#F9FAFB]">
                <SelectValue placeholder="Select team franchise" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg">
                <SelectItem value="none">
                  <span className="text-[#9ca3af] font-medium">Unassigned / Free Agent (Assign later)</span>
                </SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-bold text-[#7A1426]">{t.name}</span> ({t.shortName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[#6b7280]">
              You can put the player in a team now, or leave unassigned and put them in a team later.
            </p>
          </div>

          {/* Jersey Number */}
          <div className="space-y-2">
            <Label htmlFor="player-jersey" className="text-xs font-bold text-[#111827]">Jersey Number (optional)</Label>
            <Input
              id="player-jersey"
              type="number"
              min={0}
              max={999}
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              placeholder="e.g. 18"
              className="rounded-xl border-[#E5E7EB] text-xs font-bold tabular-nums focus-visible:ring-[#7A1426]"
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="player-photo" className="text-xs font-bold text-[#111827]">Photo URL (optional)</Label>
            <Input
              id="player-photo"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="e.g. https://res.cloudinary.com/...jpg"
              className="rounded-xl border-[#E5E7EB] text-xs font-medium focus-visible:ring-[#7A1426]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98"
            disabled={!name.trim()}
            onClick={() => {
              const jNum = jersey.trim() ? parseInt(jersey, 10) : null
              onSubmit({
                name: name.trim(),
                role,
                gender,
                jerseyNumber: Number.isNaN(jNum) ? null : jNum,
                teamId: teamId === 'none' ? null : teamId,
                avatarUrl: avatarUrl.trim() || null,
              })
            }}
          >
            {player ? 'Save Changes' : 'Register Player'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignTeamDialog({
  player,
  teams,
  onClose,
  onSubmit,
}: {
  player: PlayerItem
  teams: TeamItem[]
  onClose: () => void
  onSubmit: (teamId: string | null) => void
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(player.teamId ?? 'none')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-[#111827]">
            Put Player in a Team
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6b7280]">
            Assign <b>{player.name}</b> to a tournament franchise or move them to the free agent pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#111827]">Select Franchise Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="rounded-xl border-[#E5E7EB] text-xs font-medium bg-[#F9FAFB]">
                <SelectValue placeholder="Choose a franchise team" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg">
                <SelectItem value="none">
                  <span className="text-amber-800 font-bold">Unassigned / Free Agent Pool</span>
                </SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-bold text-[#7A1426]">{t.name}</span> ({t.shortName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98"
            onClick={() => onSubmit(selectedTeamId === 'none' ? null : selectedTeamId)}
          >
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * CSV Import Dialog for bulk auction player import
 */
function ImportCsvDialog({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void
  onImportSuccess: () => void
}) {
  const { toast } = useToast()
  const [csvText, setCsvText] = useState('')
  const [autoCreateTeams, setAutoCreateTeams] = useState(true)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV client-side for instant preview
  const parsedPreview = useMemo(() => {
    if (!csvText.trim()) return null
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return null

    const parseRow = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim())
    const records: Array<Record<string, string>> = []
    const detectedTeams = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i])
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue
      const rec: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        rec[headers[j]] = (values[j] ?? '').replace(/^["']|["']$/g, '').trim()
      }
      records.push(rec)

      const team = rec['Sold To'] || rec['sold to'] || rec['Team'] || rec['team'] || ''
      if (team && team.trim()) {
        detectedTeams.add(team.trim())
      }
    }

    return {
      headers,
      totalRows: records.length,
      sampleRows: records.slice(0, 5),
      teams: Array.from(detectedTeams),
    }
  }, [csvText])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCsvText(event.target.result)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvText.trim()) return
    setLoading(true)
    try {
      const res = await api<{
        importedCount: number
        teamsCreated: number
        createdTeamNames: string[]
        totalPlayers: number
      }>('/api/players/import', {
        method: 'POST',
        json: {
          rawCsv: csvText,
          autoCreateTeams,
        },
      })

      toast({
        title: 'CSV Import Completed Successfully!',
        description: `Imported ${res.importedCount} players. Created ${res.teamsCreated} new franchise teams.`,
      })
      onImportSuccess()
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Could not parse or import the CSV file.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A1426] mb-0.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Auction Import</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#111827]">
            Import Tournament Players from CSV
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6b7280]">
            Upload or paste auction export CSV to automatically register players, photos, roles, and assign them into teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#7A1426] rounded-2xl p-6 text-center bg-[#F9FAFB] transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet className="w-10 h-10 text-[#7A1426] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#111827]">
              Choose a CSV file or drag and drop here
            </p>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Supports standard auction CSV format (ID, Name, Skills, Sold To, Photo URL...)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-xs font-bold text-[#7A1426] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-[#7A1426]" />
              <span>Browse CSV File</span>
            </button>
          </div>

          {/* Or Paste Direct CSV Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-textarea" className="text-xs font-bold text-[#111827]">
                Or Paste CSV Content Directly:
              </Label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => setCsvText('')}
                  className="text-[11px] text-[#6b7280] hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Text
                </button>
              )}
            </div>
            <textarea
              id="csv-textarea"
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste comma-separated rows here e.g. ID,Name,Skills,Gender,Base Price,Status,Sold To..."
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-xs font-mono text-[#111827] focus:outline-none focus:border-[#7A1426]"
            />
          </div>

          {/* Parsed Preview Section */}
          {parsedPreview && (
            <div className="bg-[#F3F4F6]/60 border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7A1426]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Detected {parsedPreview.totalRows} Players</span>
                </div>
                <div className="text-xs font-semibold text-[#6b7280]">
                  {parsedPreview.teams.length} Franchises in "Sold To"
                </div>
              </div>

              {/* Detected Teams Badges */}
              {parsedPreview.teams.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#111827] block">Franchises Identified:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {parsedPreview.teams.map((tName) => (
                      <span
                        key={tName}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#7A1426]"
                      >
                        {tName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Rows Preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#111827] block">First 5 Sample Records:</span>
                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F4F5F7] border-b border-[#E5E7EB]">
                      <tr className="font-bold text-[#7A1426]">
                        <th className="p-2">Name</th>
                        <th className="p-2">Gender</th>
                        <th className="p-2">Skills</th>
                        <th className="p-2">Sold To</th>
                        <th className="p-2">Photo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {parsedPreview.sampleRows.map((r, i) => (
                        <tr key={i} className="hover:bg-[#F9FAFB]">
                          <td className="p-2 font-bold text-[#111827]">{r['Name'] || r['name'] || '—'}</td>
                          <td className="p-2 font-semibold text-[#6b7280]">{r['Gender'] || r['gender'] || 'Male'}</td>
                          <td className="p-2 text-[#6b7280]">{r['Skills'] || r['skills'] || '—'}</td>
                          <td className="p-2 font-bold text-[#7A1426]">{r['Sold To'] || r['sold to'] || 'Unsold'}</td>
                          <td className="p-2 text-[#6b7280]">
                            {r['Photo URL'] || r['photo url'] ? 'Yes' : 'No'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auto Create Teams Checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCreateTeams}
                  onChange={(e) => setAutoCreateTeams(e.target.checked)}
                  className="rounded text-[#7A1426] focus:ring-[#7A1426] h-4 w-4"
                />
                <span className="text-xs font-bold text-[#111827]">
                  Automatically create missing franchises from "Sold To" and assign players
                </span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            disabled={!parsedPreview || loading}
            onClick={handleImport}
          >
            {loading ? 'Importing...' : `Import ${parsedPreview?.totalRows ?? 0} Players`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
