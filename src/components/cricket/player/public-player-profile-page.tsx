'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Award, BarChart3, CalendarDays, Home, Lock, Settings, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client'
import { AplLogo } from '@/components/cricket/apl-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CareerStatsGrid,
  MatchHistorySection,
  PlayerOverviewHero,
  SeasonAndTeamHistorySection,
} from './player-career-widgets'
import { PlayerTabs, getPlayerPanelId, getPlayerTabId, type PlayerTabItem } from './player-tabs'
import { PublicPlayerProfileData, fmtDate } from './player-types'

type PublicSection = 'stats' | 'seasons' | 'matches'

export function PublicPlayerProfilePage({
  playerIdOrCode,
  isOwnProfile = false,
  hasPlayerSession = false,
  navigate,
}: {
  playerIdOrCode: string
  isOwnProfile?: boolean
  hasPlayerSession?: boolean
  navigate: (to: string) => void
}) {
  const [profile, setProfile] = useState<PublicPlayerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [section, setSection] = useState<PublicSection>('stats')

  useEffect(() => {
    let alive = true
    api<PublicPlayerProfileData>(`/api/players/public/${encodeURIComponent(playerIdOrCode)}`)
      .then((res) => {
        if (!alive) return
        setProfile(res)
        setErrorMsg(null)
      })
      .catch((err) => {
        if (!alive) return
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load player profile')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [playerIdOrCode])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-3xl bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (errorMsg || !profile) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs">
        <div className="flex justify-center mb-4">
          <AplLogo size="lg" />
        </div>
        <h1 className="text-lg font-extrabold text-[#111827]">Player Profile Not Found</h1>
        <p className="text-xs text-gray-500 mt-1 mb-5">{errorMsg ?? 'No matching player record exists.'}</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {hasPlayerSession ? (
            <>
              <Button onClick={() => navigate('/matches')} variant="outline" className="rounded-xl text-xs font-bold cursor-pointer">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Tournament Matches
              </Button>
              <Button onClick={() => navigate('/player/dashboard')} className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer">
                My Career Hub
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/leaderboards')} variant="outline" className="rounded-xl text-xs font-bold cursor-pointer">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Browse Leaderboards
              </Button>
              <Button onClick={() => navigate('/')} className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer">
                <Home className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Back to Home
              </Button>
            </>
          )}
        </div>
      </Card>
    )
  }

  if (profile.isPrivate) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs">
        <div className="flex justify-center mb-3">
          <AplLogo size="md" />
        </div>
        <Lock className="mx-auto w-7 h-7 text-[#7A1426] mb-3" aria-hidden="true" />
        <h1 className="text-lg font-extrabold text-[#111827]">{profile.player.name}</h1>
        <p className="text-xs text-gray-500 mt-3 mb-5">
          This player has set their public profile visibility to private.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {isOwnProfile && (
            <Button
              onClick={() => navigate('/player/dashboard?tab=profile')}
              className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Update Privacy Settings
            </Button>
          )}
          <Button onClick={() => navigate('/leaderboards')} variant="outline" className="rounded-xl text-xs font-bold cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Leaderboards
          </Button>
        </div>
      </Card>
    )
  }

  const slug = profile.player.id
  const recentCount = profile.recentMatches?.length ?? 0
  const tabs: ReadonlyArray<PlayerTabItem<PublicSection>> = [
    { key: 'stats', label: 'Career Statistics' },
    { key: 'seasons', label: 'Season & Team History' },
    {
      key: 'matches',
      label: 'Recent Performances',
      badge: recentCount > 0 ? recentCount : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {hasPlayerSession ? (
            <button
              type="button"
              onClick={() => navigate('/matches')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer shadow-2xs"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#7A1426]" aria-hidden="true" />
              Tournament Matches
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/leaderboards')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#7A1426]" aria-hidden="true" />
                Leaderboards
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold text-gray-600 hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                Home
              </button>
            </>
          )}
        </div>
        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => navigate('/player/dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] px-3 py-1.5 font-bold text-white transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Open My Career Hub
          </button>
        ) : hasPlayerSession ? (
          <button
            type="button"
            onClick={() => navigate('/player/dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold text-[#7A1426] hover:bg-[#7A1426]/5 transition-colors cursor-pointer"
          >
            My Career Hub
          </button>
        ) : null}
      </div>

      <PlayerOverviewHero
        player={profile.player}
        career={profile.career}
        currentMembership={profile.currentMembership}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            {isOwnProfile && (
              <Button
                type="button"
                size="sm"
                onClick={() => navigate('/player/dashboard?tab=profile')}
                className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Edit My Profile
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                const url = `${window.location.origin}/#/players/${slug}`
                void navigator.clipboard?.writeText(url)
                toast.success('Profile link copied')
              }}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Share Profile
            </Button>
          </div>
        }
      />

      {profile.awards && profile.awards.length > 0 && (
        <Card className="rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-extrabold text-[#7A1426] flex items-center gap-2">
              <Award className="w-4 h-4" /> Achievements &amp; Honors
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.awards.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900"
              >
                🏆 {a.title} • {fmtDate(a.awardedAt)}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <PlayerTabs
        idPrefix="pub"
        ariaLabel="Player career sections"
        tabs={tabs}
        activeKey={section}
        onSelect={setSection}
      />

      {section === 'stats' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('pub', 'stats')}
          aria-labelledby={getPlayerTabId('pub', 'stats')}
        >
          <CareerStatsGrid career={profile.career} />
        </div>
      )}
      {section === 'seasons' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('pub', 'seasons')}
          aria-labelledby={getPlayerTabId('pub', 'seasons')}
        >
          <SeasonAndTeamHistorySection career={profile.career} memberships={profile.memberships ?? []} />
        </div>
      )}
      {section === 'matches' && (
        <div
          role="tabpanel"
          id={getPlayerPanelId('pub', 'matches')}
          aria-labelledby={getPlayerTabId('pub', 'matches')}
        >
          <MatchHistorySection matches={profile.recentMatches ?? []} navigate={navigate} />
        </div>
      )}
    </div>
  )
}

