'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client'
import { AplLogo } from '@/components/cricket/apl-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerAvatarField } from './player-avatar-field'
import {
  CareerStatsGrid,
  MatchHistorySection,
  PlayerDashboardSkeleton,
  PlayerOverviewHero,
  SeasonAndTeamHistorySection,
} from './player-career-widgets'
import {
  PerformanceOverviewSection,
  PersonalBestsSection,
  RecentAchievementsSection,
  RecentFormSection,
  RecentMatchHistorySection,
  UpcomingMatchesSection,
} from './player-overview-sections'
import { PlayerTabs, getPlayerPanelId, getPlayerTabId, type PlayerTabItem } from './player-tabs'
import { PlayerDashboardData, formatCricketLabel } from './player-types'

type DashTab = 'overview' | 'matches' | 'seasons' | 'graphs' | 'profile'

const VALID_DASH_TABS: readonly DashTab[] = ['overview', 'matches', 'seasons', 'graphs', 'profile']

function resolveDashTab(raw?: string | null): DashTab {
  if (raw && (VALID_DASH_TABS as readonly string[]).includes(raw)) {
    return raw as DashTab
  }
  return 'overview'
}

const PROFILE_INPUT_CLASS =
  'w-full min-h-11 rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2 text-base sm:text-sm text-[#111827] placeholder:text-gray-400 shadow-2xs transition-colors focus:border-[#7A1426] focus:ring-2 focus:ring-[#7A1426]/15 focus:outline-none'

const PROFILE_SELECT_CLASS = `${PROFILE_INPUT_CLASS} appearance-none pr-10 cursor-pointer`

