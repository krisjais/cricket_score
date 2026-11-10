'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { CricketBatIcon } from '@/components/cricket/cricket-graphics'
import { FORMAT_LABEL, type MatchSummary } from '@/lib/client'
import { Trophy, ArrowRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MatchCard({ match, navigate }: { match: MatchSummary; navigate: (to: string) => void }) {
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED' || match.status === 'INNINGS_BREAK'
  const done = match.status === 'COMPLETED'
  const batting = match.scores.find((s) => s.number === match.currentInnings)

  const teamRow = (
    team: MatchSummary['teamA'],
    other: MatchSummary['teamB'],
    align: 'left' | 'right'
  ) => {
    const score = match.scores.filter((s) => s.battingTeamId === team.id)
    const isWinner = done && match.winnerId === team.id
    const isBatting = isLive && batting?.battingTeamId === team.id

    return (
      <div className={cn('flex flex-1 items-center gap-3', align === 'right' && 'flex-row-reverse text-right')}>
        <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-sm flex items-center gap-1.5', align === 'right' && 'justify-end', isWinner ? 'font-black text-[#0d3a24]' : 'font-bold text-[#111827]')}>
            {isWinner && align === 'left' && <Trophy className="w-3.5 h-3.5 text-[#c59b27] shrink-0" />}
            <span className="font-serif font-bold text-sm text-[#111827]">{team.name}</span>
            {isBatting && (
              <span className="inline-flex items-center gap-1 bg-[#0d3a24]/10 text-[#0d3a24] border border-[#0d3a24]/20 px-1.5 py-0.2 rounded text-[10px] font-bold">
                <CricketBatIcon size={10} />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              </span>
            )}
            {isWinner && align === 'right' && <Trophy className="w-3.5 h-3.5 text-[#c59b27] shrink-0" />}
          </div>

          <div className="flex gap-2 text-xs mt-0.5" style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
            {score.length === 0 && <span className="text-[#9ca3af] text-xs font-normal italic">Yet to bat</span>}
            {score.map((s) => (
              <span
                key={s.number}
                className={cn(
                  'font-mono font-black tabular-nums text-sm',
                  isLive && s.number === match.currentInnings ? 'text-[#0d3a24]' : 'text-[#374151]'
                )}
              >
                {s.runs}/{s.wickets}
                <span className="ml-1 text-[11px] font-normal text-[#6b7280]">({s.overs} ov)</span>
              </span>
            ))}
          </div>
        </div>
        <span className="sr-only">{`versus ${other.name}`}</span>
      </div>
    )
  }

  const resultLine = () => {
    if (match.status === 'COMPLETED' && match.resultText) {
      const winnerShort = match.winnerId
        ? match.winnerId === match.teamA.id
          ? match.teamA.shortName
          : match.teamB.shortName
        : null
      return (
        <div className="bg-[#f4efe6] border-t border-[#e8e2d5] px-4 py-2.5 text-xs font-bold text-[#0d3a24] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#c59b27] shrink-0" />
            <span>{winnerShort ? `${winnerShort} won — ` : ''}{match.resultText}</span>
          </span>
          <span className="text-[11px] text-[#c59b27] font-semibold group-hover:translate-x-0.5 transition-transform">
            Scorecard →
          </span>
        </div>
      )
    }
    if (match.status === 'ABANDONED') {
      return (
        <div className="bg-[#faf8f5] border-t border-[#e8e2d5] px-4 py-2 text-xs font-medium text-[#6b7280]">
          Match abandoned
        </div>
      )
    }
    if (isLive) {
      return (
        <div className="bg-emerald-50/80 border-t border-emerald-100 px-4 py-2.5 text-xs font-semibold text-emerald-950 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Live Coverage Active</span>
          </span>
          <span className="text-xs font-bold text-[#0d3a24] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Watch Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )
    }
    if (match.tossWinnerId && match.tossDecision) {
      const tossTeam = match.tossWinnerId === match.teamA.id ? match.teamA : match.teamB
      const batFirst = match.battingFirstId === match.teamA.id ? match.teamA : match.teamB
      return (
        <div className="bg-[#faf8f5] border-t border-[#e8e2d5] px-4 py-2.5 text-xs text-[#6b7280]">
          {tossTeam.shortName} won toss & chose to {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}
        </div>
      )
    }
    return (
      <div className="bg-[#faf8f5] border-t border-[#e8e2d5] px-4 py-2.5 text-xs text-[#6b7280] flex items-center justify-between">
        <span>{match.venue || 'Tournament Ground'}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Scheduled</span>
      </div>
    )
  }

  const meta = () => {
    const bits: string[] = [FORMAT_LABEL[match.format] ?? match.format]
    if (match.format === 'CUSTOM') bits.push(`${match.totalOvers} ov`)
    if (match.venue) bits.push(match.venue)
    return bits.join(' • ')
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      className={cn(
        'group cursor-pointer rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden focus-visible:ring-2 focus-visible:ring-[#0d3a24] focus-visible:outline-none',
        isLive
          ? 'border-emerald-500/50 hover:border-emerald-600 ring-1 ring-emerald-500/10'
          : 'border-[#e8e2d5] hover:border-[#c59b27]'
      )}
      onClick={() => navigate(`/match/${match.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/match/${match.id}`)
        }
      }}
    >
      <CardContent className="p-0">
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-bold tracking-wider text-[#6b7280] uppercase">
              {meta()}
            </span>
            <StatusBadge status={match.status} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {teamRow(match.teamA, match.teamB, 'left')}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#f4efe6] text-[10px] font-serif font-black text-[#6b7280] border border-[#e8e2d5] shadow-2xs">
              VS
            </div>
            {teamRow(match.teamB, match.teamA, 'right')}
          </div>
        </div>

        {resultLine()}
      </CardContent>
    </Card>
  )
}
