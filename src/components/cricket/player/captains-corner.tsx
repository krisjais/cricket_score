'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import {
  Crown,
  Users,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  BarChart3,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCcw,
  Sparkles,
  Trophy,
  Shield,
  Send,
  Save,
  AlertCircle,
  AlertTriangle,
  Archive,
  Edit2,
  Mail,
  MapPin,
  Calendar,
  Smartphone,
  Check,
} from 'lucide-react'
import { api, fmtDate } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  fmtDateTime,
  formatCricketLabel,
  type EnrichedCaptaincyStatus,
  type TeamAnnouncementDto,
  type DeliveryReportDto,
  type InAppNotificationDto,
  type TeamPerformanceStatsDto,
} from './player-types'

interface SquadMember {
  id: string
  membershipId: string
  name: string
  playerCode: string | null
  role: string
  battingStyle: string | null
  bowlingStyle: string | null
  jerseyNumber: number | null
  designation: string
  avatarUrl: string | null
  isVerified: boolean
  joinedAt: string
}

interface TeamFixture {
  id: string
  format: string
  totalOvers: number
  venue: string | null
  status: string
  matchDate: string | null
  resultText: string | null
  winnerId: string | null
  isWon: boolean
  scorecardStatus: string
  opponent: {
    id: string
    name: string
    shortName: string
    color: string
    logoUrl?: string | null
  } | null
}

interface LineupData {
  id?: string
  matchId: string
  teamId: string
  playingXI: string[]
  substitutes: string[]
  notes: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  reviewNotes?: string | null
}

interface AvailabilityData {
  summary: {
    availableCount: number
    unavailableCount: number
    pendingCount: number
    totalSquad: number
  }
  roster: Array<{
    playerId: string
    name: string
    playerCode: string | null
    role: string
    avatarUrl: string | null
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'TENTATIVE' | 'PENDING'
    note: string | null
    updatedAt: string | null
  }>
}

type CaptainSubTab = 'team' | 'fixtures' | 'lineup' | 'availability' | 'performance' | 'announcements'

