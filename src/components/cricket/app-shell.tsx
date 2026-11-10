'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trophy, CalendarDays, Users, Shield, Radio, ArrowRight, ExternalLink } from 'lucide-react'
import { useAdminSession, useHashRoute, useMatchesFeed } from '@/lib/client'
import { AplLogo } from '@/components/cricket/apl-logo'
import { HomePage } from '@/components/cricket/home-page'
import { MatchesPage } from '@/components/cricket/matches-page'
import { MatchPage } from '@/components/cricket/match-page'
import { TeamsPage } from '@/components/cricket/teams-page'
import { TeamDetailPage } from '@/components/cricket/team-detail-page'
import { AwardsPage } from '@/components/cricket/awards-page'
import { AdminPage } from '@/components/cricket/admin/admin-page'

export function AppShell() {
  const [route, navigate] = useHashRoute()
  const { matches, loading } = useMatchesFeed(null)
  const session = useAdminSession()
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const seg = route.segments
  const isAdminRoute = seg[0] === 'admin'

  const content = useMemo(() => {
    if (seg[0] === 'matches') return <MatchesPage matches={matches} loading={loading} navigate={navigate} />
    if (seg[0] === 'match' && seg[1]) return <MatchPage matchId={seg[1]} navigate={navigate} />
    if (seg[0] === 'teams') return <TeamsPage navigate={navigate} />
    if (seg[0] === 'team' && seg[1]) return <TeamDetailPage teamId={seg[1]} navigate={navigate} />
    if (seg[0] === 'awards') return <AwardsPage navigate={navigate} />
    if (seg[0] === 'admin') return <AdminPage session={session} matches={matches} navigate={navigate} />
    return <HomePage matches={matches} loading={loading} navigate={navigate} />
  }, [seg, matches, loading, navigate, session])

  // If in admin view, render AdminPage full-screen (it has its own AdminSidebar and layout)
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#f8f6f0]">
        {content}
      </div>
    )
  }

  const navItems = [
    { key: 'home', label: 'Home', icon: Trophy, to: '/' },
    { key: 'matches', label: 'Matches', icon: CalendarDays, to: '/matches' },
    { key: 'teams', label: 'Teams', icon: Users, to: '/teams' },
    { key: 'awards', label: 'Awards', icon: Trophy, to: '/awards' },
  ]
  const activeKey = seg[0] || 'home'
  const liveMatch = matches.find((m) => m.status === 'LIVE')

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f6f0] text-[#111827]">
      {/* Public Navbar (Auction Style) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e2d5] shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
            aria-label="APL Cricket Home"
          >
            <AplLogo size="sm" showText subtitle="Season 8 • Live" />
          </button>

          {/* Desktop Nav Items */}
          <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-6 md:gap-8">
            {navItems.map((item) => {
              const active = activeKey === item.key || (item.key === 'home' && !seg[0])
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.to)}
                  className={`text-xs uppercase tracking-wider font-bold transition-colors relative py-1 cursor-pointer ${
                    active
                      ? 'text-[#0d3a24]'
                      : 'text-[#6b7280] hover:text-[#0d3a24]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-[#0d3a24] rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {liveMatch && (
              <button
                onClick={() => navigate(`/match/${liveMatch.id}`)}
                className="flex items-center gap-1.5 text-[#0d3a24] hover:text-[#0d3a24] text-xs font-bold transition-all bg-[#f4efe6] border border-[#e8e2d5] hover:border-[#0d3a24] px-3 py-1.5 rounded-xl shadow-xs cursor-pointer active:scale-98"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="hidden xs:inline">Watch</span> Live
              </button>
            )}

            {session.isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Shield className="w-3.5 h-3.5 text-[#c59b27]" />
                <span className="hidden sm:inline">Admin</span> Console
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin')}
                className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <nav
          aria-label="Mobile navigation"
          className="sm:hidden flex items-center justify-around border-t border-[#e8e2d5]/80 bg-[#faf8f5] px-2 py-1.5"
        >
          {navItems.map((item) => {
            const active = activeKey === item.key || (item.key === 'home' && !seg[0])
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
                  active ? 'bg-[#0d3a24] text-white' : 'text-[#6b7280]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {content}
      </main>

      {/* Footer (Auction Style) */}
      <footer className="mt-auto border-t border-[#e8e2d5] bg-white py-8 text-xs text-[#6b7280]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <AplLogo size="sm" />
            <div>
              <p className="font-serif font-bold text-sm text-[#0d3a24]">APL Cricket Live</p>
              <p className="text-[11px] text-[#9ca3af]">Official Tournament Scoring & Match Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <button onClick={() => navigate('/')} className="hover:text-[#0d3a24] cursor-pointer">Home</button>
            <button onClick={() => navigate('/matches')} className="hover:text-[#0d3a24] cursor-pointer">Fixtures</button>
            <button onClick={() => navigate('/teams')} className="hover:text-[#0d3a24] cursor-pointer">Teams</button>
            <button onClick={() => navigate('/awards')} className="hover:text-[#0d3a24] cursor-pointer">Awards</button>
            <button onClick={() => navigate('/admin')} className="text-[#0d3a24] font-bold hover:underline cursor-pointer">Admin Access</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
