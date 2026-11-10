/**
 * Match state interfaces and types for client-side rendering.
 */
import type { InningsStats } from './cricket'

export interface TeamLite {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
}

export interface InningsScoreLine {
  number: number
  battingTeamId: string
  runs: number
  wickets: number
  overs: string
  declared: boolean
}

export interface BowlerOption {
  id: string
  name: string
  overs: string
  runs: number
  wickets: number
  maxOvers: number
  blocked: boolean
  blockedReason: string | null
}

export interface LiveView {
  inningsNumber: number
  battingTeamId: string
  bowlingTeamId: string
  strikerId: string | null
  nonStrikerId: string | null
  bowlerId: string | null
  needsNewBatsman: 'STRIKER' | 'NON_STRIKER' | null
  overComplete: boolean
  lastOverBowlerId: string | null
  currentRunRate: number
  requiredRunRate: number | null
  target: number | null
  ballsRemaining: number | null
  yetToBat: { id: string; name: string; jerseyNumber: number | null; role: string }[]
  bowlers: BowlerOption[]
  thisOver: { label: string; kind: string; runs: number }[]
  squadSizes: { batting: number; bowling: number }
  maxWickets: number
}

export interface MatchSummary {
  id: string
  format: string
  totalOvers: number
  venue: string | null
  status: string
  currentInnings: number
  tossWinnerId: string | null
  tossDecision: string | null
  battingFirstId: string | null
  target: number | null
  resultText: string | null
  winnerId: string | null
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  teamA: TeamLite
  teamB: TeamLite
  scores: InningsScoreLine[]
  liveTeamId: string | null
}

export interface MatchStatePayload {
  match: MatchSummary
  innings: InningsStats[]
  live: LiveView | null
}

export function teamLite(t: { id: string; name: string; shortName: string; color: string }): TeamLite {
  return { id: t.id, name: t.name, shortName: t.shortName, color: t.color }
}
