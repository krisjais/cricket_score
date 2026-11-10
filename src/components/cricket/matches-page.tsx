'use client'

import { useState } from 'react'
import { MatchCard } from '@/components/cricket/match-card'
import { Trophy, CalendarDays, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchSummary } from '@/lib/client'

const FILTERS = [
  { key: 'ALL', label: 'All Matches' },
  { key: 'LIVE', label: 'Live' },
  { key: 'COMPLETED', label: 'Results' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'ABANDONED', label: 'Abandoned' },
]

export function MatchesPage({
  matches,
  loading,
  navigate,
}: {
  matches: MatchSummary[]
  loading: boolean
  navigate: (to: string) => void
}) {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = matches.filter((m) => {
    // Status filter
    if (filter === 'UPCOMING') {
      const isUp = m.status === 'SCHEDULED' || m.status === 'TOSS_DONE' || m.status === 'INNINGS_BREAK' || m.status === 'PAUSED'
      if (!isUp) return false
    } else if (filter !== 'ALL') {
      if (m.status !== filter) return false
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchText = `${m.teamA.name} ${m.teamA.shortName} ${m.teamB.name} ${m.teamB.shortName} ${m.venue || ''} ${m.format}`.toLowerCase()
      return matchText.includes(q)
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e8e2d5] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c59b27] mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>APL Tournament Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#111827]">
            Fixtures & Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            Real-time ball-by-ball updates, completed results, and upcoming tournament fixtures.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or venue..."
            className="w-full bg-white border border-[#e8e2d5] rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0d3a24] shadow-2xs"
          />
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Match filter" className="flex flex-wrap gap-1.5 p-1 bg-[#f4efe6] border border-[#e8e2d5] rounded-2xl">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  active
                    ? 'bg-[#0d3a24] text-white shadow-xs'
                    : 'text-[#6b7280] hover:text-[#0d3a24] hover:bg-white/60'
                )}
              >
                <span>{f.label}</span>
                {f.key === 'LIVE' && matches.some((m) => m.status === 'LIVE') && (
                  <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse align-middle" aria-label="live" />
                )}
              </button>
            )
          })}
        </div>
        <span className="text-xs text-[#6b7280] ml-auto font-medium">
          Showing <b className="text-[#111827]">{filtered.length}</b> fixture{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Match Cards Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#e8e2d5]/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[#c59b27]" aria-hidden />
          <p className="text-base font-bold text-[#111827]">No Matches Found</p>
          <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria or switch filter tabs.' : 'No matches available in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}
