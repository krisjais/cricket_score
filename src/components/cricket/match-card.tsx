'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, TeamLogo } from '@/components/cricket/ui-bits'
import { FORMAT_LABEL, type MatchSummary } from '@/lib/client'
import { Trophy, ArrowRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MatchCard({ match, navigate }: { match: MatchSummary; navigate: (to: string) => void }) {
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED' || match.status === 'INNINGS_BREAK'
  const done = match.status === 'COMPLETED'
  const batting = match.scores.find((s) => s.number === match.currentInnings)

  const isWinnerA = done && match.winnerId === match.teamA.id
  const isWinnerB = done && match.winnerId === match.teamB.id
  const isBattingA = isLive && batting?.battingTeamId === match.teamA.id
  const isBattingB = isLive && batting?.battingTeamId === match.teamB.id
  const scoreA = match.scores.filter((s) => s.battingTeamId === match.teamA.id)
  const scoreB = match.scores.filter((s) => s.battingTeamId === match.teamB.id)

  const teamRow = (
    team: MatchSummary['teamA'],
    other: MatchSummary['teamB'],
    align: 'left' | 'right'
  ) => {
    const score = match.scores.filter((s) => s.battingTeamId === team.id)
    const isWinner = done && match.winnerId === team.id
    const isBatting = isLive && batting?.battingTeamId === team.id

    return (
      <div className={cn('flex flex-1 min-w-0 items-center gap-2.5', align === 'right' && 'flex-row-reverse text-right')}>
        <div className="shrink-0">
          <TeamLogo name={team.name} shortName={team.shortName} color={team.color} logoUrl={team.logoUrl} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-sm flex items-center gap-1.5', align === 'right' && 'justify-end', isWinner ? 'font-extrabold text-[#7A1426]' : 'font-bold text-[#111827]')}>
            {isWinner && align === 'left' && <Trophy className="w-3.5 h-3.5 text-[#7A1426] shrink-0" />}
            <span className="truncate font-bold text-sm text-[#111827]">{team.name}</span>
            {isBatting && (
              <span className="inline-flex items-center gap-1 bg-[#7A1426]/10 text-[#7A1426] border border-[#7A1426]/20 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                BAT
              </span>
            )}
            {isWinner && align === 'right' && <Trophy className="w-3.5 h-3.5 text-[#7A1426] shrink-0" />}
          </div>

          <div className="flex gap-2 text-xs mt-0.5" style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
            {score.length === 0 && <span className="text-gray-400 text-xs italic">Yet to bat</span>}
            {score.map((s) => (
              <span
                key={s.number}
                className={cn(
                  'font-mono font-bold tabular-nums text-sm',
                  isLive && s.number === match.currentInnings ? 'text-[#7A1426]' : 'text-gray-700'
                )}
              >
                {s.runs}/{s.wickets}
                <span className="ml-1 text-[11px] font-normal text-gray-500">({s.overs} ov)</span>
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
      return (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs font-semibold text-[#111827] flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <Trophy className="w-3.5 h-3.5 text-[#7A1426] shrink-0" />
            <span className="truncate">{match.resultText}</span>
          </span>
          <span className="text-[11px] text-[#7A1426] font-bold shrink-0 group-hover:translate-x-0.5 transition-transform">
            Scorecard &rarr;
          </span>
        </div>
      )
    }
    if (match.status === 'ABANDONED') {
      return (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs font-medium text-gray-500">
          Match abandoned
        </div>
      )
    }
    if (isLive) {
      return (
        <div className="bg-[#7A1426]/[0.04] border-t border-[#7A1426]/15 px-4 py-2.5 text-xs font-semibold text-[#7A1426] flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span className="truncate">Live Coverage Active</span>
          </span>
          <span className="text-xs font-bold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>Watch Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )
    }
    if (match.tossWinnerId && match.tossDecision) {
      const tossTeam = match.tossWinnerId === match.teamA.id ? match.teamA : match.teamB
      return (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-600 truncate">
          {tossTeam.shortName} won toss &amp; chose to {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}
        </div>
      )
    }
    return (
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500 flex items-center justify-between gap-2">
        <span className="truncate">{match.venue || 'Turf 01'}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Scheduled</span>
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
        'group cursor-pointer rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden focus-visible:ring-2 focus-visible:ring-[#7A1426] focus-visible:outline-none',
        isLive ? 'border-[#7A1426]/35 hover:border-[#7A1426]' : 'border-gray-200 hover:border-gray-300'
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
            <span className="truncate text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              {meta()}
            </span>
            <StatusBadge status={match.status} />
          </div>

          {/* Mobile Phone View: Stacked Team Rows (Zero Overflow, Full Readability) */}
          <div className="sm:hidden space-y-2.5 pt-1">
            {/* Team A */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="shrink-0">
                  <TeamLogo name={match.teamA.name} shortName={match.teamA.shortName} color={match.teamA.color} logoUrl={match.teamA.logoUrl} size="sm" />
                </div>
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className={cn('truncate text-sm font-bold', isWinnerA ? 'font-extrabold text-[#7A1426]' : 'text-[#111827]')}>
                    {match.teamA.name}
                  </span>
                  {isWinnerA && <Trophy className="w-3.5 h-3.5 text-[#7A1426] shrink-0" />}
                  {isBattingA && (
                    <span className="inline-flex items-center gap-1 bg-[#7A1426]/10 text-[#7A1426] border border-[#7A1426]/20 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                      BAT
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {scoreA.length === 0 ? (
                  <span className="text-gray-400 text-xs italic">Yet to bat</span>
                ) : (
                  scoreA.map((s) => (
                    <span
                      key={s.number}
                      className={cn(
                        'font-mono font-bold tabular-nums text-sm',
                        isLive && s.number === match.currentInnings ? 'text-[#7A1426]' : 'text-gray-800'
                      )}
                    >
                      {s.runs}/{s.wickets}
                      <span className="ml-1 text-[11px] font-normal text-gray-500">({s.overs} ov)</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Team B */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="shrink-0">
                  <TeamLogo name={match.teamB.name} shortName={match.teamB.shortName} color={match.teamB.color} logoUrl={match.teamB.logoUrl} size="sm" />
                </div>
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className={cn('truncate text-sm font-bold', isWinnerB ? 'font-extrabold text-[#7A1426]' : 'text-[#111827]')}>
                    {match.teamB.name}
                  </span>
                  {isWinnerB && <Trophy className="w-3.5 h-3.5 text-[#7A1426] shrink-0" />}
                  {isBattingB && (
                    <span className="inline-flex items-center gap-1 bg-[#7A1426]/10 text-[#7A1426] border border-[#7A1426]/20 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                      BAT
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {scoreB.length === 0 ? (
                  <span className="text-gray-400 text-xs italic">Yet to bat</span>
                ) : (
                  scoreB.map((s) => (
                    <span
                      key={s.number}
                      className={cn(
                        'font-mono font-bold tabular-nums text-sm',
                        isLive && s.number === match.currentInnings ? 'text-[#7A1426]' : 'text-gray-800'
                      )}
                    >
                      {s.runs}/{s.wickets}
                      <span className="ml-1 text-[11px] font-normal text-gray-500">({s.overs} ov)</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Desktop/Tablet View: Side-by-Side Teams with VS separator */}
          <div className="hidden sm:flex items-center justify-between gap-3 pt-1">
            {teamRow(match.teamA, match.teamB, 'left')}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 border border-gray-200">
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
