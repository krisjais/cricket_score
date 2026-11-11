export interface CareerBreakdownRow {
  key: string
  seasonId?: string | null
  seasonName?: string | null
  year?: number | null
  teamId?: string | null
  teamName?: string | null
  teamShortName?: string | null
  tournamentId?: string | null
  tournamentName?: string | null
  matches: number
  inningsBatted: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  highestScore: number
  highestScoreNotOut: boolean
  notOuts: number
  battingAverage: number | null
  strikeRate: number
  fifties: number
  hundreds: number
  inningsBowled: number
  legalBalls: number
  overs: string
  runsConceded: number
  wickets: number
  maidens: number
  bowlingAverage: number | null
  economy: number
  bowlingStrikeRate: number | null
  bestBowlingWickets: number
  bestBowlingRuns: number
  bestBowlingDisplay: string
  catches: number
  runOuts: number
  stumpings: number
  playerOfMatchAwards: number
}

export interface PlayerCareerStatDto {
  playerId: string
  matches: number
  inningsBatted: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  highestScore: number
  highestScoreNotOut: boolean
  notOuts: number
  battingAverage: number | null
  strikeRate: number
  fifties: number
  hundreds: number
  inningsBowled: number
  legalBallsBowled: number
  oversBowled: string
  runsConceded: number
  wickets: number
  maidens: number
  bowlingAverage: number | null
  economy: number
  bowlingStrikeRate: number | null
  bestBowlingWickets: number
  bestBowlingRuns: number
  bestBowlingDisplay: string
  catches: number
  runOuts: number
  stumpings: number
  playerOfMatchAwards: number
  seasonsCount: number
  teamsCount: number
  tournamentsCount: number
  seasonBreakdown: CareerBreakdownRow[]
  teamBreakdown: CareerBreakdownRow[]
  tournamentBreakdown: CareerBreakdownRow[]
}

export interface TeamMembershipDto {
  id: string
  playerId: string
  teamId: string
  seasonId: string
  joinedAt: string
  status: 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED' | 'RELEASED'
  designation: 'PLAYER' | 'CAPTAIN' | 'VICE_CAPTAIN' | 'WICKETKEEPER'
  jerseyNumber: number | null
  season: { id: string; name: string; code: string; year: number; status: string } | null
  team: { id: string; name: string; shortName: string; color: string; logoUrl: string | null } | null
}

export interface PlayerMatchHistoryRow {
  id: string
  matchId: string
  matchDate: string
  result: 'WON' | 'LOST' | 'TIED' | 'NO_RESULT'
  matchResultText: string | null
  isPlayerOfMatch: boolean
  format?: string
  venue?: string | null
  batting: {
    innings: number
    runs: number
    balls: number
    fours: number
    sixes: number
    notOut: boolean
    retiredHurt?: boolean
    retiredOut?: boolean
    absent?: boolean
    dismissalText: string | null
  }
  bowling: {
    innings: number
    legalBalls: number
    overs: string
    runsConceded: number
    wickets: number
    maidens: number
    economy: number
  }
  fielding: {
    catches: number
    runOuts: number
    stumpings: number
  }
  team: { id: string; name: string; shortName: string; color: string } | null
  opponent: { id: string; name: string; shortName: string; color: string } | null
  season: { id: string; name: string; year: number } | null
  tournament: { id: string; name: string; shortName: string } | null
}

export interface PlayerPrivacy {
  showDob: boolean
  showCity: boolean
  showBio: boolean
  showSeasonHistory: boolean
  isPublic: boolean
}

export interface PlayerProfileDto {
  id: string
  playerCode: string | null
  name: string
  role: string
  gender?: 'MALE' | 'FEMALE'
  jerseyNumber: number | null
  avatarUrl: string | null
  dob?: string | null
  battingStyle?: string | null
  bowlingStyle?: string | null
  city?: string | null
  bio?: string | null
  isClaimed?: boolean
  isVerified?: boolean
  status?: 'ACTIVE' | 'SUSPENDED' | 'MERGED'
  privacy?: PlayerPrivacy
}

export interface PlayerDashboardData {
  user: {
    id: string
    name: string
    email: string | null
    mobile: string | null
    emailVerified: boolean
    mobileVerified: boolean
    playerId: string | null
  }
  player: PlayerProfileDto
  currentMembership: TeamMembershipDto | null
  memberships: TeamMembershipDto[]
  career: PlayerCareerStatDto | null
  matchHistory: PlayerMatchHistoryRow[]
  performanceSeries: Array<{
    matchIndex: number
    matchId: string
    label: string
    date: string
    runs: number
    balls: number
    wickets: number
    runsConceded: number
    cumulativeAverage: number
    cumulativeStrikeRate: number
  }>
  awards: Array<{
    id: string
    title: string
    awardType: string
    scope: string
    awardedAt: string
    matchId?: string | null
  }>
  claims: Array<{
    id: string
    targetPlayerId: string
    status: string
    createdAt: string
  }>
}

export interface PublicPlayerProfileData {
  isPrivate: boolean
  player: PlayerProfileDto
  currentMembership?: TeamMembershipDto | null
  memberships?: TeamMembershipDto[]
  career?: PlayerCareerStatDto | null
  recentMatches?: PlayerMatchHistoryRow[]
  awards?: Array<{ id: string; title: string; awardType: string; awardedAt: string; matchId?: string | null }>
}

export interface SeasonDto {
  id: string
  name: string
  code: string
  year: number
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  isDefault: boolean
}

export interface TournamentDto {
  id: string
  name: string
  shortName: string
  seasonId: string
  season?: SeasonDto | null
  format: string
  status: string
}

const LABELS: Record<string, string> = {
  BATTER: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WICKETKEEPER: 'Wicketkeeper',
  RIGHT_HAND: 'Right-hand bat',
  LEFT_HAND: 'Left-hand bat',
  RIGHT_ARM_FAST: 'Right-arm fast',
  RIGHT_ARM_MEDIUM: 'Right-arm medium',
  RIGHT_ARM_OFF_SPIN: 'Right-arm off spin',
  RIGHT_ARM_LEG_SPIN: 'Right-arm leg spin',
  LEFT_ARM_FAST: 'Left-arm fast',
  LEFT_ARM_MEDIUM: 'Left-arm medium',
  LEFT_ARM_ORTHODOX: 'Left-arm orthodox',
  LEFT_ARM_CHINAMAN: 'Left-arm chinaman',
  NONE: 'Does not bowl',
}

export function formatCricketLabel(code?: string | null, fallback = '—'): string {
  if (!code) return fallback
  return LABELS[code] ?? code.replace(/_/g, ' ')
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

