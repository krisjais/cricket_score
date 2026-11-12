'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
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
  RefreshCcw,
  Database,
  Upload,
  Image as ImageIcon,
  UserCheck,
  Shield,
} from 'lucide-react'
import { api, ROLE_LABEL } from '@/lib/client'
import { TeamLogo } from '@/components/cricket/ui-bits'
import { CricketBatIcon } from '@/components/cricket/cricket-graphics'
import { useToast } from '@/hooks/use-toast'

interface ResetResult {
  matchesDeleted?: number
  teamsDeleted?: number
  playersDeleted?: number
  teamsCreated?: number
  playersCreated?: number
}

interface PlayerRow {
  id: string
  name: string
  role: string
  jerseyNumber: number | null
}
interface PlayerSuggestion {
  id: string
  name: string
  role: string
  teamId?: string | null
  team?: { id: string; name: string; shortName: string } | null
}
interface TeamRow {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
  captain: string | null
  players: PlayerRow[]
}

export function TeamsAdmin({ defaultTab = 'teams' }: { defaultTab?: 'teams' | 'players' } = {}) {
  const { toast } = useToast()
  const [teams, setTeams] = useState<TeamRow[] | null>(null)
  const [allPlayers, setAllPlayers] = useState<PlayerSuggestion[]>([])
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; team?: TeamRow }>({ open: false })
  const [playerDialog, setPlayerDialog] = useState<{ open: boolean; teamId: string; player?: PlayerRow }>({
    open: false,
    teamId: '',
  })
  const [squadTeamId, setSquadTeamId] = useState<string | null>(null)
  const [deleteTeam, setDeleteTeam] = useState<TeamRow | null>(null)
  const [deletePlayer, setDeletePlayer] = useState<{ teamId: string; player: PlayerRow } | null>(null)
  const [confirmReset, setConfirmReset] = useState<'teams' | 'matches' | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)

  const load = async () => {
    const [teamsRes, playersRes] = await Promise.allSettled([
      api<TeamRow[]>('/api/teams'),
      api<PlayerSuggestion[]>('/api/players'),
    ])
    setTeams(teamsRes.status === 'fulfilled' ? teamsRes.value : [])
    if (playersRes.status === 'fulfilled') setAllPlayers(playersRes.value)
  }
  useEffect(() => {
    void load()
  }, [])

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    try {
      await fn()
      toast({ title: okMsg })
      await load()
      return true
    } catch (e) {
      toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const resetMsg = (r: ResetResult) => {
    if (r.teamsDeleted !== undefined)
      return `Deleted ${r.teamsDeleted} team(s), ${r.playersDeleted} player(s) and ${r.matchesDeleted} match(es)`
    if (r.teamsCreated !== undefined)
      return `Created ${r.teamsCreated} team(s), ${r.playersCreated} player(s) and 1 scheduled match`
    return `Deleted ${r.matchesDeleted ?? 0} match(es) — teams kept`
  }

  const runReset = async (scope: 'teams' | 'matches' | 'demo') => {
    setResetBusy(true)
    try {
      const res = await api<ResetResult>('/api/admin/reset', { method: 'POST', json: { scope } })
      toast({ title: scope === 'demo' ? 'Demo data loaded' : 'Reset done', description: resetMsg(res) })
      await load()
    } catch (e) {
      toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setResetBusy(false)
    }
  }

  const squadTeam = squadTeamId ? teams?.find((t) => t.id === squadTeamId) ?? null : null

  return (
    <div className="space-y-5">
      {/* ---------------- Auction-Style Top Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-serif font-bold text-[#111827] tracking-tight">
            <CricketBatIcon size={22} />
            <span>Cricket Teams</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5 font-medium">
            {teams?.length ?? 0} club{(teams?.length ?? 0) === 1 ? '' : 's'} enrolled
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            disabled={resetBusy || !teams || teams.length === 0}
            onClick={() => setConfirmReset('teams')}
            className="bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#111827] text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <RefreshCcw className="h-3.5 w-3.5 text-[#6b7280]" aria-hidden />
            <span>Reset All Teams</span>
          </button>

          <button
            type="button"
            onClick={() => setTeamDialog({ open: true })}
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="h-4 w-4 text-white" aria-hidden />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* ---------------- Auction-Style Window Frame ---------------- */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        {/* Window Chrome Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]/80 bg-[#F9FAFB]/60">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
            <span className="ml-2 font-mono text-xs text-[#6b7280]">
              teams • {teams?.length ?? 0} total
            </span>
          </div>

          <button
            type="button"
            disabled={resetBusy}
            onClick={() => void runReset('demo')}
            className="text-[11px] font-semibold text-[#6b7280] hover:text-[#7A1426] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Load sample clubs and squads for quick testing"
          >
            <Database className="h-3 w-3 text-[#7A1426]" aria-hidden />
            <span>Load Demo Teams</span>
          </button>
        </div>

        {/* Inner 4-Column Card Grid */}
        <div className="p-4 sm:p-5">
          {!teams ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#E5E7EB]/50" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB]/50 p-12 text-center space-y-3">
              <Shield className="mx-auto h-8 w-8 text-[#7A1426]" aria-hidden />
              <p className="text-sm font-bold text-[#111827]">No Cricket Clubs Enrolled Yet</p>
              <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
                Click &quot;+ Add Team&quot; above to register your first franchise, or load demo teams to rehearse live scoring.
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
                    onClick={() => setSquadTeamId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSquadTeamId(t.id)
                      }
                    }}
                    className="group rounded-2xl border border-[#E5E7EB] bg-white p-4 hover:border-[#111827] hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 focus-visible:ring-2 focus-visible:ring-[#7A1426] focus-visible:outline-none"
                  >
                    {/* Card Top: Logo + Name/Captain + Player Count */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TeamLogo
                          name={t.name}
                          shortName={t.shortName}
                          color={t.color}
                          logoUrl={t.logoUrl}
                          size="md"
                          className="rounded-xl ring-1 ring-[#E5E7EB]"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-sm text-[#111827] leading-tight">
                            {t.name}
                          </h3>
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
                      <div className="h-1.5 w-full rounded-full bg-[#E5E7EB]/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7A1426] transition-all duration-300"
                          style={{ width: `${readinessPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Middle Full-Width Cream Squad Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSquadTeamId(t.id)
                      }}
                      className="w-full rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB]/80 py-2 text-xs font-bold text-[#111827] transition-colors cursor-pointer"
                    >
                      Squad ({t.players.length})
                    </button>

                    {/* Bottom 3-Button Row: Edit | + Player | Delete */}
                    <div
                      className="grid grid-cols-3 gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setTeamDialog({ open: true, team: t })}
                        className="rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] py-1.5 text-[11px] font-bold text-[#111827] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerDialog({ open: true, teamId: t.id })}
                        className="rounded-lg border border-[#E5E7EB] bg-white hover:bg-amber-50/70 py-1.5 text-[11px] font-bold text-[#a16207] transition-colors cursor-pointer"
                      >
                        + Player
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTeam(t)}
                        className="rounded-lg border border-[#E5E7EB] bg-white hover:bg-rose-50 py-1.5 text-[11px] font-bold text-rose-600 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Team Squad & Full Info Modal ---------------- */}
      {squadTeam && (
        <Dialog open onOpenChange={(o) => !o && setSquadTeamId(null)}>
          <DialogContent className="sm:max-w-lg bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={squadTeam.name}
                  shortName={squadTeam.shortName}
                  color={squadTeam.color}
                  logoUrl={squadTeam.logoUrl}
                  size="lg"
                  className="rounded-2xl ring-1 ring-[#E5E7EB]"
                />
                <div className="min-w-0 flex-1 text-left">
                  <DialogTitle className="text-xl font-serif font-bold text-[#111827] flex items-center gap-2">
                    <span className="truncate">{squadTeam.name}</span>
                    <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[#F3F4F6] border border-[#E5E7EB] text-[#7A1426] shrink-0">
                      {squadTeam.shortName}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6b7280] mt-0.5 flex items-center gap-3">
                    <span>{squadTeam.players.length} squad player(s)</span>
                    {squadTeam.captain && (
                      <span className="inline-flex items-center gap-1 text-[#7A1426] font-semibold">
                        <UserCheck className="w-3.5 h-3.5 text-[#7A1426]" />
                        Captain: {squadTeam.captain}
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-80 overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-1.5 my-2">
              {squadTeam.players.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6b7280]">
                  No players assigned to {squadTeam.name} yet.
                </div>
              ) : (
                squadTeam.players
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-xl bg-white border border-[#E5E7EB]/70 px-3 py-2 text-xs hover:border-[#7A1426]/40 transition-colors"
                    >
                      <span className="w-7 text-center font-mono font-bold text-[#6b7280] bg-[#F3F4F6] py-0.5 rounded-md tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-bold text-[#111827] text-sm">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F3F4F6] border border-[#E5E7EB] text-[#7A1426]">
                        {ROLE_LABEL[p.role] ?? p.role}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPlayerDialog({ open: true, teamId: squadTeam.id, player: p })}
                          className="rounded-lg p-1.5 hover:bg-[#F3F4F6] text-[#7A1426] cursor-pointer"
                          aria-label={`Edit player ${p.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePlayer({ teamId: squadTeam.id, player: p })}
                          className="rounded-lg p-1.5 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          aria-label={`Delete player ${p.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#E5E7EB] text-xs font-bold hover:bg-[#F3F4F6] text-[#7A1426] hover:text-[#5E0E1D]"
                onClick={() => setTeamDialog({ open: true, team: squadTeam })}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Team Info
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-[#E5E7EB] text-xs font-bold"
                  onClick={() => setSquadTeamId(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  onClick={() => setPlayerDialog({ open: true, teamId: squadTeam.id })}
                >
                  <Users className="w-3.5 h-3.5 text-white mr-1.5" /> Add Player
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ---------------- Create/Edit Team Dialog ---------------- */}
      {teamDialog.open && (
        <TeamFormDialog
          team={teamDialog.team}
          onClose={() => setTeamDialog({ open: false })}
          onSubmit={async (data) => {
            const done = teamDialog.team
              ? await act(() => api(`/api/teams/${teamDialog.team!.id}`, { method: 'PATCH', json: data }), 'Team updated')
              : await act(() => api('/api/teams', { method: 'POST', json: data }), 'Team created')
            if (done) setTeamDialog({ open: false })
          }}
        />
      )}

      {/* ---------------- Create/Edit Player Dialog ---------------- */}
      {playerDialog.open && (
        <PlayerFormDialog
          teamId={playerDialog.teamId}
          teamName={teams?.find((t) => t.id === playerDialog.teamId)?.name ?? ''}
          player={playerDialog.player}
          allPlayers={allPlayers}
          onClose={() => setPlayerDialog({ open: false, teamId: '' })}
          onSubmit={async ({ name, existingPlayerId }) => {
            const done = playerDialog.player
              ? await act(
                  () => api(`/api/players/${playerDialog.player!.id}`, { method: 'PATCH', json: { name } }),
                  'Player updated',
                )
              : existingPlayerId
                ? await act(
                    () =>
                      api(`/api/players/${existingPlayerId}`, {
                        method: 'PATCH',
                        json: { teamId: playerDialog.teamId },
                      }),
                    'Player added to team',
                  )
                : await act(
                    () =>
                      api('/api/players', {
                        method: 'POST',
                        json: {
                          name,
                          role: 'ALL_ROUNDER',
                          jerseyNumber: null,
                          teamId: playerDialog.teamId,
                        },
                      }),
                    'Player added',
                  )
            if (done) setPlayerDialog({ open: false, teamId: '' })
          }}
        />
      )}

      {/* ---------------- Reset All Confirmation Dialog ---------------- */}
      <AlertDialog open={confirmReset === 'teams'} onOpenChange={(o) => !o && setConfirmReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset ALL teams and matches?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every team, player and match — including live and completed games with all
              ball-by-ball history. Use it for a clean testing slate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              onClick={() => {
                setConfirmReset(null)
                void runReset('teams')
              }}
            >
              Yes, reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTeam} onOpenChange={(o) => !o && setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team &ldquo;{deleteTeam?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the team and its {deleteTeam?.players.length ?? 0} player(s). Teams with recorded matches
              cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              onClick={async () => {
                if (!deleteTeam) return
                const deletedId = deleteTeam.id
                const ok = await act(() => api(`/api/teams/${deletedId}`, { method: 'DELETE' }), 'Team deleted')
                setDeleteTeam(null)
                if (ok && squadTeamId === deletedId) setSquadTeamId(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePlayer} onOpenChange={(o) => !o && setDeletePlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete player &ldquo;{deletePlayer?.player.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Players with recorded deliveries cannot be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              onClick={async () => {
                if (!deletePlayer) return
                await act(() => api(`/api/players/${deletePlayer.player.id}`, { method: 'DELETE' }), 'Player deleted')
                setDeletePlayer(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TeamFormDialog({
  team,
  onClose,
  onSubmit,
}: {
  team?: TeamRow
  onClose: () => void
  onSubmit: (data: { name: string; shortName: string; color: string; logoUrl?: string | null; captain?: string }) => void
}) {
  const [name, setName] = useState(team?.name ?? '')
  const [shortName, setShortName] = useState(team?.shortName ?? '')
  const [logoUrl, setLogoUrl] = useState<string | null>(team?.logoUrl ?? null)
  const [captain, setCaptain] = useState(team?.captain ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be smaller than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoUrl(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-[#111827]">
            {team ? 'Edit Team Franchise' : 'Create Team Franchise'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6b7280]">
            Franchise branding, official logo, and team details shown across tournament scoreboards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#111827] uppercase tracking-wider">Team Logo</Label>
            <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB]">
              {logoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={logoUrl}
                    alt="Team Logo Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-[#E5E7EB] bg-white shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs shadow-xs cursor-pointer font-bold"
                    title="Remove Logo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center text-[#9ca3af] shrink-0">
                  <ImageIcon className="w-6 h-6 text-[#7A1426]" />
                  <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">No Logo</span>
                </div>
              )}

              <div className="space-y-1.5 flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-xs font-bold text-[#7A1426] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7A1426]" />
                  <span>{logoUrl ? 'Change Logo Image' : 'Upload Team Logo'}</span>
                </button>
                <p className="text-[11px] text-[#6b7280]">
                  Upload PNG, JPG, or WebP image (max 2MB).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-xs font-bold text-[#111827]">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rising Stars CC"
              className="rounded-xl border-[#E5E7EB] text-xs font-medium focus-visible:ring-[#7A1426]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-short" className="text-xs font-bold text-[#111827]">Short Code / Abbreviation (max 5)</Label>
            <Input
              id="team-short"
              value={shortName}
              maxLength={5}
              onChange={(e) => setShortName(e.target.value.toUpperCase())}
              placeholder="e.g. RSC"
              className="rounded-xl border-[#E5E7EB] text-xs font-bold uppercase focus-visible:ring-[#7A1426]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-captain" className="text-xs font-bold text-[#111827]">Captain (optional)</Label>
            <Input
              id="team-captain"
              value={captain}
              onChange={(e) => setCaptain(e.target.value)}
              placeholder="e.g. Rohit Sharma"
              className="rounded-xl border-[#E5E7EB] text-xs font-medium focus-visible:ring-[#7A1426]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl border-[#E5E7EB] text-xs font-bold text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-98"
            disabled={!name.trim() || !shortName.trim()}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                shortName: shortName.trim(),
                color: team?.color || '#7A1426',
                logoUrl: logoUrl || null,
                captain: captain.trim() || undefined,
              })
            }
          >
            {team ? 'Save Changes' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlayerFormDialog({
  teamId,
  teamName,
  player,
  allPlayers,
  onClose,
  onSubmit,
}: {
  teamId: string
  teamName: string
  player?: PlayerRow
  allPlayers: PlayerSuggestion[]
  onClose: () => void
  onSubmit: (data: { name: string; existingPlayerId?: string }) => void
}) {
  const [name, setName] = useState(player?.name ?? '')
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(!player)

  const normalized = name.trim().toLowerCase()
  const suggestions = !player
    ? allPlayers
        .filter((p) => (!normalized ? true : p.name.toLowerCase().includes(normalized)))
        .sort((a, b) => {
          const score = (p: PlayerSuggestion) =>
            p.teamId === teamId ? 2 : p.teamId ? 1 : 0
          return score(a) - score(b) || a.name.localeCompare(b.name)
        })
        .slice(0, 8)
    : []

  const selectedPlayer = selectedExistingId
    ? allPlayers.find((p) => p.id === selectedExistingId) ?? null
    : null

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold text-[#111827]">
            {player ? 'Edit player' : 'Add player'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6b7280]">{teamName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="player-name" className="text-xs font-bold">Player name</Label>
            <Input
              id="player-name"
              value={name}
              onFocus={() => !player && setShowSuggestions(true)}
              onChange={(e) => {
                const next = e.target.value
                setName(next)
                setShowSuggestions(true)
                if (selectedPlayer && selectedPlayer.name.toLowerCase() !== next.trim().toLowerCase()) {
                  setSelectedExistingId(null)
                }
              }}
              placeholder={player ? 'Full name' : 'Type player name or pick suggestion'}
              autoComplete="off"
              className="rounded-xl border-[#E5E7EB]"
            />
          </div>

          {selectedPlayer && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px] font-semibold text-emerald-900">
              <span className="truncate">
                Existing player selected{selectedPlayer.team ? ` (moving from ${selectedPlayer.team.shortName})` : ' (Free Agent)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedExistingId(null)
                  setName('')
                  setShowSuggestions(true)
                }}
                className="shrink-0 font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {!player && showSuggestions && suggestions.length > 0 && !selectedExistingId && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                Player suggestions
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] divide-y divide-[#E5E7EB]/70">
                {suggestions.map((s) => {
                  const inCurrentTeam = s.teamId === teamId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={inCurrentTeam}
                      onClick={() => {
                        setName(s.name)
                        setSelectedExistingId(s.id)
                        setShowSuggestions(false)
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-white disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="font-bold text-[#111827] truncate">{s.name}</span>
                      {inCurrentTeam ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200 text-gray-600">
                          Already in squad
                        </span>
                      ) : s.team ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                          {s.team.shortName} · Transfer
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                          Free Agent
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl border-[#E5E7EB] text-xs font-bold" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold rounded-xl"
            disabled={!name.trim()}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                existingPlayerId: selectedExistingId ?? undefined,
              })
            }
          >
            {player ? 'Save changes' : selectedExistingId ? 'Assign player' : 'Add player'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
