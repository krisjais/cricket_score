'use client'

import { useState } from 'react'
import { AplLogo } from '@/components/cricket/apl-logo'
import {
  LayoutDashboard,
  Radio,
  CalendarDays,
  Shield,
  Users,
  Trophy,
  ScrollText,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import type { AdminSession } from '@/lib/client'

export type AdminTab = 'dashboard' | 'scoring' | 'matches' | 'teams' | 'players' | 'awards' | 'log' | 'reset'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  session: AdminSession
  navigate: (to: string) => void
  liveCount?: number
}

export function AdminSidebar({ currentTab, onSelectTab, session, navigate, liveCount = 0 }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { key: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'scoring' as AdminTab, label: 'Scoring Console', icon: Radio, badge: liveCount > 0 ? `${liveCount} LIVE` : undefined },
    { key: 'matches' as AdminTab, label: 'Matches Manager', icon: CalendarDays },
    { key: 'teams' as AdminTab, label: 'Teams', icon: Shield },
    { key: 'players' as AdminTab, label: 'Players', icon: Users },
    { key: 'awards' as AdminTab, label: 'Awards & Leaders', icon: Trophy },
    { key: 'log' as AdminTab, label: 'Match Event Log', icon: ScrollText },
    { key: 'reset' as AdminTab, label: 'Danger Zone', icon: AlertTriangle },
  ]

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await session.logout()
    navigate('/')
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#e8e2d5] flex items-center justify-between px-4 h-14 shadow-xs">
        <div className="flex items-center gap-2.5">
          <AplLogo size="sm" />
          <div>
            <span className="font-serif font-black text-xs uppercase tracking-wider text-[#0d3a24] block leading-none">
              APL Cricket
            </span>
            <span className="text-[10px] uppercase font-bold text-[#c59b27]">Admin Console</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[#4b5563] hover:text-[#111827] rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 top-0 left-0 h-dvh max-h-dvh z-50 w-64 border-r border-[#e8e2d5] bg-white flex flex-col transition-transform duration-200 shadow-xs ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo Banner */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-[#e8e2d5] shrink-0 bg-[#faf8f5]">
          <div className="flex items-center gap-3">
            <AplLogo size="sm" />
            <div>
              <div className="font-serif font-bold text-sm tracking-wide text-[#0d3a24]">
                APL Cricket
              </div>
              <div className="text-[10px] tracking-wider uppercase font-bold text-[#c59b27] flex items-center gap-1.5 mt-0.5">
                <span>Cricket Admin</span>
                {liveCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[#6b7280] hover:text-[#111827] p-1"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Admin user info */}
        <div className="px-4 py-3 border-b border-[#e8e2d5] bg-[#f8f6f0]/60 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#0d3a24] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {session.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#111827] truncate leading-tight">
                {session.username}
              </p>
              <p className="text-[10px] font-semibold text-[#0d3a24]">Head Scorer / Official</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 min-h-0 px-3 py-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest px-3 pb-1 text-[#9ca3af] font-bold">
            Console Navigation
          </p>
          {navItems.map((item) => {
            const active = currentTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0d3a24]/10 text-[#0d3a24] font-bold border border-[#0d3a24]/20 shadow-xs'
                    : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4efe6]/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0d3a24]' : 'text-[#6b7280]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 pt-3 pb-5 border-t border-[#e8e2d5] space-y-1.5 shrink-0 bg-[#faf8f5]">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#c59b27] hover:text-[#916922] hover:bg-amber-50/70 transition-colors border border-transparent hover:border-[#c59b27]/30 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Live Board</span>
            </span>
            <span className="text-xs">↗</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-colors active:scale-98 cursor-pointer border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
