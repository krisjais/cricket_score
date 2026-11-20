'use client'

import { useState, useEffect } from 'react'
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { AdminSession } from '@/lib/client'
import { cn } from '@/lib/utils'
import { useBodyScrollLock, usePreventTouchMove } from '@/hooks/use-body-scroll-lock'

export type AdminTab =
  | 'dashboard'
  | 'scoring'
  | 'matches'
  | 'schedule'
  | 'teams'
  | 'players'
  | 'career'
  | 'captains'
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('apl-admin-sidebar-collapsed') === 'true'
      } catch {}
    }
    return false
  })
  const isScorerMode = currentTab === 'scoring'

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('apl-admin-sidebar-collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Keyboard shortcut Cmd+B or Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return
        }
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock background body scrolling completely when mobile drawer is open
  useBodyScrollLock(mobileOpen)
  const backdropRef = usePreventTouchMove<HTMLDivElement>()

  const adminNavItems = [
    { key: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'scoring' as AdminTab, label: 'Scorer Panel', icon: Radio, badge: liveCount > 0 ? `${liveCount}` : undefined },
    { key: 'matches' as AdminTab, label: 'Matches', icon: CalendarDays },
    { key: 'schedule' as AdminTab, label: 'Schedule', icon: CalendarClock },
    { key: 'teams' as AdminTab, label: 'Teams', icon: Shield },
    { key: 'players' as AdminTab, label: 'Players', icon: Users },
    { key: 'career' as AdminTab, label: 'Career & Seasons', icon: UserCheck },
    { key: 'captains' as AdminTab, label: 'Captain Management', icon: Crown },
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

  const renderContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-[#121826] text-white overflow-hidden">
      {/* Brand Header & Toggle */}
      <div
        className={cn(
          'border-b border-white/10 flex items-center transition-all duration-300',
          isCollapsed ? 'px-2 py-3.5 justify-center' : 'px-4 py-4 justify-between'
        )}
      >
        {isCollapsed ? (
          /* Closed View: The logo is the open button, and hovering it reveals the open button */
          <button
            type="button"
            onClick={toggleCollapsed}
            className="relative group w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none"
            title="Open sidebar (⌘B)"
            aria-label="Open sidebar"
          >
            {/* Logo in default state */}
            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
              <NplLogo
                size="xs"
                variant="dark"
                showText={false}
                title="APL"
              />
            </div>

            {/* Open button icon smoothly appearing on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 text-gray-200 group-hover:text-white">
              <PanelLeftOpen className="w-5 h-5 text-amber-400 group-hover:text-white transition-colors" />
            </div>
          </button>
        ) : (
          /* Open View: Logo on left, Close button on right */
          <>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none transition-all duration-300 min-w-0"
              title="APL Cricket Tournament"
            >
              <NplLogo
                size="xs"
                variant="dark"
                showText={true}
                title="APL"
                subtitle={isScorerMode ? 'Scorer Panel' : 'Admin Panel'}
              />
            </button>

            {/* Toggle Close Button in Open View */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden md:inline-flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer p-1.5 focus:outline-none"
              title="Close sidebar (⌘B)"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto overscroll-contain py-4 space-y-1 transition-all duration-300',
          isCollapsed ? 'px-2' : 'px-3'
        )}
      >
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
                  title={item.label}
                  className={cn(
                    'w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group',
                    isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-start gap-3 px-3.5 py-2.5',
                    active
                      ? 'bg-[#7A1426] text-white shadow-sm font-bold'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span
                    className={cn(
                      'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-left',
                      isCollapsed ? 'opacity-0 max-w-0 w-0' : 'opacity-100 max-w-[160px]'
                    )}
                  >
                    {item.label}
                  </span>
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
                title="Admin Dashboard"
                className={cn(
                  'w-full flex items-center rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer group',
                  isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-start gap-2.5 px-3.5 py-2.5'
                )}
              >
                <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span
                  className={cn(
                    'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-left',
                    isCollapsed ? 'opacity-0 max-w-0 w-0' : 'opacity-100 max-w-[160px]'
                  )}
                >
                  Admin Dashboard
                </span>
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
                title={item.label + (item.badge ? ` (${item.badge} LIVE)` : '')}
                className={cn(
                  'w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group',
                  isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3.5 py-2',
                  active
                    ? 'bg-[#7A1426] text-white shadow-sm font-bold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'gap-2.5')}>
                  <div className="relative flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {isCollapsed && item.badge && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-left',
                      isCollapsed ? 'opacity-0 max-w-0 w-0' : 'opacity-100 max-w-[150px]'
                    )}
                  >
                    {item.label}
                  </span>
                </span>

                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-red-600 text-white shrink-0 ml-1.5 animate-pulse">
                    {item.badge} LIVE
                  </span>
                )}
              </button>
            )
          })
        )}
      </nav>

      {/* Bottom Footer Actions */}
      <div
        className={cn(
          'border-t border-white/10 space-y-1 transition-all duration-300',
          isCollapsed ? 'p-2' : 'p-3'
        )}
      >
        <button
          type="button"
          onClick={() => {
            navigate('/')
            setMobileOpen(false)
          }}
          title="Public Website"
          className={cn(
            'w-full flex items-center rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer group',
            isCollapsed ? 'justify-center py-2 px-0' : 'justify-between px-3.5 py-2'
          )}
        >
          <span className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span
              className={cn(
                'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
                isCollapsed ? 'opacity-0 max-w-0 w-0' : 'opacity-100 max-w-[150px]'
              )}
            >
              Public Website
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            void session.logout()
            setMobileOpen(false)
          }}
          title="Logout"
          className={cn(
            'w-full flex items-center rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all cursor-pointer group',
            isCollapsed ? 'justify-center py-2 px-0' : 'justify-start gap-2.5 px-3.5 py-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span
            className={cn(
              'transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
              isCollapsed ? 'opacity-0 max-w-0 w-0' : 'opacity-100 max-w-[150px]'
            )}
          >
            Logout
          </span>
        </button>

        {/* Bottom Expand / Close Button */}
        <div className="hidden md:block pt-1.5 border-t border-white/10">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Open sidebar (⌘B)' : 'Close sidebar (⌘B)'}
            className={cn(
              'w-full flex items-center rounded-xl text-[11px] font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer group',
              isCollapsed ? 'justify-center py-2 px-0' : 'justify-between px-3.5 py-1.5'
            )}
          >
            {!isCollapsed ? (
              <>
                <span className="flex items-center gap-2">
                  <PanelLeftClose className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-white" />
                  <span>Close Sidebar</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                  ⌘B
                </span>
              </>
            ) : (
              <PanelLeftOpen className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-white transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        </div>
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
          title="APL"
          subtitle={isScorerMode ? 'Scorer Panel' : 'Admin Panel'}
        />
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-300 hover:bg-white/10 cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex overscroll-contain">
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs touch-none"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 touch-auto overscroll-contain bg-[#121826]">
            {renderContent(false)}
          </aside>
        </div>
      )}

      {/* Desktop Left Dark Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-screen sticky top-0 shadow-md transition-[width] duration-300 ease-in-out z-30 select-none overflow-hidden bg-[#121826]',
          collapsed ? 'w-[70px]' : 'w-60 lg:w-64'
        )}
      >
        {renderContent(collapsed)}
      </aside>
    </>
  )
}
