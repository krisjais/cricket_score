'use client'

import { Trophy, CalendarDays, Users, Shield, Home, Award, BarChart3, UserCheck, User } from 'lucide-react'
import { useAdminSession, useHashRoute, useMatchesFeed, usePlayerSession } from '@/lib/client'
import { NplLogo } from '@/components/cricket/apl-logo'
import { HomePage } from '@/components/cricket/home-page'
import { MatchesPage } from '@/components/cricket/matches-page'
import { MatchPage } from '@/components/cricket/match-page'
import { TeamsPage } from '@/components/cricket/teams-page'
import { TeamDetailPage } from '@/components/cricket/team-detail-page'
import { PointsTablePage } from '@/components/cricket/points-table-page'
import { AwardsPage } from '@/components/cricket/awards-page'
import { LeaderboardsPage } from '@/components/cricket/leaderboards-page'
import { PlayerLoginPage, PlayerRegisterPage } from '@/components/cricket/player/player-auth-pages'
import { PlayerDashboardPage } from '@/components/cricket/player/player-dashboard-page'
import { PublicPlayerProfilePage } from '@/components/cricket/player/public-player-profile-page'
import { AdminPage } from '@/components/cricket/admin/admin-page'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [route, navigate] = useHashRoute()
  const { matches, loading } = useMatchesFeed(null)
  const session = useAdminSession()
  const playerSession = usePlayerSession()

  const seg = route.segments
  const isAdminRoute = seg[0] === 'admin'
  const isMatchDetailRoute = seg[0] === 'match' && Boolean(seg[1])
  const isPlayerAuthRoute =
    seg[0] === 'player' && (seg[1] === 'login' || seg[1] === 'forgot-password' || seg[1] === 'register')

  // Admin Console or Umpire Panel renders full-screen with its own dark sidebar & header
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#F4F5F7]">
        <AdminPage session={session} matches={matches} navigate={navigate} />
      </div>
    )
  }

  // Audience Panel (Live Match View — Panel 2) renders its own dedicated header & bottom tab bar
  if (isMatchDetailRoute) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] text-[#111827]">
        <MatchPage matchId={seg[1]} navigate={navigate} />
      </div>
    )
  }

  // Player Portal Sign In, Forgot Password & Registration render edge-to-edge split layout
  if (isPlayerAuthRoute) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] text-[#111827]">
        {seg[1] === 'register' ? (
          <PlayerRegisterPage navigate={navigate} onAuthenticated={playerSession.refresh} />
        ) : seg[1] === 'forgot-password' ? (
          <PlayerLoginPage
            key="forgot-password"
            initialMode="FORGOT_PASSWORD"
            navigate={navigate}
            onAuthenticated={playerSession.refresh}
          />
        ) : (
          <PlayerLoginPage key="login" navigate={navigate} onAuthenticated={playerSession.refresh} />
        )}
      </div>
    )
  }

  const navItems = [
    { key: 'home', label: 'Home', footerLabel: 'Home (Live Matches)', icon: Home, to: '/' },
    { key: 'matches', label: 'Matches', footerLabel: 'Matches (List)', icon: CalendarDays, to: '/matches' },
    { key: 'teams', label: 'Teams', footerLabel: 'Teams', icon: Users, to: '/teams' },
    { key: 'points-table', label: 'Points Table', footerLabel: 'Points Table', icon: Trophy, to: '/points-table' },
    { key: 'leaderboards', label: 'Leaderboards', footerLabel: 'Leaderboards', icon: BarChart3, to: '/leaderboards' },
  ]
  const activeKey = seg[0] || 'home'

  const renderPage = () => {
    if (seg[0] === 'matches') return <MatchesPage matches={matches} loading={loading} navigate={navigate} />
    if (seg[0] === 'teams') return <TeamsPage navigate={navigate} />
    if (seg[0] === 'team' && seg[1]) return <TeamDetailPage teamId={seg[1]} navigate={navigate} />
    if (seg[0] === 'points-table') return <PointsTablePage navigate={navigate} />
    if (seg[0] === 'leaderboards') return <LeaderboardsPage navigate={navigate} />
    if (seg[0] === 'players' && seg[1]) {
      let playerIdOrCode = seg[1]
      try {
        playerIdOrCode = decodeURIComponent(seg[1])
      } catch {
        // Keep raw param if malformed percent encoding
      }
      return <PublicPlayerProfilePage playerIdOrCode={playerIdOrCode} navigate={navigate} />
    }
    if (seg[0] === 'player' && seg[1] === 'login') {
      return <PlayerLoginPage key="login" navigate={navigate} onAuthenticated={playerSession.refresh} />
    }
    if (seg[0] === 'player' && seg[1] === 'forgot-password') {
      return <PlayerLoginPage key="forgot-password" initialMode="FORGOT_PASSWORD" navigate={navigate} onAuthenticated={playerSession.refresh} />
    }
    if (seg[0] === 'player' && seg[1] === 'register') {
      return <PlayerRegisterPage navigate={navigate} onAuthenticated={playerSession.refresh} />
    }
    if (seg[0] === 'player' && (!seg[1] || seg[1] === 'dashboard')) {
      return <PlayerDashboardPage navigate={navigate} onAuthChanged={playerSession.refresh} />
    }
    if (seg[0] === 'awards') return <AwardsPage navigate={navigate} />
    return <HomePage matches={matches} loading={loading} navigate={navigate} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F5F7] text-[#111827]">
      {/* ===================== PUBLIC HEADER (Panel 1 Reference) ===================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo Left */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center text-left cursor-pointer focus:outline-none"
            aria-label="Nexcore Premier League Home"
          >
            <NplLogo size="sm" showText title="Nexcore Premier League" subtitle="Cricket Tournament" />
          </button>

          {/* Center Horizontal Nav Links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5 lg:gap-7">
            {navItems.map((item) => {
              const active =
                activeKey === item.key ||
                (item.key === 'home' && !seg[0]) ||
                (item.key === 'teams' && seg[0] === 'team')
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    'text-sm font-semibold transition-colors relative py-1 cursor-pointer',
                    active ? 'text-[#7A1426] font-bold' : 'text-gray-600 hover:text-[#111827]'
                  )}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-[19px] left-0 right-0 h-[3px] bg-[#7A1426] rounded-t-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Action: Player Portal, Awards & Admin Login / Panel Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/awards')}
              className={cn(
                'hidden lg:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer',
                activeKey === 'awards'
                  ? 'bg-[#7A1426]/10 border-[#7A1426]/30 text-[#7A1426]'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
              title="Men & Women Tournament Awards"
            >
              <Award className="w-3.5 h-3.5 text-[#7A1426]" />
              <span>Awards</span>
            </button>

            {playerSession.isAuthenticated && playerSession.player ? (
              <button
                type="button"
                onClick={() => navigate('/player/dashboard')}
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border transition-colors cursor-pointer',
                  activeKey === 'player'
                    ? 'bg-[#121826] text-white border-[#121826]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                )}
                title={`${playerSession.player.name} Dashboard`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{playerSession.player.playerCode || 'My Career'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/player/login')}
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border transition-colors cursor-pointer',
                  activeKey === 'player'
                    ? 'bg-[#121826] text-white border-[#121826]'
                    : 'bg-white border-gray-200 text-[#111827] hover:bg-gray-50'
                )}
                title="Player Login & Career Portal"
              >
                <User className="w-3.5 h-3.5 text-[#7A1426]" />
                <span>Player Login</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{session.isAdmin ? 'Admin Console' : 'Admin Login'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Navigation (replaces bottom bar on small viewports) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-gray-100 bg-gray-50/80 px-3 py-1.5 overflow-x-auto"
        >
          <div className="flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const active =
                activeKey === item.key ||
                (item.key === 'home' && !seg[0]) ||
                (item.key === 'teams' && seg[0] === 'team')
              const Icon = item.icon
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#7A1426] text-white font-bold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-200/70 hover:text-[#111827]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => navigate('/awards')}
              className={cn(
                'lg:hidden flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                activeKey === 'awards'
                  ? 'bg-[#7A1426] text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/70 hover:text-[#111827]'
              )}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>Awards</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(playerSession.isAuthenticated ? '/player/dashboard' : '/player/login')}
              className={cn(
                'sm:hidden flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                activeKey === 'player'
                  ? 'bg-[#121826] text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/70 hover:text-[#111827]'
              )}
            >
              {playerSession.isAuthenticated ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{playerSession.player?.playerCode || 'My Career'}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Player Portal</span>
                </>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
        {renderPage()}
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-gray-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center text-left cursor-pointer focus:outline-none"
            aria-label="Nexcore Premier League Home"
          >
            <NplLogo
              size="sm"
              lazy
              showText
              title="Nexcore Premier League"
              subtitle="APL Season 9 • Official Cricket Portal"
            />
          </button>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-500">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.to)}
                className="hover:text-[#7A1426] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/awards')}
              className="hover:text-[#7A1426] transition-colors cursor-pointer"
            >
              Awards
            </button>
            <button
              type="button"
              onClick={() => navigate(playerSession.isAuthenticated ? '/player/dashboard' : '/player/login')}
              className="hover:text-[#7A1426] transition-colors cursor-pointer"
            >
              Player Portal
            </button>
          </nav>
        </div>
      </footer>
    </div>
  )
}
