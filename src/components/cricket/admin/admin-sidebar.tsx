'use client'

import { useState } from 'react'
import { NplLogo } from '@/components/cricket/apl-logo'
import {
  LayoutDashboard,
  Radio,
  CalendarDays,
  CalendarClock,
  Shield,
  Crown,
  Users,
  UserCheck,
  UserCog,
  Trophy,
  BarChart3,
  ScrollText,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import type { AdminSession } from '@/lib/client'
import { cn } from '@/lib/utils'

export type AdminTab =
  | 'dashboard'
  | 'scoring'
  | 'matches'
  | 'schedule'
  | 'teams'
  | 'players'
  | 'career'
  | 'captains'
  | 'officials'
  | 'results'
  | 'awards'
  | 'log'
  | 'reset'

export type ScorerSubView = 'score' | 'details' | 'log' | 'switch'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  scorerSubView?: ScorerSubView
  onSelectScorerSubView?: (view: ScorerSubView) => void
  session: AdminSession
  navigate: (to: string) => void
  liveCount?: number
}

export function AdminSidebar({
  currentTab,
  onSelectTab,
  scorerSubView = 'score',
  onSelectScorerSubView,
  session,
  navigate,
  liveCount = 0,
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isScorerMode = currentTab === 'scoring'

  const adminNavItems = [
    { key: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'scoring' as AdminTab, label: 'Scorer Panel', icon: Radio, badge: liveCount > 0 ? `${liveCount}` : undefined },
    { key: 'matches' as AdminTab, label: 'Matches', icon: CalendarDays },
    { key: 'schedule' as AdminTab, label: 'Schedule', icon: CalendarClock },
    { key: 'teams' as AdminTab, label: 'Teams', icon: Shield },
    { key: 'players' as AdminTab, label: 'Players', icon: Users },
    { key: 'career' as AdminTab, label: 'Career & Seasons', icon: UserCheck },
    { key: 'captains' as AdminTab, label: 'Captain Management', icon: Crown },
    { key: 'officials' as AdminTab, label: 'Officials', icon: UserCog },
    { key: 'results' as AdminTab, label: 'Results', icon: Trophy },
    { key: 'awards' as AdminTab, label: 'Statistics & Awards', icon: BarChart3 },
    { key: 'log' as AdminTab, label: 'Match Log', icon: ScrollText },
    { key: 'reset' as AdminTab, label: 'Settings', icon: Settings },
  ]

  const scorerNavItems = [
    { key: 'score' as ScorerSubView, label: 'Score Match', icon: Radio },
    { key: 'details' as ScorerSubView, label: 'Match Details', icon: FileText },
    { key: 'log' as ScorerSubView, label: 'Match Log', icon: ScrollText },
    { key: 'switch' as ScorerSubView, label: 'Switch Match', icon: ArrowLeftRight },
  ]

  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#121826] text-white">
      {/* Brand Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center text-left cursor-pointer focus:outline-none"
        >
          <NplLogo
            size="sm"
            variant="dark"
            showText
            title="NPL"
            subtitle={isScorerMode ? 'Scorer Panel' : 'Admin Panel'}
          />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isScorerMode && onSelectScorerSubView ? (
          <>
            {scorerNavItems.map((item) => {
              const Icon = item.icon
              const active = scorerSubView === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectScorerSubView(item.key)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-[#7A1426] text-white shadow-sm'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('dashboard')
                  setMobileOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Admin Dashboard</span>
              </button>
            </div>
          </>
        ) : (
          adminNavItems.map((item) => {
            const Icon = item.icon
            const active = currentTab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectTab(item.key)
                  setMobileOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  active
                    ? 'bg-[#7A1426] text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-red-600 text-white">
                    {item.badge} LIVE
                  </span>
                )}
              </button>
            )
          })
        )}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={() => {
            navigate('/')
            setMobileOpen(false)
          }}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <span>Public Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            void session.logout()
            setMobileOpen(false)
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-[#121826] text-white px-4 py-3 shadow-sm">
        <NplLogo
          size="sm"
          variant="dark"
          showText
          title="NPL"
          subtitle={isScorerMode ? 'Scorer Panel' : 'Admin Panel'}
        />
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-300 hover:bg-white/10"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">{sidebarBody}</aside>
        </div>
      )}

      {/* Desktop Left Dark Sidebar */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 h-screen sticky top-0 shadow-md">
        {sidebarBody}
      </aside>

    </>
  )
}
