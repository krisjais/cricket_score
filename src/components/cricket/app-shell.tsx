'use client'

import { useState } from 'react'
import { Trophy, CalendarDays, Users, Shield, Home, Award, BarChart3, User, Sparkles } from 'lucide-react'
import { useAdminSession, useHashRoute, useMatchesFeed, usePlayerSession } from '@/lib/client'
import { NplLogo } from '@/components/cricket/apl-logo'
import { PortalSplashScreen } from '@/components/cricket/portal-splash'
import { HomePage } from '@/components/cricket/home-page'
import { MatchesPage } from '@/components/cricket/matches-page'
import { MatchPage } from '@/components/cricket/match-page'
import { TeamsPage } from '@/components/cricket/teams-page'
import { TeamDetailPage } from '@/components/cricket/team-detail-page'
import { PointsTablePage } from '@/components/cricket/points-table-page'
import { AwardsPage } from '@/components/cricket/awards-page'
import { LeaderboardsPage } from '@/components/cricket/leaderboards-page'
import { PlayerLoginPage, PlayerRegisterPage } from '@/components/cricket/player/player-auth-pages'
import { PlayerAccountMenu } from '@/components/cricket/player/player-account-menu'
import { PlayerDashboardPage } from '@/components/cricket/player/player-dashboard-page'
import { PlayerDashboardSkeleton } from '@/components/cricket/player/player-career-widgets'
import { PublicPlayerProfilePage } from '@/components/cricket/player/public-player-profile-page'
import { AdminPage } from '@/components/cricket/admin/admin-page'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [route, navigate] = useHashRoute()
  const { matches, loading } = useMatchesFeed(null)
  const session = useAdminSession()
  const playerSession = usePlayerSession()
  const [splashReplayToken, setSplashReplayToken] = useState(0)

  const seg = route.segments
  const isPlayerSignedIn = Boolean(playerSession.isAuthenticated && playerSession.player)
  const isAdminRoute = seg[0] === 'admin'
  const isMatchDetailRoute = seg[0] === 'match' && Boolean(seg[1])
  const isPlayerAuthRoute =
    !isPlayerSignedIn &&
    seg[0] === 'player' &&
    (seg[1] === 'login' || seg[1] === 'forgot-password' || seg[1] === 'register')

  const publicNavItems = [
    { key: 'home', label: 'Home', footerLabel: 'Home (Live Matches)', icon: Home, to: '/' },
    { key: 'matches', label: 'Matches', footerLabel: 'Matches (List)', icon: CalendarDays, to: '/matches' },
    { key: 'teams', label: 'Teams', footerLabel: 'Teams', icon: Users, to: '/teams' },
    { key: 'points-table', label: 'Points Table', footerLabel: 'Points Table', icon: Trophy, to: '/points-table' },
    { key: 'leaderboards', label: 'Leaderboards', footerLabel: 'Leaderboards', icon: BarChart3, to: '/leaderboards' },
  ]
  const playerNavItems = [
    { key: 'player', label: 'My Career Hub', footerLabel: 'My Career Hub', icon: User, to: '/player/dashboard' },
    { key: 'matches', label: 'Tournament Matches', footerLabel: 'Tournament Matches', icon: CalendarDays, to: '/matches' },
  ]
  const navItems = isPlayerSignedIn ? playerNavItems : publicNavItems
  const activeKey = seg[0] || (isPlayerSignedIn ? 'player' : 'home')

  const renderPage = () => {
    if (playerSession.loading && (!seg[0] || seg[0] === 'player')) {
      return <PlayerDashboardSkeleton />
    }

    if (seg[0] === 'matches') return <MatchesPage matches={matches} loading={loading} navigate={navigate} />
    if (seg[0] === 'players' && seg[1]) {
      let playerIdOrCode = seg[1]
      try {
        playerIdOrCode = decodeURIComponent(seg[1])
      } catch {
        // Keep raw param if malformed percent encoding
      }
      const isOwnProfile = Boolean(
        playerSession.isAuthenticated &&
          playerSession.player &&
          playerSession.player.id === playerIdOrCode
      )
      return (
        <PublicPlayerProfilePage
          playerIdOrCode={playerIdOrCode}
          isOwnProfile={isOwnProfile}
          hasPlayerSession={playerSession.isAuthenticated}
          navigate={navigate}
        />
      )
    }

    if (isPlayerSignedIn) {
      return (
        <PlayerDashboardPage
          initialTab={seg[0] === 'player' ? route.query.get('tab') : null}
          navigate={navigate}
          onAuthChanged={playerSession.refresh}
        />
      )
    }

    if (seg[0] === 'teams') return <TeamsPage navigate={navigate} />
    if (seg[0] === 'team' && seg[1]) return <TeamDetailPage teamId={seg[1]} navigate={navigate} />
    if (seg[0] === 'points-table') return <PointsTablePage navigate={navigate} />
    if (seg[0] === 'leaderboards') return <LeaderboardsPage navigate={navigate} />
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
      return (
        <PlayerDashboardPage
          initialTab={route.query.get('tab')}
          navigate={navigate}
          onAuthChanged={playerSession.refresh}
        />
      )
    }
    if (seg[0] === 'awards') return <AwardsPage navigate={navigate} />
    return <HomePage matches={matches} loading={loading} navigate={navigate} />
  }

  let view: React.ReactNode
  if (isAdminRoute) {
    view = (
      <div className="min-h-screen bg-[#F4F5F7]">
        <AdminPage session={session} matches={matches} navigate={navigate} />
      </div>
    )
  } else if (isMatchDetailRoute) {
    view = (
      <div className="min-h-screen bg-[#F4F5F7] text-[#111827]">
        <MatchPage
          matchId={seg[1]}
          navigate={navigate}
          backTo={isPlayerSignedIn ? '/matches' : '/'}
          brandTo={isPlayerSignedIn ? '/player/dashboard' : '/'}
        />
      </div>
    )
  } else if (isPlayerAuthRoute) {
    view = (
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
  } else {
    view = null
  }

  if (view) {
    return (
      <>
        {view}
        <PortalSplashScreen key={splashReplayToken} />
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#F4F5F7] text-[#111827]">
      {/* ===================== PUBLIC HEADER (Panel 1 Reference) ===================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo Left */}
          <button
            type="button"
            onClick={() => navigate(isPlayerSignedIn ? '/player/dashboard' : '/')}
            className="flex items-center text-left cursor-pointer focus:outline-none"
            aria-label={isPlayerSignedIn ? 'Nexcore Premier League Player Hub' : 'Nexcore Premier League Home'}
          >
            <NplLogo
              size="sm"
              showText
              title="Nexcore Premier League"
              subtitle={isPlayerSignedIn ? 'Player Career Portal' : 'Cricket Tournament'}
            />
          </button>

          {/* Center Horizontal Nav Links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5 lg:gap-7">
            {navItems.map((item) => {
              const active = isPlayerSignedIn
                ? (item.key === 'player' && activeKey !== 'matches') ||
                  (item.key === 'matches' && activeKey === 'matches')
                : activeKey === item.key ||
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
            {!isPlayerSignedIn && (
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
            )}

            {isPlayerSignedIn ? (
              <PlayerAccountMenu
                playerSession={playerSession}
                activeKey={activeKey}
                navigate={navigate}
              />
            ) : (
              <>
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

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{session.isAdmin ? 'Admin Console' : 'Admin Login'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header Navigation (replaces bottom bar on small viewports) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-gray-100 bg-gray-50/80 px-3 py-1.5 overflow-x-auto"
        >
          <div className="flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const active = isPlayerSignedIn
                ? (item.key === 'player' && activeKey !== 'matches') ||
                  (item.key === 'matches' && activeKey === 'matches')
                : activeKey === item.key ||
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
            {!isPlayerSignedIn && (
              <>
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
                  onClick={() => navigate('/player/login')}
                  className={cn(
                    'sm:hidden flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                    activeKey === 'player'
                      ? 'bg-[#121826] text-white font-bold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-200/70 hover:text-[#111827]'
                  )}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Player Portal</span>
                </button>
              </>
            )}
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
            onClick={() => navigate(isPlayerSignedIn ? '/player/dashboard' : '/')}
            className="flex items-center text-left cursor-pointer focus:outline-none"
            aria-label={isPlayerSignedIn ? 'Nexcore Premier League Player Hub' : 'Nexcore Premier League Home'}
          >
            <NplLogo
              size="sm"
              lazy
              showText
              title="Nexcore Premier League"
              subtitle={isPlayerSignedIn ? 'APL Season 9 • Player Career Portal' : 'APL Season 9 • Official Cricket Portal'}
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
            {isPlayerSignedIn ? (
              <button
                type="button"
                onClick={() => navigate('/player/dashboard?tab=profile')}
                className="hover:text-[#7A1426] transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/awards')}
                  className="hover:text-[#7A1426] transition-colors cursor-pointer"
                >
                  Awards
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/player/login')}
                  className="hover:text-[#7A1426] transition-colors cursor-pointer"
                >
                  Player Portal
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSplashReplayToken((c) => c + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-[#7A1426] hover:bg-[#7A1426] hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Arena Intro</span>
            </button>
          </nav>
        </div>
      </footer>
      </div>
      <PortalSplashScreen key={splashReplayToken} />
    </>
  )
}
