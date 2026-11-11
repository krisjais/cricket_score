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
    strikeRate?: number
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
  team: { id: string; name: string; shortName: string; color: string; logoUrl?: string | null } | null
  opponent: { id: string; name: string; shortName: string; color: string; logoUrl?: string | null } | null
  season: { id: string; name: string; year: number } | null
  tournament: { id: string; name: string; shortName: string } | null
}

export interface TeamSummaryDto {
  id: string
  name: string
  shortName: string
  color: string
  logoUrl?: string | null
}

export interface PersonalBestMatchRefDto {
  matchId: string
  opponentName: string | null
  opponentShortName: string | null
  matchDate: string
}

export interface PersonalBestsDto {
  highestScore: (PersonalBestMatchRefDto & {
    runs: number
    balls: number
    notOut: boolean
    strikeRate: number
  }) | null
  bestBowling: (PersonalBestMatchRefDto & {
    wickets: number
    runsConceded: number
    overs: string
    economy: number
    display: string
  }) | null
  mostSixesInMatch: (PersonalBestMatchRefDto & {
    sixes: number
    runs: number
    balls: number
  }) | null
  mostFoursInMatch: (PersonalBestMatchRefDto & {
    fours: number
    runs: number
    balls: number
  }) | null
  bestStrikeRate: (PersonalBestMatchRefDto & {
    strikeRate: number
    runs: number
    balls: number
    notOut: boolean
  }) | null
  bestStrikeRateQualified: boolean
  bestStrikeRateCriteria: string
  mostWicketsInMatch: (PersonalBestMatchRefDto & {
    wickets: number
    runsConceded: number
    overs: string
  }) | null
}

export type AchievementCategory = 'BATTING' | 'BOWLING' | 'CAREER' | 'MATCH' | 'TOURNAMENT'

export interface PlayerAchievementDto {
  id: string
  key: string
  title: string
  subtitle: string
  category: AchievementCategory
  achievedAt: string | null
  count?: number
}

export interface PerformanceSeriesPoint {
  matchIndex: number
  matchKey?: string
  matchId: string
  label: string
  opponentName?: string
  opponentShortName?: string
  date: string
  runs: number
  balls: number
  batted?: boolean
  notOut?: boolean
  wickets: number
  runsConceded: number
  bowled?: boolean
  overs?: string
  economy?: number
  result?: 'WON' | 'LOST' | 'TIED' | 'NO_RESULT'
  cumulativeAverage: number
  cumulativeStrikeRate: number
}

export interface SeasonPerformancePoint {
  seasonId: string
  seasonName: string
  label: string
  year: number
  matches: number
  inningsBatted: number
  runs: number
  balls: number
  inningsBowled: number
  wickets: number
  legalBalls: number
  overs: string
  runsConceded: number
  battingAverage: number | null
  strikeRate: number
  economy: number
  teams: string[]
}

export interface UpcomingPlayerMatchDto {
  id: string
  matchId: string
  format: string
  status: string
  venue: string | null
  matchDate: string | null
  tournament: { id: string; name: string; shortName: string }
  season: { id: string; name: string; year: number } | null
  playerTeam: TeamSummaryDto | null
  opponent: TeamSummaryDto | null
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
  performanceSeries: PerformanceSeriesPoint[]
  seasonPerformance?: SeasonPerformancePoint[]
  personalBests?: PersonalBestsDto | null
  achievements?: PlayerAchievementDto[]
  upcomingMatches?: UpcomingPlayerMatchDto[]
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

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return 'Schedule TBA'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Schedule TBA'
  const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return `${datePart} · ${timePart}`
}

