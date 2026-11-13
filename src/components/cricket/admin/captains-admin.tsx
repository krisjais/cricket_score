'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Crown,
  Search,
  Plus,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ClipboardList,
  Filter,
  UserCheck,
  Shield,
  Calendar,
  Eye,
  ArrowRightLeft,
} from 'lucide-react'
import { api, fmtDate } from '@/lib/client'
import { formatCricketLabel } from '../player/player-types'
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
import { toast } from 'sonner'

interface CaptainOverviewItem {
  id: string
  playerId: string
  teamId: string
  seasonId: string
  assignedBy: string
  assignedAt: string
  endedAt: string | null
  status: 'active' | 'completed' | 'revoked'
  notes: string | null
  player: {
    id: string
    name: string
    playerCode: string | null
    role: string
    avatarUrl: string | null
  } | null
  team: {
    id: string
    name: string
    shortName: string
    color: string
    logoUrl: string | null
  } | null
  season: {
    id: string
    name: string
    code: string
    year: number
    status: string
  } | null
}

interface SquadCandidate {
  id: string
  name: string
  playerCode: string | null
  role: string
  avatarUrl: string | null
  jerseyNumber: number | null
  isCurrentTeamCaptain: boolean
  isOtherTeamCaptain: boolean
}

interface AuditLogItem {
  id: string
  assignmentId: string
  action: 'ASSIGN' | 'REPLACE' | 'REMOVE' | 'AUTO_EXPIRE'
  seasonId: string
  teamId: string
  performedBy: string
  performedAt: string
  reason: string | null
  previousCaptain: { id: string; name: string; playerCode: string | null } | null
  newCaptain: { id: string; name: string; playerCode: string | null } | null
  team: { id: string; name: string; shortName: string } | null
  season: { id: string; name: string; year: number } | null
}

interface LineupSubmissionItem {
  id: string
  matchId: string
  teamId: string
  seasonId: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  notes: string | null
  reviewNotes: string | null
  submittedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  match: {
    id: string
    matchDate: string | null
    venue: string | null
    status: string
    opponent: { id: string; name: string; shortName: string } | null
  } | null
  team: { id: string; name: string; shortName: string } | null
  captain: { id: string; name: string; role: string; playerCode: string | null } | null
  playingXIPlayers: Array<{ id: string; name: string; role: string }>
  substitutePlayers: Array<{ id: string; name: string; role: string }>
}

interface SeasonOption {
  id: string
  name: string
  code: string
  year: number
  status: string
  isDefault: boolean
}

interface TeamOption {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
}

function SquadPlayerAvatar({
  name,
  avatarUrl,
  isSelected,
  brand = 'maroon',
  size = 'md',
}: {
  name: string
  avatarUrl?: string | null
  isSelected?: boolean
  brand?: 'maroon' | 'blue'
  size?: 'sm' | 'md' | 'lg'
}) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  const textClass = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]'

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${
          isSelected
            ? 'ring-2 ring-white/70 shadow-xs'
            : 'border border-gray-200 bg-gray-100'
        }`}
      />
    )
  }

  const bgClass = isSelected
    ? 'bg-white/20 text-white'
    : brand === 'blue'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-[#7A1426]/10 text-[#7A1426]'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-black shrink-0 ${textClass} ${bgClass}`}
    >
      {name?.slice(0, 2).toUpperCase() || 'PL'}
    </div>
  )
}