export function CaptainsCorner({
  activeCaptaincy,
  navigate,
}: {
  activeCaptaincy: EnrichedCaptaincyStatus
  navigate: (to: string) => void
}) {
  const [subTab, setSubTab] = useState<CaptainSubTab>('team')
  const [loading, setLoading] = useState(false)

  // Data state
  const [squad, setSquad] = useState<SquadMember[]>([])
  const [fixtures, setFixtures] = useState<TeamFixture[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [lineup, setLineup] = useState<LineupData | null>(null)
  const [selectedXI, setSelectedXI] = useState<string[]>([])
  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [lineupNotes, setLineupNotes] = useState<string>('')
  const [savingLineup, setSavingLineup] = useState(false)

  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const [performance, setPerformance] = useState<TeamPerformanceStatsDto | null>(null)

  const [announcements, setAnnouncements] = useState<TeamAnnouncementDto[]>([])
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPriority, setAnnPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL')
  const [annCategory, setAnnCategory] = useState<TeamAnnouncementDto['category']>('GENERAL')
  const [annEventDate, setAnnEventDate] = useState('')
  const [annEventTime, setAnnEventTime] = useState('')
  const [annLocation, setAnnLocation] = useState('')
  const [annAttachmentUrl, setAnnAttachmentUrl] = useState('')
  const [annStatusFilter, setAnnStatusFilter] = useState<'published' | 'archived'>('published')
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)
  const [postingAnn, setPostingAnn] = useState(false)

  // Delivery report modal
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState<DeliveryReportDto | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [selectedAnnForReport, setSelectedAnnForReport] = useState<TeamAnnouncementDto | null>(null)

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editPriority, setEditPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL')
  const [editCategory, setEditCategory] = useState<TeamAnnouncementDto['category']>('GENERAL')
  const [editEventDate, setEditEventDate] = useState('')
  const [editEventTime, setEditEventTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const team = activeCaptaincy.team
  const season = activeCaptaincy.season

  // Load squad & fixtures initially
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [squadData, fixturesData] = await Promise.all([
        api<SquadMember[]>('/api/captains/team-squad'),
        api<TeamFixture[]>('/api/captains/fixtures'),
      ])
      setSquad(squadData)
      setFixtures(fixturesData)

      const upcoming = fixturesData.find(
        (f) => f.status === 'SCHEDULED' || f.status === 'TOSS_DONE' || f.status === 'LIVE'
      )
      const targetMatchId = upcoming ? upcoming.id : fixturesData[0]?.id ?? ''
      setSelectedMatchId(targetMatchId)
    } catch (err: any) {
      if (err?.status === 401) {
        toast.error('Your captain session has expired. Please sign in again.')
        navigate('/login')
        return
      }
      toast.error(err?.message || "Failed to load Captain's Corner data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Load Lineup & Availability when selected match changes
  useEffect(() => {
    if (!selectedMatchId) return

    if (subTab === 'lineup') {
      api<LineupData | null>(`/api/captains/lineup/${selectedMatchId}`)
        .then((res) => {
          setLineup(res)
          if (res) {
            setSelectedXI(res.playingXI || [])
            setSelectedSubs(res.substitutes || [])
            setLineupNotes(res.notes || '')
          } else {
            setSelectedXI([])
            setSelectedSubs([])
            setLineupNotes('')
          }
        })
        .catch(() => {
          setSelectedXI([])
          setSelectedSubs([])
          setLineupNotes('')
        })
    }

    if (subTab === 'availability') {
      setLoadingAvailability(true)
      api<AvailabilityData>(`/api/captains/availability/${selectedMatchId}`)
        .then((res) => setAvailability(res))
        .catch((err) => toast.error(err?.message || 'Failed to load availability'))
        .finally(() => setLoadingAvailability(false))
    }
  }, [selectedMatchId, subTab])

  // Load Performance Stats
  useEffect(() => {
    if (subTab === 'performance' && !performance) {
      api<TeamPerformanceStatsDto>('/api/captains/performance')
        .then((res) => setPerformance(res))
        .catch((err) => toast.error(err?.message || 'Failed to load performance metrics'))
    }
  }, [subTab, performance])

  // Load Announcements
  const loadAnnouncements = useCallback(
    async (status: 'published' | 'archived' = annStatusFilter) => {
      try {
        const res = await api<TeamAnnouncementDto[]>(
          `/api/captains/announcements?status=${status}`
        )
        setAnnouncements(Array.isArray(res) ? res : [])
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load announcements')
      }
    },
    [annStatusFilter]
  )

  useEffect(() => {
    if (subTab === 'announcements') {
      loadAnnouncements(annStatusFilter)
    }
  }, [subTab, annStatusFilter, loadAnnouncements])

  // Lineup selection toggles
  function toggleXI(playerId: string) {
    if (lineup?.status === 'APPROVED') {
      toast.info('Lineup is already approved by admin and locked for editing')
      return
    }
    if (selectedXI.includes(playerId)) {
      setSelectedXI((prev) => prev.filter((id) => id !== playerId))
    } else {
      if (selectedXI.length >= 11) {
        toast.error('Playing XI cannot exceed 11 players')
        return
      }
      setSelectedSubs((prev) => prev.filter((id) => id !== playerId))
      setSelectedXI((prev) => [...prev, playerId])
    }
  }

  function toggleSub(playerId: string) {
    if (lineup?.status === 'APPROVED') {
      toast.info('Lineup is approved and locked')
      return
    }
    if (selectedSubs.includes(playerId)) {
      setSelectedSubs((prev) => prev.filter((id) => id !== playerId))
    } else {
      if (selectedSubs.length >= 5) {
        toast.error('Maximum 5 substitutes allowed')
        return
      }
      setSelectedXI((prev) => prev.filter((id) => id !== playerId))
      setSelectedSubs((prev) => [...prev, playerId])
    }
  }

  // Save / Submit Lineup
  async function handleSaveLineup(submit: boolean) {
    if (!selectedMatchId) return

    if (submit && selectedXI.length !== 11) {
      toast.error(`Playing XI must have exactly 11 players (currently ${selectedXI.length})`)
      return
    }

    setSavingLineup(true)
    try {
      const res = await api<LineupData>(`/api/captains/lineup/${selectedMatchId}`, {
        method: 'POST',
        json: {
          playingXI: selectedXI,
          substitutes: selectedSubs,
          notes: lineupNotes.trim() || undefined,
          submit,
        },
      })
      setLineup(res)
      toast.success(
        submit
          ? 'Suggested Playing XI submitted to tournament admin for review'
          : 'Lineup draft saved successfully'
      )
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save lineup')
    } finally {
      setSavingLineup(false)
    }
  }

  // Initiate Post Announcement (Opens Confirmation Modal)
  function handleInitiatePostAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!annTitle.trim()) {
      toast.error('Announcement Title is required')
      return
    }
    if (!annContent.trim()) {
      toast.error('Announcement Message / Content is required')
      return
    }
    setConfirmPublishOpen(true)
  }

  // Publish Announcement after Pre-publishing Confirmation
  async function handleConfirmAndPublish() {
    setPostingAnn(true)
    try {
      await api('/api/captains/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annContent.trim(),
          priority: annPriority,
          category: annCategory,
          eventDate: annEventDate ? annEventDate : null,
          eventTime: annEventTime ? annEventTime : null,
          location: annLocation.trim() || null,
          attachmentUrl: annAttachmentUrl.trim() || null,
        }),
      })
      toast.success('Announcement broadcast to team and queued for multi-channel delivery!')
      setAnnTitle('')
      setAnnContent('')
      setAnnEventDate('')
      setAnnEventTime('')
      setAnnLocation('')
      setAnnAttachmentUrl('')
      setAnnPriority('NORMAL')
      setAnnCategory('GENERAL')
      setConfirmPublishOpen(false)
      setAnnStatusFilter('published')
      loadAnnouncements('published')
    } catch (err: any) {
      if (err?.status === 401) {
        toast.error('Your captain session has expired. Please sign in to your captain account.')
      } else {
        toast.error(err?.message || 'Failed to publish announcement')
      }
    } finally {
      setPostingAnn(false)
    }
  }

  // Open Live Delivery Statistics
  async function handleOpenDeliveryReport(ann: TeamAnnouncementDto) {
    setSelectedAnnForReport(ann)
    setReportModalOpen(true)
    setLoadingReport(true)
    try {
      const res = await api<DeliveryReportDto>(
        `/api/captains/announcements/${ann.id}/delivery-report`
      )
      setReportData(res)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch delivery report')
    } finally {
      setLoadingReport(false)
    }
  }

  // Start Editing Announcement
  function handleStartEdit(ann: TeamAnnouncementDto) {
    setEditingAnnId(ann.id)
    setEditTitle(ann.title)
    setEditContent(ann.content)
    setEditPriority(ann.priority)
    setEditCategory(ann.category)
    setEditEventDate(ann.eventDate ? ann.eventDate.slice(0, 10) : '')
    setEditEventTime(ann.eventTime || '')
    setEditLocation(ann.location || '')
    setEditAttachmentUrl(ann.attachmentUrl || '')
    setEditModalOpen(true)
  }

  // Save Edited Announcement
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAnnId || !editTitle.trim() || !editContent.trim()) {
      toast.error('Title and Content are required')
      return
    }

    setSavingEdit(true)
    try {
      await api(`/api/captains/announcements/${editingAnnId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          priority: editPriority,
          category: editCategory,
          eventDate: editEventDate ? editEventDate : null,
          eventTime: editEventTime ? editEventTime : null,
          location: editLocation.trim() || null,
          attachmentUrl: editAttachmentUrl.trim() || null,
        }),
      })
      toast.success('Announcement updated')
      setEditModalOpen(false)
      setEditingAnnId(null)
      loadAnnouncements(annStatusFilter)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update announcement')
    } finally {
      setSavingEdit(false)
    }
  }

  // Archive Announcement
  async function handleArchiveAnnouncement(id: string) {
    try {
      await api(`/api/captains/announcements/${id}/archive`, { method: 'PATCH' })
      toast.success('Announcement moved to archive')
      loadAnnouncements(annStatusFilter)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to archive announcement')
    }
  }

  // Delete Announcement
  async function handleDeleteAnnouncement(id: string) {
    try {
      await api(`/api/captains/announcements/${id}`, { method: 'DELETE' })
      toast.success('Announcement removed')
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete announcement')
    }
  }

  const upcomingFixtures = fixtures.filter(
    (f) => f.status === 'SCHEDULED' || f.status === 'TOSS_DONE' || f.status === 'LIVE'
  )
  const completedFixtures = fixtures.filter(
    (f) => f.status === 'COMPLETED' || f.status === 'ABANDONED'
  )

  return (
    <div className="space-y-6">
      {/* Premium Navy Captain Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B1120] p-6 text-white shadow-md border border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(122,20,38,0.45)_0%,transparent_70%)]"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                Official Team Captain
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {season?.name} ({season?.year})
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              {team?.name ?? 'Assigned Team'}
            </h1>
            <p className="text-xs text-gray-300 max-w-xl">
              Welcome to your dedicated Captain&apos;s Corner. Manage squad readiness, prepare suggested
              match Playing XIs, check availability, track finalized team analytics, and communicate
              with teammates.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                Squad Size
              </div>
              <div className="text-xl font-extrabold text-white">{squad.length}</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                Fixtures
              </div>
              <div className="text-xl font-extrabold text-white">{fixtures.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white border border-gray-200 p-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('team')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'team'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>My Team Squad</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {squad.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('fixtures')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'fixtures'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Team Fixtures</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('lineup')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'lineup'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>Playing XI Management</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('availability')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'availability'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Player Availability</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('performance')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'performance'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Team Performance</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('announcements')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
            subTab === 'announcements'
              ? 'bg-[#7A1426] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Team Announcements</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MY TEAM SQUAD (READ-ONLY) */}
      {/* ========================================================================= */}
      {subTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#111827]">
              Registered Squad for {season?.name} ({squad.length} Players)
            </h2>
            <span className="text-[11px] text-gray-500">
              Read-only view • Click player name to open public career profile
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {squad.map((member) => (
              <Card
                key={member.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-xs"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7A1426]/10 text-[#7A1426] text-xs font-black">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={() => navigate(`/players/${member.id}`)}
                          className="text-left font-extrabold text-sm text-[#111827] hover:text-[#7A1426] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="truncate max-w-[150px]">{member.name}</span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </button>
                        <div className="text-[11px] text-gray-500">
                          {member.playerCode ? `${member.playerCode} • ` : ''}
                          {formatCricketLabel(member.role)}
                        </div>
                      </div>
                    </div>

                    {member.designation === 'CAPTAIN' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Crown className="h-3 w-3" /> Captain
                      </span>
                    ) : member.jerseyNumber ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                        #{member.jerseyNumber}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 border border-gray-100 p-2 text-center text-xs">
                    <div>
                      <div className="text-[9px] font-bold uppercase text-gray-400">Batting</div>
                      <div className="font-semibold text-gray-800 text-[11px] truncate">
                        {formatCricketLabel(member.battingStyle, '—')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase text-gray-400">Bowling</div>
                      <div className="font-semibold text-gray-800 text-[11px] truncate">
                        {formatCricketLabel(member.bowlingStyle, '—')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TEAM FIXTURES */}
      {/* ========================================================================= */}
      {subTab === 'fixtures' && (
        <div className="space-y-6">
          {/* Upcoming Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#7A1426]" />
              Upcoming Matches ({upcomingFixtures.length})
            </h2>

            {upcomingFixtures.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
                No upcoming matches scheduled currently for your team.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcomingFixtures.map((f) => (
                  <Card key={f.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {f.status}
                        </span>
                        <div className="font-extrabold text-sm text-[#111827]">
                          vs {f.opponent?.name ?? 'Opponent'}
                        </div>
                        <div className="text-xs text-gray-500">{fmtDateTime(f.matchDate)}</div>
                        <div className="text-[11px] text-gray-400">
                          {f.venue || 'Venue TBA'} • {f.format} ({f.totalOvers} Overs)
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMatchId(f.id)
                          setSubTab('lineup')
                        }}
                        className="rounded-xl text-xs font-bold text-[#7A1426] border-[#7A1426]/20 hover:bg-[#7A1426]/10 cursor-pointer"
                      >
                        Set Lineup
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Completed Matches ({completedFixtures.length})
            </h2>

            {completedFixtures.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
                No completed matches recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {completedFixtures.map((f) => (
                  <Card key={f.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            f.isWon
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {f.isWon ? 'WON' : 'LOST'}
                        </span>
                        <div className="font-extrabold text-sm text-[#111827]">
                          vs {f.opponent?.name ?? 'Opponent'}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {f.resultText || 'Result recorded'}
                        </div>
                        <div className="text-[11px] text-gray-400">{fmtDate(f.matchDate)}</div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/match/${f.id}`)}
                        className="rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        View Scorecard
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PLAYING XI MANAGEMENT */}
      {/* ========================================================================= */}
      {subTab === 'lineup' && (
        <div className="space-y-5">
          {/* Match selector bar */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-xs font-bold text-gray-700">Select Upcoming Match</Label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="mt-1 w-full sm:w-80 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                >
                  {fixtures.map((f) => (
                    <option key={f.id} value={f.id}>
                      vs {f.opponent?.name} ({fmtDate(f.matchDate)}) • {f.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status pill & feedback */}
              {lineup && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Submission Status:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      lineup.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : lineup.status === 'SUBMITTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : lineup.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {lineup.status}
                  </span>
                </div>
              )}
            </div>

            {lineup?.reviewNotes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                <strong>Tournament Director Notes:</strong> &ldquo;{lineup.reviewNotes}&rdquo;
              </div>
            )}
          </div>

          {/* Interactive Lineup Builder */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Squad Pool (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Registered Squad ({squad.length})
                </h3>
                <span className="text-[11px] text-gray-400">Tap to toggle XI or Subs</span>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {squad.map((player) => {
                  const inXI = selectedXI.includes(player.id)
                  const inSub = selectedSubs.includes(player.id)
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all ${
                        inXI
                          ? 'border-[#7A1426] bg-[#7A1426]/5 shadow-2xs'
                          : inSub
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                              inXI ? 'bg-[#7A1426] text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {player.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#111827] truncate">{player.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {formatCricketLabel(player.role)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleXI(player.id)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                            inXI
                              ? 'bg-[#7A1426] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {inXI ? 'In XI ✓' : '+ XI'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSub(player.id)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                            inSub
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {inSub ? 'Sub ✓' : '+ Sub'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Selected XI (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7A1426]">
                  Playing XI Lineup ({selectedXI.length} / 11 Players)
                </h3>
                <span className="text-[11px] text-gray-500">
                  {11 - selectedXI.length > 0
                    ? `Need ${11 - selectedXI.length} more`
                    : 'XI Complete'}
                </span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-2xs min-h-[300px]">
                {selectedXI.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No players selected for Playing XI yet. Tap &ldquo;+ XI&rdquo; from the squad list on the left.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedXI.map((id, index) => {
                      const p = squad.find((m) => m.id === id)
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 p-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7A1426]/10 text-[10px] font-bold text-[#7A1426]">
                              {index + 1}
                            </span>
                            {p?.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#111827] truncate">
                                {p?.name ?? id}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {formatCricketLabel(p?.role)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleXI(id)}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove from XI"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Substitutes row */}
                {selectedSubs.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                      Substitutes ({selectedSubs.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSubs.map((id) => {
                        const p = squad.find((m) => m.id === id)
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-800"
                          >
                            <span>{p?.name ?? id}</span>
                            <button
                              type="button"
                              onClick={() => toggleSub(id)}
                              className="text-blue-400 hover:text-rose-600 cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes field */}
              <div>
                <Label className="text-xs font-bold text-gray-700">
                  Notes for Tournament Director / Admin
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Standard balanced XI with 5 bowling options"
                  value={lineupNotes}
                  onChange={(e) => setLineupNotes(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleSaveLineup(false)}
                  disabled={savingLineup || lineup?.status === 'APPROVED'}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSaveLineup(true)}
                  disabled={
                    savingLineup ||
                    selectedXI.length !== 11 ||
                    lineup?.status === 'APPROVED'
                  }
                  className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {lineup?.status === 'SUBMITTED' ? 'Update & Re-Submit' : 'Submit for Admin Approval'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PLAYER AVAILABILITY */}
      {/* ========================================================================= */}
      {subTab === 'availability' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div>
              <Label className="text-xs font-bold text-gray-700">Select Upcoming Match</Label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="mt-1 w-full sm:w-80 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
              >
                {fixtures.map((f) => (
                  <option key={f.id} value={f.id}>
                    vs {f.opponent?.name} ({fmtDate(f.matchDate)}) • {f.status}
                  </option>
                ))}
              </select>
            </div>

            {availability && (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xs font-black text-emerald-600">
                    {availability.summary.availableCount}
                  </div>
                  <div className="text-[10px] text-gray-400">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-rose-600">
                    {availability.summary.unavailableCount}
                  </div>
                  <div className="text-[10px] text-gray-400">Unavailable</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-amber-600">
                    {availability.summary.pendingCount}
                  </div>
                  <div className="text-[10px] text-gray-400">Pending</div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
            {loadingAvailability ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading availability...</div>
            ) : !availability || availability.roster.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No availability recorded for this match yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Availability Status</th>
                      <th className="py-3 px-4">Player Notes</th>
                      <th className="py-3 px-4 text-right">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {availability.roster.map((p) => (
                      <tr key={p.playerId} className="hover:bg-gray-50/60">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7A1426]/10 text-[#7A1426] text-[10px] font-black shrink-0">
                                {p.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#111827]">{p.name}</div>
                              <div className="text-[10px] text-gray-400">{p.playerCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatCricketLabel(p.role)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              p.status === 'AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'UNAVAILABLE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                p.status === 'AVAILABLE'
                                  ? 'bg-emerald-500'
                                  : p.status === 'UNAVAILABLE'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                              }`}
                            />
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 italic">{p.note || '—'}</td>
                        <td className="py-3 px-4 text-right text-gray-400">
                          {p.updatedAt ? fmtDate(p.updatedAt) : 'Pending'}
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

      {/* ========================================================================= */}
      {/* SUB-TAB 5: TEAM PERFORMANCE ANALYTICS */}
      {/* ========================================================================= */}
      {subTab === 'performance' && (
        <div className="space-y-4">
          {!performance ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading team metrics...</div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Matches Played</div>
                  <div className="mt-1 text-2xl font-black text-[#111827]">
                    {performance.matchesPlayed}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {performance.matchesWon}W • {performance.matchesLost}L
                  </div>
                </Card>

                <Card className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Win Rate</div>
                  <div className="mt-1 text-2xl font-black text-emerald-600">
                    {performance.winPercentage}%
                  </div>
                  <div className="text-[11px] text-gray-500">Official tournament matches</div>
                </Card>

                <Card className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Total Runs Scored</div>
                  <div className="mt-1 text-2xl font-black text-[#7A1426]">
                    {performance.totalRunsScored}
                  </div>
                  <div className="text-[11px] text-gray-500">From verified scorecards</div>
                </Card>

                <Card className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Total Wickets Taken</div>
                  <div className="mt-1 text-2xl font-black text-blue-600">
                    {performance.totalWicketsTaken}
                  </div>
                  <div className="text-[11px] text-gray-500">Bowling attack total</div>
                </Card>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-400">
                    Highest Team Innings
                  </div>
                  <div className="text-lg font-black text-[#111827]">
                    {performance.highestTeamScore
                      ? `${performance.highestTeamScore.runs} runs`
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {performance.highestTeamScore?.opponentName
                      ? `vs ${performance.highestTeamScore.opponentName}`
                      : 'No finalized matches'}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Top Run Scorer</div>
                  <div className="text-lg font-black text-[#7A1426]">
                    {performance.topRunScorer
                      ? `${performance.topRunScorer.runs} runs`
                      : '—'}
                  </div>
                  <div className="text-xs font-semibold text-gray-700 truncate">
                    {performance.topRunScorer?.playerName || '—'}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-400">Top Wicket Taker</div>
                  <div className="text-lg font-black text-blue-600">
                    {performance.topWicketTaker
                      ? `${performance.topWicketTaker.wickets} wkts`
                      : '—'}
                  </div>
                  <div className="text-xs font-semibold text-gray-700 truncate">
                    {performance.topWicketTaker?.playerName || '—'}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: TEAM ANNOUNCEMENTS */}
      {/* ========================================================================= */}
      {subTab === 'announcements' && (
        <div className="space-y-6">
          {/* Create Announcement Form */}
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7A1426] mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Post Team Announcement
            </h3>

            <form onSubmit={handleInitiatePostAnnouncement} className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold text-gray-700">Subject / Title *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Practice session on Friday 5 PM at Main Oval"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700">Category</Label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                  >
                    <option value="GENERAL">General Announcement</option>
                    <option value="PRACTICE">Practice Schedule</option>
                    <option value="MATCH_REMINDER">Match Reminder</option>
                    <option value="MEETING">Team Meeting</option>
                    <option value="UPDATE">Important Update</option>
                    <option value="TOURNAMENT">Tournament Information</option>
                    <option value="EMERGENCY">Emergency Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Message Content *</Label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details, timings, dress code, tactics, or strategy notes..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                />
              </div>

              {/* Event Date, Time, Location & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-700">Event Date (Optional)</Label>
                  <Input
                    type="date"
                    value={annEventDate}
                    onChange={(e) => setAnnEventDate(e.target.value)}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700">Event Time (Optional)</Label>
                  <Input
                    type="time"
                    value={annEventTime}
                    onChange={(e) => setAnnEventTime(e.target.value)}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700">Location (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Oval Ground / Net 2"
                    value={annLocation}
                    onChange={(e) => setAnnLocation(e.target.value)}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700">Priority</Label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Broadcast</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Attachment / Media URL (Optional)</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/schedule.pdf or image link"
                  value={annAttachmentUrl}
                  onChange={(e) => setAnnAttachmentUrl(e.target.value)}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[11px] text-gray-500">
                  Target Squad: <strong>{squad.length} registered players</strong> in {team?.name || 'team'}.
                </span>

                <Button
                  type="submit"
                  disabled={postingAnn || !annTitle.trim() || !annContent.trim()}
                  className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  <span>Review & Broadcast</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* List of announcements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  Team Announcements ({announcements.length})
                </h3>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAnnStatusFilter('published')
                    loadAnnouncements('published')
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer',
                    annStatusFilter === 'published'
                      ? 'bg-white text-[#7A1426] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnnStatusFilter('archived')
                    loadAnnouncements('archived')
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer',
                    annStatusFilter === 'archived'
                      ? 'bg-white text-[#7A1426] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Archived
                </button>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                {annStatusFilter === 'published'
                  ? 'No published announcements found. Use the composer above to share updates with your squad.'
                  : 'No archived announcements.'}
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <Card
                    key={ann.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.priority === 'URGENT' && (
                          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            URGENT
                          </span>
                        )}
                        {ann.priority === 'IMPORTANT' && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                            IMPORTANT
                          </span>
                        )}
                        <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                          {ann.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {fmtDate(ann.publishedAt || ann.createdAt)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDeliveryReport(ann)}
                          className="h-7 px-2 text-[11px] font-bold border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>Delivery Stats</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(ann)}
                          className="h-7 px-2 text-[11px] font-bold border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>

                        {ann.status !== 'archived' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveAnnouncement(ann.id)}
                            className="h-7 px-2 text-[11px] font-bold border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-1"
                            title="Move to archive"
                          >
                            <Archive className="w-3 h-3" />
                            <span>Archive</span>
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 cursor-pointer rounded-lg hover:bg-rose-50"
                          title="Delete announcement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#111827]">{ann.title}</h4>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>

                    {(ann.eventDate || ann.location) && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        {ann.eventDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#7A1426]" />
                            <strong>Date:</strong> {new Date(ann.eventDate).toLocaleDateString()}{' '}
                            {ann.eventTime ? `at ${ann.eventTime}` : ''}
                          </span>
                        )}
                        {ann.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <strong>Location:</strong> {ann.location}
                          </span>
                        )}
                      </div>
                    )}

                    {ann.attachmentUrl && (
                      <div>
                        <a
                          href={ann.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1426] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Attachment Link</span>
                        </a>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PRE-PUBLISHING CONFIRMATION MODAL */}
          {/* ========================================================================= */}
          {confirmPublishOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in-50">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#7A1426]" />
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Confirm Announcement Broadcast
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmPublishOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Recipient verification banner */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 uppercase">
                        Target Squad Verification
                      </span>
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-black text-amber-900 text-[10px]">
                        Strict Privacy Guaranteed
                      </span>
                    </div>
                    <div className="text-gray-800">
                      <strong>Team:</strong> {team?.name} ({team?.shortName}) &bull;{' '}
                      <strong>Season:</strong> {season?.name}
                    </div>
                    <div className="text-amber-950 font-semibold">
                      Eligible Squad Recipients:{' '}
                      <strong className="text-amber-900 text-sm">{squad.length} Players</strong>
                    </div>
                    <p className="text-[11px] text-amber-800/90 pt-1 border-t border-amber-200/60">
                      This announcement will only be delivered to players registered in your {team?.name} squad. It is never broadcast to any other team.
                    </p>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-[#7A1426] text-white px-2 py-0.5 text-[10px] font-black uppercase">
                        {annPriority}
                      </span>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                        {annCategory.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-[#111827]">{annTitle}</div>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                      {annContent}
                    </div>
                    {(annEventDate || annLocation) && (
                      <div className="pt-2 text-[11px] text-gray-600 border-t border-gray-200 flex flex-wrap gap-3">
                        {annEventDate && (
                          <span>
                            Date: <strong>{annEventDate}</strong> {annEventTime || ''}
                          </span>
                        )}
                        {annLocation && (
                          <span>
                            Location: <strong>{annLocation}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500 leading-relaxed">
                    Upon confirmation, notifications will immediately be created in-app and dispatched to eligible squad players via Resend email and Web Push notifications.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmPublishOpen(false)}
                    className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    disabled={postingAnn}
                    onClick={handleConfirmAndPublish}
                    className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {postingAnn ? 'Publishing...' : 'Confirm & Broadcast Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LIVE NOTIFICATION DELIVERY REPORT MODAL */}
          {/* ========================================================================= */}
          {reportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in-50">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Notification Delivery Statistics
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {loadingReport ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    <RefreshCcw className="w-6 h-6 mx-auto animate-spin text-[#7A1426] mb-2" />
                    <span>Aggregating delivery statistics...</span>
                  </div>
                ) : !reportData ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    Delivery data unavailable for this announcement.
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Announcement Context */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 space-y-1">
                      <div className="font-extrabold text-sm text-[#111827]">
                        {reportData.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {reportData.teamName} &bull; {reportData.seasonName} &bull; Published{' '}
                        {fmtDate(reportData.publishedAt)}
                      </div>
                    </div>

                    {/* Channel Delivery Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* In-App Notifications */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-extrabold uppercase">
                          <Megaphone className="w-3.5 h-3.5 text-[#7A1426]" />
                          <span>In-Website</span>
                        </div>
                        <div className="text-xl font-black text-[#111827]">
                          {reportData.inAppCreatedCount}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          {reportData.inAppReadCount} read by players
                        </div>
                      </div>

                      {/* Resend Email Delivery */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-extrabold uppercase">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Resend Email</span>
                        </div>
                        <div className="text-xl font-black text-[#111827]">
                          {reportData.emailJobsSent}/{reportData.emailJobsQueued}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {reportData.emailJobsFailed > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {reportData.emailJobsFailed} failed
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">
                              {reportData.emailJobsSent > 0 ? 'Delivered' : 'Pending'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Web Push API */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-extrabold uppercase">
                          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                          <span>Web Push</span>
                        </div>
                        <div className="text-xl font-black text-[#111827]">
                          {reportData.pushSent}/{reportData.pushAttempts}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {reportData.pushFailed > 0 ? (
                            <span className="text-rose-600 font-bold">
                              {reportData.pushFailed} failed/expired
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Delivered</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 flex items-center justify-between text-xs">
                      <span className="text-blue-950 font-bold">Total Eligible Squad Members:</span>
                      <strong className="text-blue-950 text-sm font-black">
                        {reportData.eligibleRecipientsCount} Players
                      </strong>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    Close Report
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* EDIT ANNOUNCEMENT MODAL */}
          {/* ========================================================================= */}
          {editModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in-50">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-[#7A1426]" />
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Edit Team Announcement
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold text-gray-700">Subject / Title</Label>
                    <Input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-700">Category</Label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                      >
                        <option value="GENERAL">General Announcement</option>
                        <option value="PRACTICE">Practice Schedule</option>
                        <option value="MATCH_REMINDER">Match Reminder</option>
                        <option value="MEETING">Team Meeting</option>
                        <option value="UPDATE">Important Update</option>
                        <option value="TOURNAMENT">Tournament Information</option>
                        <option value="EMERGENCY">Emergency Notice</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-gray-700">Priority</Label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                      >
                        <option value="NORMAL">Normal Priority</option>
                        <option value="IMPORTANT">Important</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-gray-700">Message Content</Label>
                    <textarea
                      rows={3}
                      required
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <Label className="text-xs font-bold text-gray-700">Event Date</Label>
                      <Input
                        type="date"
                        value={editEventDate}
                        onChange={(e) => setEditEventDate(e.target.value)}
                        className="rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-700">Event Time</Label>
                      <Input
                        type="time"
                        value={editEventTime}
                        onChange={(e) => setEditEventTime(e.target.value)}
                        className="rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-700">Location</Label>
                      <Input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-gray-700">Attachment / Media URL</Label>
                    <Input
                      type="url"
                      value={editAttachmentUrl}
                      onChange={(e) => setEditAttachmentUrl(e.target.value)}
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditModalOpen(false)}
                      className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingEdit}
                      className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
