'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Trophy, CalendarDays, Users, Shield, Home, Award, BarChart3, User, Sparkles, LogIn } from 'lucide-react'
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
import { PlayerNotificationBell } from '@/components/cricket/player/player-notification-bell'
import { PlayerDashboardPage } from '@/components/cricket/player/player-dashboard-page'
import { PlayerDashboardSkeleton } from '@/components/cricket/player/player-career-widgets'
import { PublicPlayerProfilePage } from '@/components/cricket/player/public-player-profile-page'
import { AdminPage } from '@/components/cricket/admin/admin-page'
import { NplPageTransition, type NplTransitionType } from '@/components/cricket/transitions/npl-page-transition'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [route, baseNavigate] = useHashRoute()
  const { matches, loading } = useMatchesFeed(null)
  const session = useAdminSession()
  const playerSession = usePlayerSession()
  const [splashReplayToken, setSplashReplayToken] = useState(0)
  const [pageTransition, setPageTransition] = useState<{
    type: NplTransitionType
    targetUrl: string
  } | null>(null)

  const seg = route.segments
  const isPlayerSignedIn = Boolean(playerSession.isAuthenticated && playerSession.player)

  const navigate = useCallback(
    (to: string, explicitType?: NplTransitionType) => {
      const clean = to.startsWith('/') ? to : `/${to}`
      const segTarget = clean.replace(/^\//, '').split('/')[0]

      const type =
        explicitType ??
        (segTarget === 'awards'
          ? 'awards'
          : segTarget === 'login'
          ? 'login'
          : null)

      const isCurrentAwards = seg[0] === 'awards'
      const isCurrentLogin =
        seg[0] === 'login' || (seg[0] === 'player' && seg[1] === 'login')

      if (type === 'awards' && !isCurrentAwards) {
        setPageTransition({ type: 'awards', targetUrl: clean })
        return
      }

      if (type === 'login' && !isCurrentLogin) {
        setPageTransition({ type: 'login', targetUrl: clean })
        return
      }

      baseNavigate(to)
    },
    [baseNavigate, seg]
  )
  const isAdminRoute = seg[0] === 'admin'
  const isMatchDetailRoute = seg[0] === 'match' && Boolean(seg[1])
  const isPlayerAuthRoute =
    !isPlayerSignedIn &&
    (seg[0] === 'login' ||
      (seg[0] === 'player' &&
        (seg[1] === 'login' || seg[1] === 'forgot-password' || seg[1] === 'register')))

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
  const isShellActive = !isAdminRoute && !isMatchDetailRoute && !isPlayerAuthRoute

  const activeNavKey = isPlayerSignedIn
    ? activeKey === 'matches'
      ? 'matches'
      : 'player'
    : activeKey === 'awards'
    ? 'awards'
    : !seg[0]
    ? 'home'
    : seg[0] === 'team'
    ? 'teams'
    : navItems.some((item) => item.key === activeKey)
    ? activeKey
    : null

  const navListRef = useRef<HTMLDivElement>(null)
  const navPillRef = useRef<HTMLSpanElement>(null)
  const navBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const prevNavKeyRef = useRef<string | null>(null)
  const activeNavKeyRef = useRef<string | null>(activeNavKey)
  const sheenTimerRef = useRef<number | null>(null)

  const syncMobilePill = useCallback((key: string | null, triggerSheen: boolean) => {
    const container = navListRef.current
    const pill = navPillRef.current
    if (!container || !pill) return

    const activeBtn = key ? navBtnRefs.current[key] : null
    if (!activeBtn || activeBtn.offsetWidth === 0) {
      delete container.dataset.pillReady
      return
    }

    pill.style.width = `${activeBtn.offsetWidth}px`
    pill.style.height = `${activeBtn.offsetHeight}px`
    pill.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`
    container.dataset.pillReady = 'true'

    if (triggerSheen) {
      pill.dataset.moving = 'false'
      void pill.offsetWidth
      pill.dataset.moving = 'true'
      if (sheenTimerRef.current) window.clearTimeout(sheenTimerRef.current)
      sheenTimerRef.current = window.setTimeout(() => {
        if (navPillRef.current) delete navPillRef.current.dataset.moving
      }, 600)
    }
  }, [])

  useLayoutEffect(() => {
    activeNavKeyRef.current = activeNavKey
    if (!isShellActive) return
    const changed = prevNavKeyRef.current !== null && prevNavKeyRef.current !== activeNavKey
    prevNavKeyRef.current = activeNavKey
    syncMobilePill(activeNavKey, changed)
  }, [activeNavKey, isPlayerSignedIn, isShellActive, syncMobilePill])

  useEffect(() => {
    if (!isShellActive) return
    const container = navListRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => syncMobilePill(activeNavKeyRef.current, false))
    observer.observe(container)
    return () => {
      observer.disconnect()
      if (sheenTimerRef.current) window.clearTimeout(sheenTimerRef.current)
    }
  }, [isShellActive, syncMobilePill])

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
          playerSession={playerSession}
        />
      )
    }

    if (seg[0] === 'teams') return <TeamsPage navigate={navigate} />
    if (seg[0] === 'team' && seg[1]) return <TeamDetailPage teamId={seg[1]} navigate={navigate} />
    if (seg[0] === 'points-table') return <PointsTablePage navigate={navigate} />
    if (seg[0] === 'leaderboards') return <LeaderboardsPage navigate={navigate} />
    if (seg[0] === 'login' || (seg[0] === 'player' && seg[1] === 'login')) {
      return (
        <PlayerLoginPage
          key="login"
          navigate={navigate}
          onAuthenticated={playerSession.refresh}
          onAdminAuthenticated={session.refresh}
        />
      )
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
          playerSession={playerSession}
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
        {seg[0] === 'player' && seg[1] === 'register' ? (
          <PlayerRegisterPage navigate={navigate} onAuthenticated={playerSession.refresh} />
        ) : seg[0] === 'player' && seg[1] === 'forgot-password' ? (
          <PlayerLoginPage
            key="forgot-password"
            initialMode="FORGOT_PASSWORD"
            navigate={navigate}
            onAuthenticated={playerSession.refresh}
          />
        ) : (
          <PlayerLoginPage
            key="login"
            navigate={navigate}
            onAuthenticated={playerSession.refresh}
            onAdminAuthenticated={session.refresh}
          />
        )}
      </div>
    )
  } else {
    view = null
  }

  const transitionOverlay = pageTransition ? (
    <NplPageTransition
      key={`${pageTransition.type}-${pageTransition.targetUrl}`}
      type={pageTransition.type}
      onCommitRoute={() => {
        baseNavigate(pageTransition.targetUrl)
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}
      onFinished={() => {
        setPageTransition(null)
      }}
    />
  ) : null

  if (view) {
    return (
      <>
        {view}
        <PortalSplashScreen key={splashReplayToken} />
        {transitionOverlay}
      </>
    )
  }

  const isActiveNavItem = (key: string) =>
    isPlayerSignedIn
      ? (key === 'player' && activeKey !== 'matches') ||
        (key === 'matches' && activeKey === 'matches')
      : activeKey === key ||
        (key === 'home' && !seg[0]) ||
        (key === 'teams' && seg[0] === 'team')

  const liveMatchCount = matches.filter((m) => m.status === 'LIVE').length

  return (
    <>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#F4F5F7] text-[#111827]">
      {/* ===================== PUBLIC HEADER (Panel 1 Reference) ===================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 sm:px-6 lg:px-8 md:flex md:h-16 md:justify-between md:gap-4">
          {/* Logo Left */}
          <button
            type="button"
            onClick={() => navigate(isPlayerSignedIn ? '/player/dashboard' : '/')}
            className="order-1 min-w-0 py-2.5 flex items-center text-left cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]"
            aria-label={isPlayerSignedIn ? 'Nexcore Premier League Player Hub' : 'Nexcore Premier League Home'}
          >
            <NplLogo
              size="sm"
              showText
              title="Nexcore Premier League"
              subtitle={isPlayerSignedIn ? 'Player Career Portal' : 'Cricket Tournament'}
            />
          </button>

          {/* Primary Navigation (wraps cleanly on phone with animated sliding pill; inline on md+) */}
          <nav
            aria-label="Primary navigation"
            className="order-3 col-span-2 md:col-span-1 md:order-2 w-full md:w-auto border-t border-gray-100 md:border-t-0 py-2 md:py-0"
          >
            <div
              ref={navListRef}
              className="mobile-nav-group relative flex flex-wrap items-center justify-center gap-1.5 md:gap-5 lg:gap-7"
            >
              {/* Animated sliding maroon pill behind mobile nav tabs */}
              <span
                ref={navPillRef}
                aria-hidden="true"
                className="mobile-nav-pill md:hidden pointer-events-none absolute top-0 left-0 z-0 overflow-hidden rounded-lg bg-[#7A1426] shadow-xs"
              >
                <span className="mobile-nav-sheen pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              </span>

              {navItems.map((item, idx) => {
                const active = isActiveNavItem(item.key)
                const Icon = item.icon
                return (
                  <button
                    ref={(el) => {
                      navBtnRefs.current[item.key] = el
                    }}
                    type="button"
                    key={item.key}
                    onClick={() => navigate(item.to)}
                    aria-current={active ? 'page' : undefined}
                    style={{ ['--nav-idx' as string]: idx }}
                    className={cn(
                      'mobile-nav-item relative z-10 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors duration-200 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]',
                      'md:rounded-none md:px-0 md:py-1 md:text-sm md:bg-transparent md:shadow-none md:active:scale-100',
                      active
                        ? 'text-white font-bold md:text-[#7A1426]'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-[#111827] md:hover:bg-transparent'
                    )}
                  >
                    <Icon className="mobile-nav-icon w-3.5 h-3.5 shrink-0 md:hidden transition-transform duration-200" aria-hidden="true" />
                    <span>{item.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="nav-desktop-underline hidden md:block absolute -bottom-[18px] left-0 right-0 h-[3px] bg-[#7A1426] rounded-t-full"
                      />
                    )}
                  </button>
                )
              })}
              {!isPlayerSignedIn && (
                <button
                  ref={(el) => {
                    navBtnRefs.current.awards = el
                  }}
                  type="button"
                  onClick={() => navigate('/awards')}
                  aria-current={activeKey === 'awards' ? 'page' : undefined}
                  style={{ ['--nav-idx' as string]: navItems.length }}
                  className={cn(
                    'mobile-nav-item relative z-10 md:hidden inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors duration-200 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]',
                    activeKey === 'awards'
                      ? 'text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-[#111827]'
                  )}
                >
                  <Award className="mobile-nav-icon w-3.5 h-3.5 shrink-0 transition-transform duration-200" aria-hidden="true" />
                  <span>Awards</span>
                </button>
              )}
            </div>
          </nav>

          {/* Right Action: Player Portal, Awards & Admin Login / Panel Button */}
          <div className="order-2 md:order-3 flex items-center justify-self-end gap-2 shrink-0 py-2.5">
            {!isPlayerSignedIn && (
              <button
                type="button"
                onClick={() => navigate('/awards')}
                aria-current={activeKey === 'awards' ? 'page' : undefined}
                className={cn(
                  'hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]',
                  activeKey === 'awards'
                    ? 'bg-[#7A1426]/10 border-[#7A1426]/30 text-[#7A1426]'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                )}
                title="Men & Women Tournament Awards"
              >
                <Award className="w-3.5 h-3.5 text-[#7A1426]" aria-hidden="true" />
                <span>Awards</span>
              </button>
            )}

            {isPlayerSignedIn ? (
              <div className="flex items-center gap-2">
                <PlayerNotificationBell
                  playerSession={playerSession}
                  navigate={navigate}
                />
                <PlayerAccountMenu
                  playerSession={playerSession}
                  activeKey={activeKey}
                  navigate={navigate}
                />
              </div>
            ) : session.isAdmin ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]"
              >
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10 min-w-0">
        {renderPage()}
      </main>

      {/* Portal Footer */}
      <footer className="relative overflow-hidden border-t-2 border-[#7A1426] bg-[#0B1120] text-gray-300">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(122,20,38,0.24),transparent_58%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
            {/* Brand & League Summary */}
            <div className="md:col-span-7 space-y-4">
              <button
                type="button"
                onClick={() => navigate(isPlayerSignedIn ? '/player/dashboard' : '/')}
                className="inline-flex items-center text-left cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                aria-label={isPlayerSignedIn ? 'Nexcore Premier League Player Hub' : 'Nexcore Premier League Home'}
              >
                <NplLogo
                  size="sm"
                  lazy
                  variant="dark"
                  showText
                  title="Nexcore Premier League"
                  subtitle={isPlayerSignedIn ? 'APL Season 9 • Player Career Portal' : 'APL Season 9 • Official Cricket Portal'}
                />
              </button>
              <p className="max-w-sm text-xs leading-relaxed text-gray-400">
                Follow live match scorecards, fixtures, team squads, points standings, awards, and player career milestones across Season 9.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSplashReplayToken((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#7A1426]/60 bg-[#7A1426]/20 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#7A1426] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                  <span>Arena Intro</span>
                </button>
                {liveMatchCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    <span>{liveMatchCount} Live {liveMatchCount === 1 ? 'Match' : 'Matches'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tournament Navigation */}
            <nav aria-label="Footer tournament navigation" className="md:col-span-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3.5">
                Tournament Hub
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-medium">
                {navItems.map((item) => {
                  const active = isActiveNavItem(item.key)
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => navigate(item.to)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'text-left transition-colors cursor-pointer rounded px-1 -mx-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
                          active ? 'text-white font-bold underline decoration-[#7A1426] decoration-2 underline-offset-4' : 'text-gray-300 hover:text-white'
                        )}
                      >
                        {item.footerLabel}
                      </button>
                    </li>
                  )
                })}
                {!isPlayerSignedIn && (
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('/awards')}
                      aria-current={activeKey === 'awards' ? 'page' : undefined}
                      className={cn(
                        'text-left transition-colors cursor-pointer rounded px-1 -mx-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
                        activeKey === 'awards'
                          ? 'text-white font-bold underline decoration-[#7A1426] decoration-2 underline-offset-4'
                          : 'text-gray-300 hover:text-white'
                      )}
                    >
                      Awards &amp; Honors
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/25">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 py-4 text-[11px] text-gray-400 text-center sm:text-left">
            <span>Nexcore Premier League &bull; APL Season 9</span>
            <span>Official Live Scoring &amp; Career Statistics Portal</span>
          </div>
        </div>
      </footer>
      </div>
      <PortalSplashScreen key={splashReplayToken} />
      {transitionOverlay}
    </>
  )
}
