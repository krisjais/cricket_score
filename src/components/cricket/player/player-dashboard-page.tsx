'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Copy,
  KeyRound,
  LogOut,
  Save,
  Search,
  Share2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client'
import { AplLogo } from '@/components/cricket/apl-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CareerStatsGrid,
  MatchHistorySection,
  PlayerOverviewHero,
  SeasonAndTeamHistorySection,
} from './player-career-widgets'
import { PlayerDashboardData, PlayerPrivacy } from './player-types'

type DashTab = 'overview' | 'matches' | 'seasons' | 'graphs' | 'profile' | 'claim'

interface ClaimCandidate {
  id: string
  playerCode: string | null
  name: string
  role: string
  team: { id: string; name: string; shortName: string } | null
  matches: number
  runs: number
  wickets: number
}

export function PlayerDashboardPage({
  navigate,
  onAuthChanged,
}: {
  navigate: (to: string) => void
  onAuthChanged: () => Promise<void>
}) {
  const [data, setData] = useState<PlayerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauth, setUnauth] = useState(false)
  const [tab, setTab] = useState<DashTab>('overview')

  // Profile form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('ALL_ROUNDER')
  const [battingStyle, setBattingStyle] = useState('')
  const [bowlingStyle, setBowlingStyle] = useState('')
  const [dob, setDob] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [privacy, setPrivacy] = useState<PlayerPrivacy>({
    showDob: false,
    showCity: true,
    showBio: true,
    showSeasonHistory: true,
    isPublic: true,
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Claim state
  const [claimQuery, setClaimQuery] = useState('')
  const [candidates, setCandidates] = useState<ClaimCandidate[]>([])
  const [searchingCandidates, setSearchingCandidates] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<ClaimCandidate | null>(null)
  const [claimOtpDev, setClaimOtpDev] = useState<string | null>(null)
  const [claimOtpSent, setClaimOtpSent] = useState(false)
  const [claimOtpCode, setClaimOtpCode] = useState('')
  const [claimNotes, setClaimNotes] = useState('')
  const [submittingClaim, setSubmittingClaim] = useState(false)

  const applyDashboardData = useCallback((res: PlayerDashboardData) => {
    setData(res)
    const p = res.player
    setName(p.name || '')
    setRole(p.role || 'ALL_ROUNDER')
    setBattingStyle(p.battingStyle || '')
    setBowlingStyle(p.bowlingStyle || '')
    setDob(p.dob ? String(p.dob).slice(0, 10) : '')
    setCity(p.city || '')
    setBio(p.bio || '')
    setAvatarUrl(p.avatarUrl || '')
    setPrivacy(
      p.privacy ?? {
        showDob: false,
        showCity: true,
        showBio: true,
        showSeasonHistory: true,
        isPublic: true,
      }
    )
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setUnauth(false)
    try {
      const res = await api<PlayerDashboardData>('/api/player-auth/dashboard')
      applyDashboardData(res)
    } catch {
      setUnauth(true)
    } finally {
      setLoading(false)
    }
  }, [applyDashboardData])

  useEffect(() => {
    let alive = true
    api<PlayerDashboardData>('/api/player-auth/dashboard')
      .then((res) => {
        if (!alive) return
        setUnauth(false)
        applyDashboardData(res)
      })
      .catch(() => {
        if (alive) setUnauth(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [applyDashboardData])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api('/api/player-auth/profile', {
        method: 'PATCH',
        json: {
          name: name.trim(),
          role,
          battingStyle: battingStyle || null,
          bowlingStyle: bowlingStyle || null,
          dob: dob || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          privacy,
        },
      })
      await Promise.all([loadDashboard(), onAuthChanged()])
      toast.success('Profile & privacy settings updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleLogout() {
    await api('/api/player-auth/logout', { method: 'POST' }).catch(() => undefined)
    await onAuthChanged()
    toast.success('Signed out')
    navigate('/player/login')
  }

  async function handleSearchClaims(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSearchingCandidates(true)
    try {
      const res = await api<ClaimCandidate[]>(
        `/api/player-auth/claim-candidates?q=${encodeURIComponent(claimQuery.trim())}`
      )
      setCandidates(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearchingCandidates(false)
    }
  }

  async function handleSendClaimOtp() {
    if (!data?.user.email && !data?.user.mobile) return
    const channel = data.user.email ? 'EMAIL' : 'MOBILE'
    const target = (data.user.email ?? data.user.mobile)!
    try {
      const res = await api<{ maskedTarget: string; deliveryProvider?: string; devOtp?: string }>('/api/player-auth/otp/send', {
        method: 'POST',
        json: { channel, target, purpose: 'CLAIM_PROFILE' },
      })
      setClaimOtpSent(true)
      setClaimOtpDev(res.devOtp ?? null)
      toast.success(
        res.deliveryProvider === 'resend'
          ? `Verification OTP emailed to ${res.maskedTarget}`
          : `Verification OTP sent to ${res.maskedTarget}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send claim OTP')
    }
  }

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCandidate || !data) return
    setSubmittingClaim(true)
    try {
      const method = data.user.email ? 'OTP_EMAIL' : 'OTP_MOBILE'
      await api('/api/player-auth/claims', {
        method: 'POST',
        json: {
          targetPlayerId: selectedCandidate.id,
          verificationMethod: method,
          otpCode: claimOtpCode.trim(),
          evidenceNotes: claimNotes.trim() || null,
        },
      })
      toast.success('Claim request submitted for Admin approval')
      setSelectedCandidate(null)
      setClaimOtpCode('')
      setClaimOtpSent(false)
      setClaimNotes('')
      await loadDashboard()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Claim submission failed')
    } finally {
      setSubmittingClaim(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-3xl bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (unauth || !data) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs">
        <div className="flex justify-center mb-4">
          <AplLogo size="lg" />
        </div>
        <h1 className="text-xl font-extrabold text-[#111827]">Player Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1.5 mb-5">
          Sign in with your verified player account or register to generate your permanent Player ID.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => navigate('/player/login')}
            className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold cursor-pointer"
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/player/register')}
            className="rounded-xl border-[#E5E7EB] font-bold cursor-pointer"
          >
            Register New Player
          </Button>
        </div>
      </Card>
    )
  }

  const publicSlug = data.player.playerCode || data.player.id
  const copyShareUrl = () => {
    const url = `${window.location.origin}/players/${publicSlug}`
    void navigator.clipboard?.writeText(url)
    toast.success(`Public profile link copied: /players/${publicSlug}`)
  }

  const tabs: Array<{ key: DashTab; label: string }> = [
    { key: 'overview', label: 'Career Overview' },
    { key: 'matches', label: `Matches (${data.matchHistory.length})` },
    { key: 'seasons', label: 'Seasons & Teams' },
    { key: 'graphs', label: 'Performance Graphs' },
    { key: 'profile', label: 'Edit Profile & Privacy' },
    { key: 'claim', label: 'Claim Old Records' },
  ]

  return (
    <div className="space-y-6">
      <PlayerOverviewHero
        player={data.player}
        career={data.career}
        currentMembership={data.currentMembership}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/players/${publicSlug}`)}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Public Profile
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={copyShareUrl}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy ID Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleLogout}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        }
      />

      {/* Dashboard Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white border border-[#E5E7EB] p-1.5 shadow-2xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-[#7A1426] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-[#F3F4F6] hover:text-[#111827]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <CareerStatsGrid career={data.career} />}

      {tab === 'matches' && <MatchHistorySection matches={data.matchHistory} navigate={navigate} />}

      {tab === 'seasons' && (
        <SeasonAndTeamHistorySection career={data.career} memberships={data.memberships} />
      )}

      {tab === 'graphs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.performanceSeries.length === 0 ? (
            <Card className="lg:col-span-2 rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center text-xs text-gray-500">
              Performance trend charts appear once you have at least one verified match scorecard.
            </Card>
          ) : (
            <>
              <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-[#111827]">Runs Scored Per Match</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.performanceSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="runs" fill="#7A1426" radius={[6, 6, 0, 0]} name="Runs" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-[#111827]">Wickets Per Match</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.performanceSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="wickets" fill="#121826" radius={[6, 6, 0, 0]} name="Wickets" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-[#111827]">Batting Average Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.performanceSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cumulativeAverage"
                        stroke="#7A1426"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        name="Batting Avg"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold text-[#111827]">Strike Rate Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.performanceSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cumulativeStrikeRate"
                        stroke="#121826"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        name="Strike Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-[#111827]">
              Personal Cricket Profile &amp; Public Visibility
            </CardTitle>
            <CardDescription className="text-xs">
              Update your playing profile and choose what appears publicly. Official match statistics and permanent Player ID ({data.player.playerCode}) cannot be edited manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="prof-name" className="text-xs font-bold text-[#111827]">Full Name</label>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="prof-role" className="text-xs font-bold text-[#111827]">Playing Role</label>
                  <select
                    id="prof-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  >
                    <option value="BATTER">Batsman</option>
                    <option value="BOWLER">Bowler</option>
                    <option value="ALL_ROUNDER">All-Rounder</option>
                    <option value="WICKETKEEPER">Wicketkeeper</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="prof-bat" className="text-xs font-bold text-[#111827]">Batting Style</label>
                  <select
                    id="prof-bat"
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  >
                    <option value="">Not specified</option>
                    <option value="RIGHT_HAND">Right-hand bat</option>
                    <option value="LEFT_HAND">Left-hand bat</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="prof-bowl" className="text-xs font-bold text-[#111827]">Bowling Style</label>
                  <select
                    id="prof-bowl"
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  >
                    <option value="">Not specified</option>
                    <option value="RIGHT_ARM_FAST">Right-arm fast</option>
                    <option value="RIGHT_ARM_MEDIUM">Right-arm medium</option>
                    <option value="RIGHT_ARM_OFF_SPIN">Right-arm off spin</option>
                    <option value="RIGHT_ARM_LEG_SPIN">Right-arm leg spin</option>
                    <option value="LEFT_ARM_FAST">Left-arm fast</option>
                    <option value="LEFT_ARM_MEDIUM">Left-arm medium</option>
                    <option value="LEFT_ARM_ORTHODOX">Left-arm orthodox</option>
                    <option value="LEFT_ARM_CHINAMAN">Left-arm chinaman</option>
                    <option value="NONE">Does not bowl</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="prof-dob" className="text-xs font-bold text-[#111827]">Date of Birth</label>
                  <input
                    id="prof-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="prof-city" className="text-xs font-bold text-[#111827]">City</label>
                  <input
                    id="prof-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="prof-avatar" className="text-xs font-bold text-[#111827]">Profile Photo URL</label>
                  <input
                    id="prof-avatar"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="prof-bio" className="text-xs font-bold text-[#111827]">Player Bio</label>
                  <textarea
                    id="prof-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-sm text-[#111827] focus:border-[#7A1426] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#7A1426]">
                  Public Profile Privacy Controls
                </div>
                <p className="text-[11px] text-gray-500">
                  Email, mobile number, and authentication data are always private and never displayed publicly.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  {(
                    [
                      ['isPublic', 'Enable public player profile page (/players/:playerId)'],
                      ['showCity', 'Show city on public profile'],
                      ['showDob', 'Show date of birth on public profile'],
                      ['showBio', 'Show bio on public profile'],
                      ['showSeasonHistory', 'Show season & team history publicly'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy[key]}
                        onChange={(e) => setPrivacy((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded text-[#7A1426] h-4 w-4"
                      />
                      <span className="font-semibold text-[#111827]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savingProfile ? 'Saving...' : 'Save Personal Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'claim' && (
        <div className="space-y-5">
          <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#7A1426]" />
                Claim Unregistered Match Records
              </CardTitle>
              <CardDescription className="text-xs">
                Played a match before creating your account? Search for your temporary unclaimed profile below and submit an OTP-verified claim. Once approved by an Admin, those verified statistics merge into your permanent Player ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearchClaims} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={claimQuery}
                  onChange={(e) => setClaimQuery(e.target.value)}
                  placeholder="Search unclaimed name or temporary PLR ID..."
                  className="flex-1 min-w-[220px] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-xs text-[#111827] focus:border-[#7A1426] focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={searchingCandidates}
                  className="rounded-xl bg-[#121826] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  {searchingCandidates ? 'Searching...' : 'Find Records'}
                </Button>
              </form>

              {candidates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidates.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 ${
                        selectedCandidate?.id === c.id
                          ? 'border-[#7A1426] bg-[#7A1426]/5'
                          : 'border-[#E5E7EB] bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#111827] truncate">{c.name}</div>
                        <div className="text-[11px] font-mono text-gray-500">{c.playerCode ?? c.id}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          {c.team?.name ?? 'Free Agent'} • {c.matches} mat · {c.runs} runs · {c.wickets} wkts
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(c)
                          setClaimOtpSent(false)
                          setClaimOtpCode('')
                        }}
                        className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedCandidate && (
                <form
                  onSubmit={handleSubmitClaim}
                  className="rounded-2xl border border-[#7A1426]/30 bg-[#F9FAFB] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#7A1426] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Claiming: {selectedCandidate.name} ({selectedCandidate.playerCode})
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSendClaimOtp}
                      className="rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1" /> Send Claim OTP
                    </Button>
                  </div>

                  {claimOtpDev && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Claim OTP Preview (dev): <strong className="font-mono">{claimOtpDev}</strong>
                    </div>
                  )}

                  {claimOtpSent && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="claim-otp" className="block text-xs font-bold text-[#111827]">
                          6-Digit Claim Verification Code
                        </label>
                        <p id="claim-otp-hint" className="text-[11px] text-gray-500">
                          Enter the single 6-digit code sent to your verified account contact.
                        </p>
                        <input
                          id="claim-otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          aria-describedby="claim-otp-hint"
                          required
                          value={claimOtpCode}
                          onChange={(e) => setClaimOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="mt-1 w-40 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-center font-mono text-base font-bold tracking-[0.25em]"
                        />
                      </div>
                      <div>
                        <label htmlFor="claim-notes" className="block text-xs font-bold text-[#111827]">
                          Evidence / Match Note (optional)
                        </label>
                        <input
                          id="claim-notes"
                          type="text"
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          placeholder="e.g. Played for Mavericks in Season 2026"
                          className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submittingClaim || claimOtpCode.length < 6}
                        className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
                      >
                        {submittingClaim ? 'Submitting...' : 'Submit Claim for Admin Review'}
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {data.claims.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold text-[#111827]">Your Claim Requests</div>
                  <div className="space-y-1.5">
                    {data.claims.map((cl) => (
                      <div
                        key={cl.id}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-gray-600">Target: {cl.targetPlayerId}</span>
                        <span className="font-bold text-[#7A1426]">{cl.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
