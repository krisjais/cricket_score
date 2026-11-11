'use client'

import { Trophy, CalendarDays, Users, Shield, Home, Award } from 'lucide-react'
import { useAdminSession, useHashRoute, useMatchesFeed } from '@/lib/client'
import { NplLogo } from '@/components/cricket/apl-logo'
import { HomePage } from '@/components/cricket/home-page'
import { MatchesPage } from '@/components/cricket/matches-page'
import { MatchPage } from '@/components/cricket/match-page'
import { TeamsPage } from '@/components/cricket/teams-page'
import { TeamDetailPage } from '@/components/cricket/team-detail-page'
import { PointsTablePage } from '@/components/cricket/points-table-page'
import { AwardsPage } from '@/components/cricket/awards-page'
import { AdminPage } from '@/components/cricket/admin/admin-page'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [route, navigate] = useHashRoute()
  const { matches, loading } = useMatchesFeed(null)
  const session = useAdminSession()

  const seg = route.segments
  const isAdminRoute = seg[0] === 'admin'
  const isMatchDetailRoute = seg[0] === 'match' && Boolean(seg[1])

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

  const navItems = [
    { key: 'home', label: 'Home', footerLabel: 'Home (Live Matches)', icon: Home, to: '/' },
    { key: 'matches', label: 'Matches', footerLabel: 'Matches (List)', icon: CalendarDays, to: '/matches' },
    { key: 'teams', label: 'Teams', footerLabel: 'Teams', icon: Users, to: '/teams' },
    { key: 'points-table', label: 'Points Table', footerLabel: 'Points Table', icon: Trophy, to: '/points-table' },
  ]
  const activeKey = seg[0] || 'home'

  const renderPage = () => {
    if (seg[0] === 'matches') return <MatchesPage matches={matches} loading={loading} navigate={navigate} />
    if (seg[0] === 'teams') return <TeamsPage navigate={navigate} />
    if (seg[0] === 'team' && seg[1]) return <TeamDetailPage teamId={seg[1]} navigate={navigate} />
    if (seg[0] === 'points-table') return <PointsTablePage navigate={navigate} />
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
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
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

          {/* Right Action: Maroon Admin Login / Panel Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/awards')}
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer',
                activeKey === 'awards'
                  ? 'bg-[#7A1426]/10 border-[#7A1426]/30 text-[#7A1426]'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
              title="Men & Women Tournament Awards"
            >
              <Award className="w-3.5 h-3.5 text-[#7A1426]" />
              <span>Awards</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
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
                'sm:hidden flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                activeKey === 'awards'
                  ? 'bg-[#7A1426] text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200/70 hover:text-[#111827]'
              )}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>Awards</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
        {renderPage()}
      </main>
    </div>
  )
}