export function CaptainsAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'lineups'>('overview')
  const [assignments, setAssignments] = useState<CaptainOverviewItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [lineupSubmissions, setLineupSubmissions] = useState<LineupSubmissionItem[]>([])
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedSeason, setSelectedSeason] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog States
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignSeasonId, setAssignSeasonId] = useState('')
  const [assignTeamId, setAssignTeamId] = useState('')
  const [assignPlayerId, setAssignPlayerId] = useState('')
  const [assignNotes, setAssignNotes] = useState('')
  const [replaceExistingChecked, setReplaceExistingChecked] = useState(false)
  const [squadCandidates, setSquadCandidates] = useState<SquadCandidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')

  // Replace Dialog
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [replaceTarget, setReplaceTarget] = useState<CaptainOverviewItem | null>(null)
  const [replacePlayerId, setReplacePlayerId] = useState('')
  const [replaceReason, setReplaceReason] = useState('')
  const [savingReplace, setSavingReplace] = useState(false)
  const [replacePlayerSearchQuery, setReplacePlayerSearchQuery] = useState('')

  // Remove Dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<CaptainOverviewItem | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [savingRemove, setSavingRemove] = useState(false)

  // Lineup Review Dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<LineupSubmissionItem | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [reviewNotes, setReviewNotes] = useState('')
  const [applyToMatch, setApplyToMatch] = useState(true)
  const [savingReview, setSavingReview] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [seasonList, teamList] = await Promise.all([
        api<SeasonOption[]>('/api/seasons'),
        api<TeamOption[]>('/api/teams'),
      ])
      setSeasons(seasonList)
      setTeams(teamList)

      const activeSeason = seasonList.find((s) => s.status === 'ACTIVE' || s.isDefault) ?? seasonList[0]
      if (activeSeason && selectedSeason === 'all') {
        setSelectedSeason(activeSeason.id)
      }

      const params = new URLSearchParams()
      if (selectedSeason && selectedSeason !== 'all') params.set('seasonId', selectedSeason)
      if (selectedTeam && selectedTeam !== 'all') params.set('teamId', selectedTeam)
      if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus)
      if (searchQuery.trim()) params.set('query', searchQuery.trim())

      const [overviewData, auditData, lineupsData] = await Promise.all([
        api<CaptainOverviewItem[]>(`/api/captains/admin/overview?${params.toString()}`),
        api<AuditLogItem[]>('/api/captains/admin/audit-logs'),
        api<LineupSubmissionItem[]>('/api/captains/admin/lineups'),
      ])

      setAssignments(overviewData)
      setAuditLogs(auditData)
      setLineupSubmissions(lineupsData)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load captaincy data')
    } finally {
      setLoading(false)
    }
  }, [selectedSeason, selectedTeam, selectedStatus, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Fetch squad candidates when assigning
  useEffect(() => {
    if (!assignDialogOpen || !assignSeasonId || !assignTeamId) {
      if (!replaceDialogOpen) {
        setSquadCandidates([])
      }
      return
    }

    setLoadingCandidates(true)
    api<SquadCandidate[]>(
      `/api/captains/admin/squad-candidates?seasonId=${assignSeasonId}&teamId=${assignTeamId}`
    )
      .then((candidates) => {
        setSquadCandidates(candidates)
        if (candidates.length > 0 && !assignPlayerId) {
          const defaultCand = candidates.find((c) => !c.isOtherTeamCaptain && !c.isCurrentTeamCaptain)
          if (defaultCand) setAssignPlayerId(defaultCand.id)
        }
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to load team squad candidates')
      })
      .finally(() => setLoadingCandidates(false))
  }, [assignDialogOpen, assignSeasonId, assignTeamId, replaceDialogOpen])

  // Fetch squad candidates when replacing
  useEffect(() => {
    if (!replaceDialogOpen || !replaceTarget?.seasonId || !replaceTarget?.teamId) {
      return
    }

    setLoadingCandidates(true)
    api<SquadCandidate[]>(
      `/api/captains/admin/squad-candidates?seasonId=${replaceTarget.seasonId}&teamId=${replaceTarget.teamId}`
    )
      .then((candidates) => {
        setSquadCandidates(candidates)
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to load team squad candidates')
      })
      .finally(() => setLoadingCandidates(false))
  }, [replaceDialogOpen, replaceTarget?.seasonId, replaceTarget?.teamId])

  // KPIs
  const activeCaptainsCount = useMemo(
    () => assignments.filter((a) => a.status === 'active').length,
    [assignments]
  )
  const totalTeamsCount = teams.length
  const pendingSubmissionsCount = useMemo(
    () => lineupSubmissions.filter((l) => l.status === 'SUBMITTED').length,
    [lineupSubmissions]
  )

  // Current active captain of the team being assigned
  const currentActiveInAssignedTeam = useMemo(() => {
    if (!assignSeasonId || !assignTeamId) return null
    return assignments.find(
      (a) => a.seasonId === assignSeasonId && a.teamId === assignTeamId && a.status === 'active'
    )
  }, [assignments, assignSeasonId, assignTeamId])

  // Filtered squad candidates for Assign Dialog
  const filteredCandidates = useMemo(() => {
    const q = playerSearchQuery.trim().toLowerCase()
    if (!q) return squadCandidates
    return squadCandidates.filter((cand) => {
      const matchName = cand.name.toLowerCase().includes(q)
      const matchRole = cand.role.toLowerCase().includes(q)
      const matchJersey = cand.jerseyNumber !== null && String(cand.jerseyNumber).includes(q)
      const matchCode = cand.playerCode ? cand.playerCode.toLowerCase().includes(q) : false
      return matchName || matchRole || matchJersey || matchCode
    })
  }, [squadCandidates, playerSearchQuery])

  const selectedAssignCandidate = useMemo(() => {
    return squadCandidates.find((c) => c.id === assignPlayerId) ?? null
  }, [squadCandidates, assignPlayerId])

  // Filtered squad candidates for Replace Dialog
  const filteredReplaceCandidates = useMemo(() => {
    const list = squadCandidates.filter((c) => c.id !== replaceTarget?.playerId)
    const q = replacePlayerSearchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter((cand) => {
      const matchName = cand.name.toLowerCase().includes(q)
      const matchRole = cand.role.toLowerCase().includes(q)
      const matchJersey = cand.jerseyNumber !== null && String(cand.jerseyNumber).includes(q)
      const matchCode = cand.playerCode ? cand.playerCode.toLowerCase().includes(q) : false
      return matchName || matchRole || matchJersey || matchCode
    })
  }, [squadCandidates, replaceTarget?.playerId, replacePlayerSearchQuery])

  const selectedReplaceCandidate = useMemo(() => {
    return squadCandidates.find((c) => c.id === replacePlayerId) ?? null
  }, [squadCandidates, replacePlayerId])

  // Handle Assign
  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assignSeasonId || !assignTeamId || !assignPlayerId) {
      toast.error('Season, team, and player are required')
      return
    }

    setSavingAssign(true)
    try {
      await api('/api/captains/admin/assign', {
        method: 'POST',
        json: {
          seasonId: assignSeasonId,
          teamId: assignTeamId,
          playerId: assignPlayerId,
          notes: assignNotes.trim() || undefined,
          replaceExisting: replaceExistingChecked,
        },
      })
      toast.success('Captain assigned successfully')
      setAssignDialogOpen(false)
      setAssignNotes('')
      setReplaceExistingChecked(false)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign captain')
    } finally {
      setSavingAssign(false)
    }
  }

  // Handle Replace
  async function handleReplaceSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replaceTarget || !replacePlayerId) {
      toast.error('New captain must be selected')
      return
    }

    setSavingReplace(true)
    try {
      await api('/api/captains/admin/replace', {
        method: 'POST',
        json: {
          seasonId: replaceTarget.seasonId,
          teamId: replaceTarget.teamId,
          newPlayerId: replacePlayerId,
          reason: replaceReason.trim() || undefined,
        },
      })
      toast.success('Captain replaced successfully')
      setReplaceDialogOpen(false)
      setReplaceTarget(null)
      setReplacePlayerId('')
      setReplaceReason('')
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to replace captain')
    } finally {
      setSavingReplace(false)
    }
  }

  // Handle Remove
  async function handleRemoveConfirm() {
    if (!removeTarget) return
    setSavingRemove(true)
    try {
      await api('/api/captains/admin/remove', {
        method: 'POST',
        json: {
          assignmentId: removeTarget.id,
          reason: removeReason.trim() || undefined,
        },
      })
      toast.success('Captaincy removed successfully. History preserved.')
      setRemoveDialogOpen(false)
      setRemoveTarget(null)
      setRemoveReason('')
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove captain')
    } finally {
      setSavingRemove(false)
    }
  }

  // Handle Lineup Review
  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewTarget) return

    setSavingReview(true)
    try {
      await api(`/api/captains/admin/lineups/${reviewTarget.id}/review`, {
        method: 'POST',
        json: {
          status: reviewStatus,
          reviewNotes: reviewNotes.trim() || undefined,
          applyToMatch,
        },
      })
      toast.success(`Playing XI ${reviewStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`)
      setReviewDialogOpen(false)
      setReviewTarget(null)
      setReviewNotes('')
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to review Playing XI')
    } finally {
      setSavingReview(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7A1426]/10 text-[#7A1426]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#111827] tracking-tight">
                Captain Management
              </h1>
              <p className="text-xs text-gray-500">
                Seasonal captaincy assignments, role permissions, lineups, and permanent career records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            <RefreshCcw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const defaultSeason = seasons.find((s) => s.status === 'ACTIVE' || s.isDefault) ?? seasons[0]
              setAssignSeasonId(defaultSeason?.id ?? '')
              setAssignTeamId(teams[0]?.id ?? '')
              setAssignPlayerId('')
              setAssignNotes('')
              setReplaceExistingChecked(false)
              setPlayerSearchQuery('')
              setAssignDialogOpen(true)
            }}
            className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Captain
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Active Captains</span>
            <Crown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#111827]">{activeCaptainsCount}</div>
          <div className="mt-0.5 text-[11px] text-gray-400">Current season leaders</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Participating Teams</span>
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#111827]">{totalTeamsCount}</div>
          <div className="mt-0.5 text-[11px] text-gray-400">Registered clubs</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Pending Lineups</span>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#111827]">{pendingSubmissionsCount}</div>
          <div className="mt-0.5 text-[11px] text-gray-400">Awaiting admin review</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Total History Records</span>
            <History className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#111827]">{assignments.length}</div>
          <div className="mt-0.5 text-[11px] text-gray-400">Lifetime tenures recorded</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-bold" aria-label="Captain tabs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#7A1426] text-[#7A1426]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>Captains Overview</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
              {assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lineups')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'lineups'
                ? 'border-[#7A1426] text-[#7A1426]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Playing XI Submissions</span>
            {pendingSubmissionsCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#7A1426] text-[#7A1426]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Audit History</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
              {auditLogs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: CAPTAINS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xs sm:grid-cols-4">
            <div>
              <Label className="text-[10px] font-bold uppercase text-gray-400">Season</Label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                <option value="all">All Seasons</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.year}) {s.status === 'COMPLETED' ? '• Done' : '• Active'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-gray-400">Team</Label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                <option value="all">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-gray-400">Status</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="completed">Completed (Expired)</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-gray-400">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Player, team, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
            {assignments.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                <Crown className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                No captaincy records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Season</th>
                      <th className="py-3 px-4">Captain</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned On</th>
                      <th className="py-3 px-4">Ended On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignments.map((item) => {
                      const isActive = item.status === 'active'
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.team?.color || '#7A1426' }}
                              />
                              <div className="font-bold text-[#111827]">
                                {item.team?.name ?? 'Unknown Team'}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                ({item.team?.shortName})
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 align-middle">
                            <div className="font-semibold text-gray-800">
                              {item.season?.name ?? 'Unknown Season'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {item.season?.year} • {item.season?.status}
                            </div>
                          </td>

                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2.5">
                              <SquadPlayerAvatar
                                name={item.player?.name ?? 'Unknown Player'}
                                avatarUrl={item.player?.avatarUrl}
                                brand="maroon"
                                size="md"
                              />
                              <div>
                                <div className="font-bold text-[#111827]">
                                  {item.player?.name ?? 'Unknown Player'}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {item.player?.playerCode ? `${item.player.playerCode} • ` : ''}
                                  {item.player?.role}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 align-middle">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'completed'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.status === 'active'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : item.status === 'completed'
                                      ? 'bg-blue-500'
                                      : 'bg-rose-500'
                                }`}
                              />
                              {item.status.toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-gray-600 align-middle">
                            <div>{fmtDate(item.assignedAt)}</div>
                            <div className="text-[10px] text-gray-400">By: {item.assignedBy}</div>
                          </td>

                          <td className="py-3 px-4 text-gray-600 align-middle">
                            {item.endedAt ? fmtDate(item.endedAt) : '—'}
                          </td>

                          <td className="py-3 px-4 text-right align-middle">
                            {isActive ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplaceTarget(item)
                                    setReplacePlayerId('')
                                    setReplaceReason('')
                                    setReplacePlayerSearchQuery('')
                                    setReplaceDialogOpen(true)
                                  }}
                                  className="h-8 rounded-lg px-2.5 text-[11px] font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                                  <span>Replace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRemoveTarget(item)
                                    setRemoveReason('')
                                    setRemoveDialogOpen(true)
                                  }}
                                  className="h-8 rounded-lg px-2.5 text-[11px] font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <span>Revoke</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <span className="text-[11px] font-medium text-gray-400 italic">
                                  Historical
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LINEUPS REVIEW */}
      {activeTab === 'lineups' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
            {lineupSubmissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                <ClipboardList className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                No Playing XI submissions from captains yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Match Date & Opponent</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Submitted By</th>
                      <th className="py-3 px-4">Lineup Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineupSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#111827]">
                            vs {sub.match?.opponent?.name ?? 'Opponent'}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {fmtDate(sub.match?.matchDate ?? null)} • {sub.match?.venue || 'Venue TBA'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-[#111827]">
                          {sub.team?.name ?? 'Team'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800">
                            {sub.captain?.name ?? 'Captain'}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Submitted: {sub.submittedAt ? fmtDate(sub.submittedAt) : 'Draft'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#7A1426]">
                            {sub.playingXIPlayers.length} / 11 Players
                          </span>
                          {sub.substitutePlayers.length > 0 && (
                            <span className="text-[10px] text-gray-400 block">
                              +{sub.substitutePlayers.length} Subs
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.status === 'SUBMITTED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : sub.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right align-middle">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewTarget(sub)
                                setReviewStatus(sub.status === 'APPROVED' ? 'APPROVED' : 'APPROVED')
                                setReviewNotes(sub.reviewNotes || '')
                                setApplyToMatch(true)
                                setReviewDialogOpen(true)
                              }}
                              className="h-8 rounded-lg px-2.5 text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] hover:bg-[#7A1426]/10 border-[#7A1426]/20 cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5 text-current shrink-0" />
                              <span>Review XI</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                <History className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                No captaincy audit events recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Season & Team</th>
                      <th className="py-3 px-4">Previous Captain</th>
                      <th className="py-3 px-4">New Captain</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              log.action === 'ASSIGN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.action === 'REPLACE'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : log.action === 'REMOVE'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#111827]">{log.team?.name}</div>
                          <div className="text-[10px] text-gray-400">{log.season?.name}</div>
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          {log.previousCaptain?.name || '—'}
                        </td>

                        <td className="py-3 px-4 font-bold text-[#111827]">
                          {log.newCaptain?.name || '—'}
                        </td>

                        <td className="py-3 px-4 text-gray-600">{log.performedBy}</td>

                        <td className="py-3 px-4 text-gray-500">{fmtDate(log.performedAt)}</td>

                        <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                          {log.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG 1: ASSIGN CAPTAIN */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#111827] flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#7A1426]" />
              Assign Team Captain
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select an active season, participating team, and registered squad player.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">1. Active Season</Label>
              <select
                value={assignSeasonId}
                onChange={(e) => {
                  setAssignSeasonId(e.target.value)
                  setAssignPlayerId('')
                  setPlayerSearchQuery('')
                }}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.year}) {s.status === 'COMPLETED' ? '• COMPLETED' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">2. Team</Label>
              <select
                value={assignTeamId}
                onChange={(e) => {
                  setAssignTeamId(e.target.value)
                  setAssignPlayerId('')
                  setPlayerSearchQuery('')
                }}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Active Captain Alert */}
            {currentActiveInAssignedTeam && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Team already has an active captain</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Current: <strong>{currentActiveInAssignedTeam.player?.name}</strong>. Assigning a new
                  captain will replace them and update permissions immediately.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExistingChecked}
                    onChange={(e) => setReplaceExistingChecked(e.target.checked)}
                    className="rounded text-[#7A1426] focus:ring-[#7A1426]"
                  />
                  <span>Confirm replacement of existing captain</span>
                </label>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-bold text-gray-700">
                  3. Select Player (From Registered Squad)
                </Label>
                {squadCandidates.length > 0 && (
                  <span className="text-[11px] font-medium text-gray-400">
                    {squadCandidates.length} {squadCandidates.length === 1 ? 'squad player' : 'squad players'}
                  </span>
                )}
              </div>

              {loadingCandidates ? (
                <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin text-[#7A1426]" />
                  <span>Loading team squad...</span>
                </div>
              ) : squadCandidates.length === 0 ? (
                <div className="mt-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 text-center">
                  No registered players found in this team's season squad.
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {/* Search Player Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      placeholder="Search squad player by name, role, jersey #..."
                      className="pl-8.5 pr-8 text-xs rounded-xl h-9 border-gray-200 bg-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#7A1426]"
                    />
                    {playerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPlayerSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                        aria-label="Clear search"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Visual Quick-Select Squad Player Cards */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/70 p-2">
                    {filteredCandidates.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        No squad players match &ldquo;{playerSearchQuery}&rdquo;
                      </div>
                    ) : (
                      filteredCandidates.map((cand) => {
                        const isSelected = assignPlayerId === cand.id
                        const isDisabled = cand.isOtherTeamCaptain || cand.isCurrentTeamCaptain
                        return (
                          <button
                            key={cand.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setAssignPlayerId(cand.id)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#7A1426] text-white shadow-2xs font-bold'
                                : isDisabled
                                ? 'bg-gray-100/70 text-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-white text-gray-800 hover:bg-gray-100/90 border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SquadPlayerAvatar
                                name={cand.name}
                                avatarUrl={cand.avatarUrl}
                                isSelected={isSelected}
                                brand="maroon"
                                size="md"
                              />
                              <div className="min-w-0 truncate">
                                <span className="font-bold truncate">{cand.name}</span>
                                <span
                                  className={`text-[10px] ml-1.5 ${
                                    isSelected ? 'text-white/80' : 'text-gray-500'
                                  }`}
                                >
                                  • {formatCricketLabel(cand.role)}
                                  {cand.jerseyNumber ? ` #${cand.jerseyNumber}` : ''}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                              {cand.isCurrentTeamCaptain && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  Current Captain
                                </span>
                              )}
                              {cand.isOtherTeamCaptain && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                  Another Team
                                </span>
                              )}
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* Selected player confirmation pill */}
                  {selectedAssignCandidate && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs text-emerald-950">
                      <div className="flex items-center gap-2 truncate">
                        <SquadPlayerAvatar
                          name={selectedAssignCandidate.name}
                          avatarUrl={selectedAssignCandidate.avatarUrl}
                          brand="maroon"
                          size="sm"
                        />
                        <span className="truncate">
                          Selected: <strong>{selectedAssignCandidate.name}</strong> ({formatCricketLabel(selectedAssignCandidate.role)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignPlayerId('')}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 ml-2 shrink-0 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Notes / Audit Reason (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Official Season 9 Appointment"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="rounded-xl text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAssignDialogOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  savingAssign ||
                  !assignPlayerId ||
                  Boolean(currentActiveInAssignedTeam && !replaceExistingChecked)
                }
                className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
              >
                {savingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: REPLACE CAPTAIN */}
      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#111827] flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Replace Team Captain
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Immediately revoke previous captaincy and grant permissions to a new squad player.
            </DialogDescription>
          </DialogHeader>

          {replaceTarget && (
            <form onSubmit={handleReplaceSubmit} className="space-y-4 pt-2">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs">
                <SquadPlayerAvatar
                  name={replaceTarget.player?.name || 'CP'}
                  avatarUrl={replaceTarget.player?.avatarUrl}
                  brand="blue"
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="text-gray-500 font-bold uppercase text-[10px]">Current Captain</div>
                  <div className="font-extrabold text-sm text-[#111827] truncate">{replaceTarget.player?.name}</div>
                  <div className="text-gray-500 truncate">
                    {replaceTarget.team?.name} • {replaceTarget.season?.name}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700">
                    Select New Captain (From Registered Squad)
                  </Label>
                  {squadCandidates.length > 0 && (
                    <span className="text-[11px] font-medium text-gray-400">
                      {squadCandidates.filter((c) => c.id !== replaceTarget.playerId).length} eligible squad members
                    </span>
                  )}
                </div>

                {loadingCandidates ? (
                  <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Loading team squad...</span>
                  </div>
                ) : squadCandidates.filter((c) => c.id !== replaceTarget.playerId).length === 0 ? (
                  <div className="mt-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 text-center">
                    No eligible replacement players found in this team&apos;s squad.
                  </div>
                ) : (
                  <div className="space-y-2 mt-1">
                    {/* Search Player Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <Input
                        type="text"
                        value={replacePlayerSearchQuery}
                        onChange={(e) => setReplacePlayerSearchQuery(e.target.value)}
                        placeholder="Search squad player by name, role, jersey #..."
                        className="pl-8.5 pr-8 text-xs rounded-xl h-9 border-gray-200 bg-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-600"
                      />
                      {replacePlayerSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setReplacePlayerSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                          aria-label="Clear search"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Visual Quick-Select Squad Player Cards */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/70 p-2">
                      {filteredReplaceCandidates.length === 0 ? (
                        <div className="py-4 text-center text-xs text-gray-400">
                          No squad players match &ldquo;{replacePlayerSearchQuery}&rdquo;
                        </div>
                      ) : (
                        filteredReplaceCandidates.map((cand) => {
                          const isSelected = replacePlayerId === cand.id
                          const isDisabled = cand.isOtherTeamCaptain
                          return (
                            <button
                              key={cand.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setReplacePlayerId(cand.id)}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                  : isDisabled
                                  ? 'bg-gray-100/70 text-gray-400 cursor-not-allowed opacity-60'
                                  : 'bg-white text-gray-800 hover:bg-gray-100/90 border border-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SquadPlayerAvatar
                                  name={cand.name}
                                  avatarUrl={cand.avatarUrl}
                                  isSelected={isSelected}
                                  brand="blue"
                                  size="md"
                                />
                                <div className="min-w-0 truncate">
                                  <span className="font-bold truncate">{cand.name}</span>
                                  <span
                                    className={`text-[10px] ml-1.5 ${
                                      isSelected ? 'text-white/80' : 'text-gray-500'
                                    }`}
                                  >
                                    • {formatCricketLabel(cand.role)}
                                    {cand.jerseyNumber ? ` #${cand.jerseyNumber}` : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                {cand.isOtherTeamCaptain && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    Another Team
                                  </span>
                                )}
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {/* Selected player confirmation pill */}
                    {selectedReplaceCandidate && (
                      <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs text-blue-950">
                        <div className="flex items-center gap-2 truncate">
                          <SquadPlayerAvatar
                            name={selectedReplaceCandidate.name}
                            avatarUrl={selectedReplaceCandidate.avatarUrl}
                            brand="blue"
                            size="sm"
                          />
                          <span className="truncate">
                            New Captain: <strong>{selectedReplaceCandidate.name}</strong> ({formatCricketLabel(selectedReplaceCandidate.role)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplacePlayerId('')}
                          className="text-[10px] font-bold text-blue-700 hover:text-blue-900 ml-2 shrink-0 underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Reason for Change</Label>
                <Input
                  type="text"
                  placeholder="e.g. Mid-season leadership change"
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReplaceDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingReplace || !replacePlayerId}
                  className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {savingReplace ? 'Replacing...' : 'Confirm Replacement'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: REMOVE CAPTAIN CONFIRMATION */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-[#111827] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Revoke Captaincy Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-600 space-y-2">
              <p>
                Are you sure you want to revoke captaincy for{' '}
                <strong>{removeTarget?.player?.name}</strong> from{' '}
                <strong>{removeTarget?.team?.name}</strong>?
              </p>
              <p className="text-[11px] text-gray-500">
                Captain permissions will be revoked immediately. Historical statistics, match
                records, and captaincy badges will remain permanently saved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label className="text-xs font-bold text-gray-700">Revocation Reason (Optional)</Label>
            <Input
              type="text"
              placeholder="e.g. Stepped down voluntarily"
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="rounded-xl text-xs mt-1"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={savingRemove}
              className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
            >
              {savingRemove ? 'Revoking...' : 'Revoke Captaincy'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG 4: REVIEW LINEUP SUBMISSION */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#111827] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#7A1426]" />
              Review Suggested Playing XI
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submitted by team captain for upcoming match.
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-3 text-xs space-y-1">
                <div className="font-extrabold text-[#111827]">
                  {reviewTarget.team?.name} vs {reviewTarget.match?.opponent?.name}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Captain: {reviewTarget.captain?.name} • Submitted:{' '}
                  {reviewTarget.submittedAt ? fmtDate(reviewTarget.submittedAt) : 'Draft'}
                </div>
                {reviewTarget.notes && (
                  <div className="text-gray-600 text-[11px] italic pt-1">
                    Captain Notes: &ldquo;{reviewTarget.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Lineup list */}
              <div>
                <Label className="text-xs font-bold text-gray-700">
                  Suggested Playing XI ({reviewTarget.playingXIPlayers.length} Players)
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-white">
                  {reviewTarget.playingXIPlayers.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px]"
                    >
                      <span className="font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <span className="font-bold text-gray-800 truncate">{p.name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviewTarget.substitutePlayers.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-gray-700">
                    Substitutes ({reviewTarget.substitutePlayers.length})
                  </Label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {reviewTarget.substitutePlayers.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
                      >
                        {p.name} ({p.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Review decisions */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Review Decision</Label>
                <div className="mt-1.5 flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={reviewStatus === 'APPROVED'}
                      onChange={() => setReviewStatus('APPROVED')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-700">Approve Lineup</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="REJECTED"
                      checked={reviewStatus === 'REJECTED'}
                      onChange={() => setReviewStatus('REJECTED')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-700">Reject / Request Changes</span>
                  </label>
                </div>
              </div>

              {reviewStatus === 'APPROVED' && (
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={applyToMatch}
                    onChange={(e) => setApplyToMatch(e.target.checked)}
                    className="rounded text-[#7A1426] focus:ring-[#7A1426]"
                  />
                  <span>Apply directly to match official Playing XI</span>
                </label>
              )}

              <div>
                <Label className="text-xs font-bold text-gray-700">Feedback / Review Notes</Label>
                <Input
                  type="text"
                  placeholder="e.g. Lineup approved by tournament director"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReviewDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingReview}
                  className={`rounded-xl text-xs font-bold text-white ${
                    reviewStatus === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {savingReview ? 'Saving...' : `Save ${reviewStatus}`}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
