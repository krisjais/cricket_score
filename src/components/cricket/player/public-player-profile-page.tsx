'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Award, Lock, Share2 } from 'lucide-react'
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
import { PublicPlayerProfileData, fmtDate } from './player-types'

export function PublicPlayerProfilePage({
  playerIdOrCode,
  navigate,
}: {
  playerIdOrCode: string
  navigate: (to: string) => void
}) {
  const [profile, setProfile] = useState<PublicPlayerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [section, setSection] = useState<'stats' | 'seasons' | 'matches'>('stats')

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
        <p className="text-xs text-gray-500 mt-1 mb-4">{errorMsg ?? 'No matching player record exists.'}</p>
        <Button onClick={() => navigate('/leaderboards')} variant="outline" className="rounded-xl text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Browse Leaderboards
        </Button>
      </Card>
    )
  }

  if (profile.isPrivate) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xs">
        <div className="flex justify-center mb-3">
          <AplLogo size="md" />
        </div>
        <Lock className="mx-auto w-7 h-7 text-[#7A1426] mb-3" />
        <h1 className="text-lg font-extrabold text-[#111827]">{profile.player.name}</h1>
        {profile.player.playerCode && (
          <div className="mt-1 inline-block rounded-full bg-[#F3F4F6] px-3 py-0.5 font-mono text-xs font-bold text-[#7A1426]">
            {profile.player.playerCode}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          This player has set their public profile visibility to private.
        </p>
      </Card>
    )
  }

  const slug = profile.player.playerCode || profile.player.id

  return (
    <div className="space-y-6">
      <PlayerOverviewHero
        player={profile.player}
        career={profile.career}
        currentMembership={profile.currentMembership}
        rightSlot={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const url = `${window.location.origin}/players/${slug}`
              void navigator.clipboard?.writeText(url)
              toast.success('Profile link copied')
            }}
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Profile
          </Button>
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

      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white border border-[#E5E7EB] p-1.5 shadow-2xs">
        {(
          [
            ['stats', 'Career Statistics'],
            ['seasons', 'Season & Team History'],
            ['matches', `Recent Performances (${profile.recentMatches?.length ?? 0})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSection(k)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              section === k ? 'bg-[#7A1426] text-white' : 'text-gray-600 hover:bg-[#F3F4F6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'stats' && <CareerStatsGrid career={profile.career} />}
      {section === 'seasons' && (
        <SeasonAndTeamHistorySection career={profile.career} memberships={profile.memberships ?? []} />
      )}
      {section === 'matches' && (
        <MatchHistorySection matches={profile.recentMatches ?? []} navigate={navigate} />
      )}
    </div>
  )
}

