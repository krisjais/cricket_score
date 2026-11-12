'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Coins, Play, PauseCircle, Flag, Eye, ShieldCheck } from 'lucide-react'
import { api, FORMAT_LABEL, type MatchSummary } from '@/lib/client'
import type { SeasonDto, TournamentDto } from '@/components/cricket/player/player-types'
import { StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { useToast } from '@/hooks/use-toast'

interface TeamRow {
  id: string
  name: string
  shortName: string
}

const FORMATS = [
  { key: 'T10', overs: 10 },
  { key: 'T20', overs: 20 },
  { key: 'ODI', overs: 50 },
  { key: 'CUSTOM', overs: 0 },
]

export function MatchesAdmin({
  matches,
  onChanged,
  onScore,
  onScoreMatch,
}: {
  matches: MatchSummary[]
  onChanged: () => void
  onScore?: (matchId: string) => void
  onScoreMatch?: (matchId: string) => void
}) {
  const handleScore = (id: string) => {
    if (onScoreMatch) onScoreMatch(id)
    else if (onScore) onScore(id)
  }
  const { toast } = useToast()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [seasons, setSeasons] = useState<SeasonDto[]>([])
  const [tournaments, setTournaments] = useState<TournamentDto[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [tossMatch, setTossMatch] = useState<MatchSummary | null>(null)
  const [startMatch, setStartMatch] = useState<MatchSummary | null>(null)
  const [editMatch, setEditMatch] = useState<MatchSummary | null>(null)
  const [verifyMatch, setVerifyMatch] = useState<MatchSummary | null>(null)
  const [deleteMatch, setDeleteMatch] = useState<MatchSummary | null>(null)
  const [confirmEnd, setConfirmEnd] = useState<{ id: string; label: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([
      api<TeamRow[]>('/api/teams').catch(() => []),
      api<SeasonDto[]>('/api/seasons').catch(() => []),
      api<TournamentDto[]>('/api/tournaments').catch(() => []),
    ]).then(([t, s, tr]) => {
      setTeams(t)
      setSeasons(s)
      setTournaments(tr)
    })
  }, [])

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    try {
      await fn()
      toast({ title: okMsg })
      onChanged()
      return true
    } catch (e) {
      toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const sorted = useMemo(
    () =>
      [...matches].sort((a, b) => {
        const rank: Record<string, number> = { LIVE: 0, PAUSED: 1, INNINGS_BREAK: 2, TOSS_DONE: 3, SCHEDULED: 4, COMPLETED: 5, ABANDONED: 6 }
        return (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || b.createdAt.localeCompare(a.createdAt)
      }),
    [matches]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{matches.length} match(es)</p>
        <Button className="bg-[#7A1426] hover:bg-[#5E0E1D]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> New match
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((m) => (
          <Card key={m.id} className="py-0">
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <TeamLogo name={m.teamA.name} shortName={m.teamA.shortName} color={m.teamA.color} logoUrl={m.teamA.logoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    <span className="truncate">{m.teamA.shortName}</span>
                    <span className="text-xs font-normal text-muted-foreground">vs</span>
                    <span className="truncate">{m.teamB.shortName}</span>
                    <StatusBadge status={m.status} />
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {FORMAT_LABEL[m.format] ?? m.format}
                    </Badge>
                    {m.scorecardStatus && m.status === 'COMPLETED' && (
                      <Badge
                        variant="outline"
                        className={
                          m.scorecardStatus === 'VERIFIED'
                            ? 'text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700'
                            : m.scorecardStatus === 'FINALIZED'
                              ? 'text-[10px] border-amber-200 bg-amber-50 text-amber-800'
                              : 'text-[10px] border-gray-200 bg-gray-50 text-gray-600'
                        }
                      >
                        {m.scorecardStatus}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.scores.length > 0
                      ? m.scores
                        .map((s) => `${s.battingTeamId === m.teamA.id ? m.teamA.shortName : m.teamB.shortName} ${s.runs}/${s.wickets} (${s.overs})`)
                        .join(' • ')
                      : m.venue || 'No venue set'}
                    {m.resultText ? ` — ${m.resultText}` : ''}
                  </p>
                </div>
                <TeamLogo name={m.teamB.name} shortName={m.teamB.shortName} color={m.teamB.color} logoUrl={m.teamB.logoUrl} />
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {(m.status === 'LIVE' || m.status === 'PAUSED' || m.status === 'INNINGS_BREAK') && (
                  <Button size="sm" className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white rounded-xl shadow-xs font-bold text-xs" onClick={() => handleScore(m.id)}>
                    <Play className="h-3.5 w-3.5" aria-hidden /> Score
                  </Button>
                )}
                {m.status === 'SCHEDULED' && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setTossMatch(m)}>
                    <Coins className="h-3.5 w-3.5" aria-hidden /> Set toss
                  </Button>
                )}
                {m.status === 'TOSS_DONE' && (
                  <Button size="sm" className="bg-[#7A1426] hover:bg-[#5E0E1D]" onClick={() => setStartMatch(m)}>
                    <Play className="h-3.5 w-3.5" aria-hidden /> Start match
                  </Button>
                )}
                {m.status === 'INNINGS_BREAK' && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setStartMatch(m)}>
                    <Play className="h-3.5 w-3.5" aria-hidden /> Start innings 2
                  </Button>
                )}
                {m.status === 'LIVE' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void act(() => api(`/api/matches/${m.id}/action`, { method: 'POST', json: { action: 'PAUSE' } }), 'Match paused')}
                    >
                      <PauseCircle className="h-3.5 w-3.5" aria-hidden /> Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setConfirmEnd({ id: m.id, label: 'End the current innings now (declaration)?' })}
                    >
                      <Flag className="h-3.5 w-3.5" aria-hidden /> End innings
                    </Button>
                  </>
                )}
                {m.status === 'PAUSED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void act(() => api(`/api/matches/${m.id}/action`, { method: 'POST', json: { action: 'RESUME' } }), 'Match resumed')}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden /> Resume
                  </Button>
                )}
                {!['COMPLETED', 'ABANDONED'].includes(m.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    disabled={busy}
                    onClick={() => setConfirmEnd({ id: m.id, label: 'Abandon this match? Scoring stops permanently.' })}
                  >
                    Abandon
                  </Button>
                )}
                {m.status === 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
                    onClick={() => setVerifyMatch(m)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verify &amp; Sync
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleScore(m.id)}>
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Open
                </Button>
                {['SCHEDULED', 'TOSS_DONE'].includes(m.status) && (
                  <Button size="sm" variant="ghost" onClick={() => setEditMatch(m)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  onClick={() => setDeleteMatch(m)}
                  aria-label={`Delete match ${m.teamA.shortName} vs ${m.teamB.shortName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-muted-foreground">
            No matches yet — create the first one.
          </div>
        )}
      </div>

      {createOpen && (
        <MatchFormDialog
          teams={teams}
          seasons={seasons}
          tournaments={tournaments}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (data) => {
            const done = await act(() => api('/api/matches', { method: 'POST', json: data }), 'Match created')
            if (done) setCreateOpen(false)
          }}
        />
      )}
      {editMatch && (
        <MatchFormDialog
          teams={teams}
          seasons={seasons}
          tournaments={tournaments}
          initial={editMatch}
          onClose={() => setEditMatch(null)}
          onSubmit={async (data) => {
            const done = await act(() => api(`/api/matches/${editMatch.id}`, { method: 'PATCH', json: data }), 'Match updated')
            if (done) setEditMatch(null)
          }}
        />
      )}
      {verifyMatch && (
        <VerifyCorrectMatchDialog
          match={verifyMatch}
          onClose={() => setVerifyMatch(null)}
          onUpdated={() => {
            onChanged()
            setVerifyMatch(null)
          }}
        />
      )}
      {tossMatch && (
        <TossDialog
          match={tossMatch}
          onClose={() => setTossMatch(null)}
          onSubmit={async (data) => {
            const done = await act(() => api(`/api/matches/${tossMatch.id}/toss`, { method: 'POST', json: data }), 'Toss recorded')
            if (done) setTossMatch(null)
          }}
        />
      )}
      {startMatch && (
        <StartInningsDialog
          match={startMatch}
          onClose={() => setStartMatch(null)}
          onSubmit={async (data) => {
            const done = await act(() => api(`/api/matches/${startMatch.id}/start`, { method: 'POST', json: data }), startMatch.status === 'INNINGS_BREAK' ? 'Innings 2 started' : 'Match started')
            if (done) setStartMatch(null)
          }}
        />
      )}
      <AlertDialog open={!!confirmEnd} onOpenChange={(o) => !o && setConfirmEnd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmEnd?.label.includes('Abandon') ? 'Abandon match' : 'End innings'}</AlertDialogTitle>
            <AlertDialogDescription>{confirmEnd?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#7A1426] hover:bg-[#5E0E1D]"
              onClick={async () => {
                if (!confirmEnd) return
                const isAbandon = confirmEnd.label.includes('Abandon')
                await act(
                  () =>
                    api(`/api/matches/${confirmEnd.id}/action`, {
                      method: 'POST',
                      json: { action: isAbandon ? 'ABANDON' : 'END_INNINGS' },
                    }),
                  isAbandon ? 'Match abandoned' : 'Innings ended'
                )
                setConfirmEnd(null)
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteMatch} onOpenChange={(o) => !o && setDeleteMatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete match?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteMatch?.teamA.shortName} vs {deleteMatch?.teamB.shortName} with all
              deliveries and scorecards. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800"
              onClick={async () => {
                if (!deleteMatch) return
                await act(() => api(`/api/matches/${deleteMatch.id}`, { method: 'DELETE' }), 'Match deleted')
                setDeleteMatch(null)
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

// ---------------------------------------------------------------------------
// Create / edit dialog
// ---------------------------------------------------------------------------

function MatchFormDialog({
  teams,
  seasons,
  tournaments,
  initial,
  onClose,
  onSubmit,
}: {
  teams: TeamRow[]
  seasons: SeasonDto[]
  tournaments: TournamentDto[]
  initial?: MatchSummary
  onClose: () => void
  onSubmit: (data: {
    teamAId: string
    teamBId: string
    format: string
    totalOvers?: number
    seasonId?: string
    tournamentId?: string
    venue?: string
  }) => void
}) {
  const [teamAId, setTeamAId] = useState(initial?.teamA.id ?? '')
  const [teamBId, setTeamBId] = useState(initial?.teamB.id ?? '')
  const [format, setFormat] = useState(initial?.format ?? 'T20')
  const [overs, setOvers] = useState(String(initial?.totalOvers ?? 16))
  const [seasonId, setSeasonId] = useState(initial?.seasonId ?? '__DEFAULT__')
  const [tournamentId, setTournamentId] = useState(initial?.tournamentId ?? '__DEFAULT__')
  const [venue, setVenue] = useState(initial?.venue ?? '')
  const editable = !initial || ['SCHEDULED', 'TOSS_DONE'].includes(initial.status)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit match' : 'Create match'}</DialogTitle>
          <DialogDescription>
            {editable ? 'Pick two teams and a format.' : 'Match teams and format can no longer be changed.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Team A</Label>
            <Select value={teamAId} onValueChange={setTeamAId} disabled={!editable}>
              <SelectTrigger aria-label="Team A"><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team B</Label>
            <Select value={teamBId} onValueChange={setTeamBId} disabled={!editable}>
              <SelectTrigger aria-label="Team B"><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                {teams.filter((t) => t.id !== teamAId).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(v) => {
                  setFormat(v)
                  const f = FORMATS.find((x) => x.key === v)
                  if (f && f.overs > 0) setOvers(String(f.overs))
                }}
                disabled={!editable}
              >
                <SelectTrigger aria-label="Format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.key === 'CUSTOM' ? 'Custom overs' : f.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total overs</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={format === 'CUSTOM' ? overs : String(FORMATS.find((f) => f.key === format)?.overs ?? overs)}
                onChange={(e) => setOvers(e.target.value)}
                disabled={!editable || format !== 'CUSTOM'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Season (optional)</Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger aria-label="Season"><SelectValue placeholder="Active season" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__DEFAULT__">Default / Active Season</SelectItem>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tournament (optional)</Label>
              <Select value={tournamentId} onValueChange={setTournamentId}>
                <SelectTrigger aria-label="Tournament"><SelectValue placeholder="Default tournament" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__DEFAULT__">Default Tournament</SelectItem>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Venue (optional)</Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. APL Main Turf"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D]"
            disabled={!teamAId || !teamBId || teamAId === teamBId || (format === 'CUSTOM' && (!Number(overs) || Number(overs) < 1))}
            onClick={() =>
              onSubmit({
                teamAId,
                teamBId,
                format,
                totalOvers: format === 'CUSTOM' ? Number(overs) : undefined,
                ...(seasonId !== '__DEFAULT__' ? { seasonId } : {}),
                ...(tournamentId !== '__DEFAULT__' ? { tournamentId } : {}),
                ...(venue.trim() ? { venue: venue.trim() } : {}),
              })
            }
          >
            {initial ? 'Save changes' : 'Create match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Toss dialog
// ---------------------------------------------------------------------------

export function TossDialog({
  match,
  onClose,
  onSubmit,
}: {
  match: MatchSummary
  onClose: () => void
  onSubmit: (data: { tossWinnerId: string; decision: string }) => void
}) {
  const [winner, setWinner] = useState<string>(match.teamA.id)
  const [decision, setDecision] = useState<string>('BAT')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record toss</DialogTitle>
          <DialogDescription>Who won the toss and what did they elect to do?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Toss winner</Label>
            <Select value={winner} onValueChange={setWinner}>
              <SelectTrigger aria-label="Toss winner"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={match.teamA.id}>{match.teamA.name}</SelectItem>
                <SelectItem value={match.teamB.id}>{match.teamB.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Elected to</Label>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger aria-label="Decision"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BAT">Bat first</SelectItem>
                <SelectItem value="BOWL">Bowl first</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const battingFirst = decision === 'BAT' ? winner : winner === match.teamA.id ? match.teamB.id : match.teamA.id
                const bt = battingFirst === match.teamA.id ? match.teamA : match.teamB
                return `${bt.name} will bat first`
              })()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[#7A1426] hover:bg-[#5E0E1D]" onClick={() => onSubmit({ tossWinnerId: winner, decision })}>
            Save toss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Start innings dialog (openers + bowler)
// ---------------------------------------------------------------------------

export function StartInningsDialog({
  match,
  onClose,
  onSubmit,
}: {
  match: MatchSummary
  onClose: () => void
  onSubmit: (data: { strikerId: string; nonStrikerId: string; bowlerId: string }) => void
}) {
  const [squads, setSquads] = useState<{
    batting: { id: string; name: string; role: string; jerseyNumber: number | null }[]
    bowling: { id: string; name: string; role: string; jerseyNumber: number | null }[]
  } | null>(null)
  const [strikerId, setStrikerId] = useState('')
  const [nonStrikerId, setNonStrikerId] = useState('')
  const [bowlerId, setBowlerId] = useState('')
  const isSecond = match.status === 'INNINGS_BREAK'
  const battingTeamId = useMemo(() => {
    if (!isSecond) return match.battingFirstId ?? match.teamA.id
    const inn1 = match.scores.find((s) => s.number === 1)
    return inn1 ? (inn1.battingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id) : match.teamA.id
  }, [isSecond, match])
  const bowlingTeamId = battingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id

  useEffect(() => {
    let alive = true
    interface SquadPlayer { id: string; name: string; role: string; jerseyNumber: number | null }
    interface TeamDetailResponse { players: SquadPlayer[] }
    Promise.all([
      api<TeamDetailResponse>(`/api/teams/${battingTeamId}`),
      api<TeamDetailResponse>(`/api/teams/${bowlingTeamId}`),
    ]).then(([bat, bowl]) => {
      if (!alive) return
      setSquads({ batting: bat.players, bowling: bowl.players })
      setStrikerId(bat.players[0]?.id ?? '')
      setNonStrikerId(bat.players[1]?.id ?? '')
    })
    return () => {
      alive = false
    }
  }, [battingTeamId, bowlingTeamId, match.id])

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSecond ? 'Start second innings' : 'Start match'}</DialogTitle>
          <DialogDescription>
            Choose the two opening batters and the opening bowler.
          </DialogDescription>
        </DialogHeader>
        {!squads ? (
          <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Striker (faces the first ball)</Label>
              <Select value={strikerId} onValueChange={setStrikerId}>
                <SelectTrigger aria-label="Striker"><SelectValue placeholder="Select opener" /></SelectTrigger>
                <SelectContent>
                  {squads.batting.filter((p: { id: string }) => p.id !== nonStrikerId).map((p: { id: string; name: string; jerseyNumber: number | null }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Non-striker</Label>
              <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
                <SelectTrigger aria-label="Non-striker"><SelectValue placeholder="Select opener" /></SelectTrigger>
                <SelectContent>
                  {squads.batting.filter((p: { id: string }) => p.id !== strikerId).map((p: { id: string; name: string; jerseyNumber: number | null }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opening bowler</Label>
              <Select value={bowlerId} onValueChange={setBowlerId}>
                <SelectTrigger aria-label="Opening bowler"><SelectValue placeholder="Select bowler" /></SelectTrigger>
                <SelectContent>
                  {squads.bowling.map((p: { id: string; name: string; jerseyNumber: number | null }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#7A1426] hover:bg-[#5E0E1D]"
            disabled={!strikerId || !nonStrikerId || !bowlerId || strikerId === nonStrikerId}
            onClick={() => onSubmit({ strikerId, nonStrikerId, bowlerId })}
          >
            {isSecond ? 'Start innings 2' : 'Start match'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Scorecard Finalization, Career Verification & Authorized Correction Dialog
// ---------------------------------------------------------------------------

function VerifyCorrectMatchDialog({
  match,
  onClose,
  onUpdated,
}: {
  match: MatchSummary
  onClose: () => void
  onUpdated: () => void
}) {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Array<{ id: string; playerCode?: string | null; name: string; teamShort: string }>>([])
  const [pomId, setPomId] = useState(match.playerOfMatchId ?? '__NONE__')
  const [statusPlayerId, setStatusPlayerId] = useState('')
  const [playerStatus, setPlayerStatus] = useState<'PLAYED' | 'RETIRED_HURT' | 'RETIRED_OUT' | 'ABSENT'>('RETIRED_HURT')
  const [correctionReason, setCorrectionReason] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      api<{ players: Array<{ id: string; playerCode?: string | null; name: string }> }>(`/api/teams/${match.teamA.id}`).catch(() => ({ players: [] })),
      api<{ players: Array<{ id: string; playerCode?: string | null; name: string }> }>(`/api/teams/${match.teamB.id}`).catch(() => ({ players: [] })),
    ]).then(([tA, tB]) => {
      if (!alive) return
      const combined = [
        ...tA.players.map((p) => ({ ...p, teamShort: match.teamA.shortName })),
        ...tB.players.map((p) => ({ ...p, teamShort: match.teamB.shortName })),
      ]
      setPlayers(combined)
      if (combined.length > 0) setStatusPlayerId(combined[0].id)
    })
    return () => {
      alive = false
    }
  }, [match.teamA.id, match.teamA.shortName, match.teamB.id, match.teamB.shortName])

  async function runAction(label: string, fn: () => Promise<unknown>, closeAfter = true) {
    setBusyAction(label)
    try {
      await fn()
      toast({ title: label })
      if (closeAfter) onUpdated()
    } catch (e) {
      toast({ title: `${label} failed`, description: (e as Error).message, variant: 'destructive' })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scorecard Verification &amp; Career Sync</DialogTitle>
          <DialogDescription>
            {match.teamA.shortName} vs {match.teamB.shortName} • Scorecard status:{' '}
            <span className="font-bold text-[#111827]">{match.scorecardStatus || 'DRAFT'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Player of the Match Award</Label>
            <Select value={pomId} onValueChange={setPomId}>
              <SelectTrigger aria-label="Player of the Match"><SelectValue placeholder="None assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">No Player of the Match</SelectItem>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.teamShort})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Match Participation / Retirement Override
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={statusPlayerId} onValueChange={setStatusPlayerId}>
                <SelectTrigger aria-label="Player"><SelectValue placeholder="Select player" /></SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.teamShort})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={playerStatus} onValueChange={(v) => setPlayerStatus(v as typeof playerStatus)}>
                <SelectTrigger aria-label="Player Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYED">PLAYED</SelectItem>
                  <SelectItem value="RETIRED_HURT">RETIRED_HURT (not out)</SelectItem>
                  <SelectItem value="RETIRED_OUT">RETIRED_OUT (out)</SelectItem>
                  <SelectItem value="ABSENT">ABSENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!statusPlayerId || busyAction !== null}
              onClick={() =>
                void runAction(
                  'Player status updated',
                  () =>
                    api(`/api/matches/${match.id}/player-status`, {
                      method: 'POST',
                      json: { playerId: statusPlayerId, status: playerStatus },
                    }),
                  false
                )
              }
            >
              Save Player Status
            </Button>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5">
            <p className="text-xs text-emerald-950 font-medium">
              Only verified scorecards update official PlayerMatchStat, lifetime PlayerCareerStat, and leaderboards (idempotently).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyAction !== null}
                onClick={() =>
                  void runAction(
                    'Scorecard finalized',
                    () => api(`/api/matches/${match.id}/finalize`, { method: 'POST' }),
                    false
                  )
                }
              >
                1. Finalize Scorecard
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                disabled={busyAction !== null}
                onClick={() =>
                  void runAction('Match verified & career stats synced', () =>
                    api(`/api/matches/${match.id}/verify`, {
                      method: 'POST',
                      json: { playerOfMatchId: pomId === '__NONE__' ? null : pomId },
                    })
                  )
                }
              >
                2. Verify &amp; Sync Career Stats
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
            <Label htmlFor="corr-reason" className="text-xs font-bold text-amber-950">
              Authorized Scorecard Correction &amp; Recalculation
            </Label>
            <Input
              id="corr-reason"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Audit reason (e.g. Updated Player of Match / status correction)"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busyAction !== null}
              onClick={() =>
                void runAction('Correction applied & stats recalculated', () =>
                  api(`/api/matches/${match.id}/correct`, {
                    method: 'POST',
                    json: {
                      playerOfMatchId: pomId === '__NONE__' ? null : pomId,
                      reason: correctionReason.trim() || 'Authorized admin correction',
                    },
                  })
                )
              }
            >
              Correct Scorecard &amp; Recalculate
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