export function PlayerDashboardPage({
  initialTab,
  navigate,
  onAuthChanged,
}: {
  initialTab?: string | null
  navigate: (to: string) => void
  onAuthChanged: () => Promise<void>
}) {
  const [data, setData] = useState<PlayerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauth, setUnauth] = useState(false)
  const tab = resolveDashTab(initialTab)

  // Profile form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('ALL_ROUNDER')
  const [battingStyle, setBattingStyle] = useState('')
  const [bowlingStyle, setBowlingStyle] = useState('')
  const [dob, setDob] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const applyDashboardData = useCallback((res: PlayerDashboardData) => {
    setData(res)
    const p = res.player
    setName(p.name || '')
    setRole(p.role || 'ALL_ROUNDER')
    setBattingStyle(p.battingStyle || '')
    setBowlingStyle(p.bowlingStyle || '')
    setDob(p.dob ? String(p.dob).slice(0, 10) : '')
    setAvatarUrl(p.avatarUrl || '')
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

  const switchTab = useCallback(
    (next: DashTab) => {
      navigate(next === 'overview' ? '/player/dashboard' : `/player/dashboard?tab=${next}`)
    },
    [navigate]
  )

  const isProfileDirty = useMemo(() => {
    if (!data) return false
    const p = data.player
    const origDob = p.dob ? String(p.dob).slice(0, 10) : ''
    return (
      name !== (p.name || '') ||
      role !== (p.role || 'ALL_ROUNDER') ||
      battingStyle !== (p.battingStyle || '') ||
      bowlingStyle !== (p.bowlingStyle || '') ||
      dob !== origDob ||
      avatarUrl !== (p.avatarUrl || '')
    )
  }, [data, name, role, battingStyle, bowlingStyle, dob, avatarUrl])

  function resetProfileForm() {
    if (!data) return
    applyDashboardData(data)
    toast.info('Reverted unsaved profile changes')
  }

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
          city: null,
          avatarUrl: avatarUrl.trim() || null,
          privacy: {
            showDob: true,
            showCity: true,
            showBio: true,
            showSeasonHistory: true,
            isPublic: true,
          },
        },
      })
      await Promise.all([loadDashboard(), onAuthChanged()])
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return <PlayerDashboardSkeleton />
  }

  if (unauth || !data) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs">
        <div className="flex justify-center mb-4">
          <AplLogo size="lg" />
        </div>
        <h1 className="text-xl font-extrabold text-[#111827]">Player Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1.5 mb-5">
          Sign in with your verified player account or register to view and manage your career profile.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => navigate('/login')}
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
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="rounded-xl text-gray-600 font-semibold cursor-pointer"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    )
  }

  const publicSlug = data.player.id

  const tabs: ReadonlyArray<PlayerTabItem<DashTab>> = [
    { key: 'overview', label: 'Career Overview' },
    {
      key: 'matches',
      label: 'My Matches',
      badge: data.matchHistory.length > 0 ? data.matchHistory.length : undefined,
    },
    { key: 'seasons', label: 'Seasons & Teams' },
    { key: 'graphs', label: 'Performance Graphs' },
    { key: 'profile', label: 'Edit Profile' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end text-xs">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          Personal Career Hub
        </span>
      </div>

      <PlayerOverviewHero
        player={data.player}
        career={data.career}
        currentMembership={data.currentMembership}
        compact={tab !== 'overview' || (data.career?.matches ?? 0) === 0}
        rightSlot={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/players/${publicSlug}`)}
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Public Profile
          </Button>
        }
      />

      <PlayerTabs
        idPrefix="dash"
        ariaLabel="Player dashboard sections"
        tabs={tabs}
        activeKey={tab}
        onSelect={switchTab}
      />

      {tab === 'overview' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('dash', 'overview')}
          aria-labelledby={getPlayerTabId('dash', 'overview')}
          className="space-y-6"
        >
          <CareerStatsGrid career={data.career} />
          <RecentFormSection
            matches={data.matchHistory}
            onOpenMatch={(matchId) => navigate(`/match/${matchId}`)}
          />
          <PersonalBestsSection
            bests={data.personalBests}
            onOpenMatch={(matchId) => navigate(`/match/${matchId}`)}
          />
          <RecentAchievementsSection achievements={data.achievements ?? []} />
          <PerformanceOverviewSection
            performanceSeries={data.performanceSeries}
            seasonPerformance={data.seasonPerformance ?? []}
          />
          <UpcomingMatchesSection
            upcomingMatches={data.upcomingMatches ?? []}
            onOpenMatch={(matchId) => navigate(`/match/${matchId}`)}
          />
          <RecentMatchHistorySection
            matches={data.matchHistory}
            onViewAll={() => switchTab('matches')}
            onOpenMatch={(matchId) => navigate(`/match/${matchId}`)}
          />
        </div>
      )}

      {tab === 'matches' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('dash', 'matches')}
          aria-labelledby={getPlayerTabId('dash', 'matches')}
        >
          <MatchHistorySection matches={data.matchHistory} navigate={navigate} />
        </div>
      )}

      {tab === 'seasons' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('dash', 'seasons')}
          aria-labelledby={getPlayerTabId('dash', 'seasons')}
        >
          <SeasonAndTeamHistorySection career={data.career} memberships={data.memberships} />
        </div>
      )}

      {tab === 'graphs' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('dash', 'graphs')}
          aria-labelledby={getPlayerTabId('dash', 'graphs')}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
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
        <div
          role="tabpanel"
          id={getPlayerPanelId('dash', 'profile')}
          aria-labelledby={getPlayerTabId('dash', 'profile')}
        >
          <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xs">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-extrabold text-[#111827]">
                      Edit Profile
                    </CardTitle>
                    {isProfileDirty ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        Unsaved changes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        Up to date
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Update your photo and cricket profile shown on tournament scorecards, leaderboards, and your public card.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isProfileDirty && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={savingProfile}
                      onClick={resetProfileForm}
                      className="min-h-10 rounded-lg border-gray-300 text-xs font-bold px-3 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      Reset
                    </Button>
                  )}
                  <Button
                    type="submit"
                    form="player-profile-form"
                    size="sm"
                    disabled={savingProfile || !isProfileDirty}
                    className="min-h-10 rounded-lg bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              <form id="player-profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Photo, Live Preview & Account Info */}
                  <div className="lg:col-span-5 space-y-5">
                    <fieldset className="rounded-xl border border-gray-200 bg-[#F9FAFB]/70 p-4 space-y-4">
                      <legend className="px-1 text-xs font-extrabold uppercase tracking-wider text-[#7A1426]">
                        Photo &amp; Public Card Preview
                      </legend>

                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                        {avatarUrl.trim() ? (
                          <img
                            src={avatarUrl.trim()}
                            alt={name || 'Profile preview'}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#7A1426] text-white text-sm font-black flex items-center justify-center shrink-0">
                            {(name.trim() || 'PL').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#111827] truncate">
                            {name.trim() || 'Your Name'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {formatCricketLabel(role)}
                          </p>
                        </div>
                      </div>

                      <PlayerAvatarField
                        id="prof-avatar"
                        label="Profile Photo (optional)"
                        value={avatarUrl}
                        onChange={setAvatarUrl}
                        layout="stacked"
                        showPreviewEmpty={false}
                        playerName={name}
                        inputClassName={PROFILE_INPUT_CLASS}
                      />
                    </fieldset>

                    {(data.user.email || data.user.mobile) && (
                      <div className="rounded-xl border border-gray-200 bg-[#F9FAFB]/70 p-4 space-y-2">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                          Private Account Contact
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-700">
                          {data.user.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[#7A1426] shrink-0" aria-hidden="true" />
                              <span className="font-semibold truncate">{data.user.email}</span>
                            </div>
                          )}
                          {data.user.mobile && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#7A1426] shrink-0" aria-hidden="true" />
                              <span className="font-semibold">{data.user.mobile}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Used only for sign-in &amp; verification. Never shown on public profiles.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Playing Identity & Bio */}
                  <div className="lg:col-span-7 space-y-5">
                    <fieldset className="rounded-xl border border-gray-200 bg-[#F9FAFB]/50 p-4 sm:p-5 space-y-4">
                      <legend className="px-1 text-xs font-extrabold uppercase tracking-wider text-[#7A1426]">
                        Playing Identity
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="prof-name" className="block text-xs font-bold text-[#111827]">
                            Full Name
                          </label>
                          <input
                            id="prof-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            minLength={2}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={PROFILE_INPUT_CLASS}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="prof-role" className="block text-xs font-bold text-[#111827]">
                            Playing Role
                          </label>
                          <div className="relative">
                            <select
                              id="prof-role"
                              name="role"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className={PROFILE_SELECT_CLASS}
                            >
                              <option value="BATTER">Batsman</option>
                              <option value="BOWLER">Bowler</option>
                              <option value="ALL_ROUNDER">All-Rounder</option>
                              <option value="WICKETKEEPER">Wicketkeeper</option>
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                              aria-hidden="true"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="prof-dob" className="block text-xs font-bold text-[#111827]">
                            Date of Birth
                          </label>
                          <input
                            id="prof-dob"
                            name="dob"
                            type="date"
                            autoComplete="bday"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className={PROFILE_INPUT_CLASS}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="prof-bat" className="block text-xs font-bold text-[#111827]">
                            Batting Style
                          </label>
                          <div className="relative">
                            <select
                              id="prof-bat"
                              name="battingStyle"
                              value={battingStyle}
                              onChange={(e) => setBattingStyle(e.target.value)}
                              className={PROFILE_SELECT_CLASS}
                            >
                              <option value="">Not specified</option>
                              <option value="RIGHT_HAND">Right-hand bat</option>
                              <option value="LEFT_HAND">Left-hand bat</option>
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                              aria-hidden="true"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="prof-bowl" className="block text-xs font-bold text-[#111827]">
                            Bowling Style
                          </label>
                          <div className="relative">
                            <select
                              id="prof-bowl"
                              name="bowlingStyle"
                              value={bowlingStyle}
                              onChange={(e) => setBowlingStyle(e.target.value)}
                              className={PROFILE_SELECT_CLASS}
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
                            <ChevronDown
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
