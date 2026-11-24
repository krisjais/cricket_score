import { cn } from '@/lib/utils'

export function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200/80 animate-pulse rounded-xl', className)} />
}

/** Realistic skeleton for public match cards */
export function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3.5', className)}>
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-28 rounded-lg" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-4 w-24 rounded-md" />
          </div>
          <SkeletonBox className="h-5 w-14 rounded-md" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-4 w-28 rounded-md" />
          </div>
          <SkeletonBox className="h-5 w-12 rounded-md" />
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <SkeletonBox className="h-3 w-36 rounded" />
        <SkeletonBox className="h-3 w-16 rounded" />
      </div>
    </div>
  )
}

/** Realistic skeleton for Audience Match View */
export function MatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      {/* Top Bar */}
      <div className="bg-[#121826] text-white py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-24 bg-white/10 rounded-xl" />
            <SkeletonBox className="h-6 w-32 bg-white/10 rounded-lg hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-7 w-20 bg-white/10 rounded-full" />
            <SkeletonBox className="h-8 w-8 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Hero Scoreboard Banner */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Team A */}
            <div className="flex items-center gap-3.5">
              <SkeletonBox className="h-14 w-14 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-7 w-20" />
              </div>
            </div>
            {/* Center VS & Overs */}
            <div className="text-center space-y-2">
              <SkeletonBox className="h-6 w-16 mx-auto rounded-full" />
              <SkeletonBox className="h-4 w-28 mx-auto" />
            </div>
            {/* Team B */}
            <div className="flex items-center justify-end gap-3.5 text-right">
              <div className="space-y-1.5 flex-1 flex flex-col items-end">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-7 w-20" />
              </div>
              <SkeletonBox className="h-14 w-14 rounded-full shrink-0" />
            </div>
          </div>
          {/* Progress / Status banner */}
          <SkeletonBox className="h-10 w-full rounded-2xl bg-gray-100" />
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="h-9 flex-1 rounded-xl" />
          ))}
        </div>

        {/* Crease Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
            <SkeletonBox className="h-4 w-28" />
            <div className="space-y-2">
              <SkeletonBox className="h-12 w-full rounded-xl" />
              <SkeletonBox className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-26 w-full rounded-xl" />
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-2">
          <SkeletonBox className="h-4 w-24" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonBox key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Realistic skeleton for Admin Scoring Console */
export function ScoringConsoleSkeleton() {
  return (
    <div className="h-full w-full bg-[#070B14] text-white flex flex-col overflow-hidden">
      {/* Top Match Bar */}
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8 rounded-full bg-white/15" />
          <div className="space-y-1">
            <SkeletonBox className="h-4 w-32 bg-white/15" />
            <SkeletonBox className="h-3 w-20 bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-24 rounded-xl bg-white/15" />
          <SkeletonBox className="h-8 w-20 rounded-xl bg-white/15" />
        </div>
      </div>

      {/* Main Scoreboard Display */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5 flex-1 overflow-y-auto">
        <div className="rounded-3xl border border-white/10 bg-[#121826] p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-5 w-32 bg-white/15" />
            <SkeletonBox className="h-6 w-16 rounded-full bg-white/15" />
          </div>
          <div className="flex items-baseline gap-4">
            <SkeletonBox className="h-14 w-44 rounded-2xl bg-white/20" />
            <SkeletonBox className="h-7 w-28 bg-white/15" />
            <SkeletonBox className="h-7 w-24 bg-white/15 ml-auto" />
          </div>
        </div>

        {/* Crease (Batsmen + Bowler) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 space-y-2.5">
            <SkeletonBox className="h-4 w-28 bg-white/15" />
            <SkeletonBox className="h-12 w-full rounded-xl bg-white/10" />
            <SkeletonBox className="h-12 w-full rounded-xl bg-white/10" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 space-y-2.5">
            <SkeletonBox className="h-4 w-28 bg-white/15" />
            <SkeletonBox className="h-26 w-full rounded-xl bg-white/10" />
          </div>
        </div>

        {/* Scoring Keypad Placeholder */}
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 6].map((i) => (
              <SkeletonBox key={i} className="h-14 rounded-2xl bg-white/15" />
            ))}
            <SkeletonBox className="h-14 rounded-2xl bg-red-900/30 border border-red-500/20" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonBox key={i} className="h-10 rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Skeleton for Public Leaderboards Page */
export function LeaderboardsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-6 sm:p-8 text-white space-y-3">
        <SkeletonBox className="h-4 w-36 bg-white/20" />
        <SkeletonBox className="h-8 w-64 bg-white/30" />
        <SkeletonBox className="h-4 w-96 max-w-full bg-white/15" />
      </div>

      {/* 4 Spotlight Honors Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-12 w-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <SkeletonBox className="h-6 w-16" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBox key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
        <SkeletonBox className="h-5 w-36 mb-4" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-7 w-7 rounded-full" />
              <SkeletonBox className="h-9 w-9 rounded-full" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
            <SkeletonBox className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Tournament Awards Page */
export function AwardsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-7 w-16" />
            <SkeletonBox className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Awards Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-5 w-32" />
              <SkeletonBox className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-3.5">
              <SkeletonBox className="h-12 w-12 rounded-2xl" />
              <div className="space-y-1.5 flex-1">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <SkeletonBox className="h-7 w-20" />
              <SkeletonBox className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Points Table / Standings */
export function PointsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-8 w-24 rounded-xl" />
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonBox className="h-5 w-6 rounded" />
              <SkeletonBox className="h-9 w-9 rounded-full shrink-0" />
              <SkeletonBox className="h-4 w-36" />
            </div>
            <div className="flex items-center gap-6">
              <SkeletonBox className="h-4 w-8 hidden sm:block" />
              <SkeletonBox className="h-4 w-8 hidden sm:block" />
              <SkeletonBox className="h-5 w-10 rounded font-bold" />
              <SkeletonBox className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Teams franchise grid */
export function TeamsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-gray-200 pb-4">
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-7 w-52" />
          <SkeletonBox className="h-3 w-64" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-12 w-12 rounded-full" />
              <SkeletonBox className="h-5 w-14 rounded-full" />
            </div>
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-3 w-20" />
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Admin Portal layout & dashboards */
export function AdminPortalSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-[#121826] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8 rounded-xl bg-white/15" />
          <SkeletonBox className="h-4 w-28 bg-white/15" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-24 rounded-xl bg-white/15" />
          <SkeletonBox className="h-8 w-8 rounded-full bg-white/15" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Rail */}
        <div className="w-[70px] bg-[#121826] border-r border-white/10 hidden md:flex flex-col items-center py-4 space-y-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonBox key={i} className="h-10 w-10 rounded-xl bg-white/10" />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <SkeletonBox className="h-7 w-48" />
              <SkeletonBox className="h-4 w-64" />
            </div>
            <SkeletonBox className="h-9 w-32 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-7 w-16" />
                <SkeletonBox className="h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <SkeletonBox className="h-5 w-36" />
            <SkeletonBox className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Skeleton for admin table / list views */
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <SkeletonBox className="h-9 w-64 rounded-xl" />
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-7 w-16 rounded-lg" />
              <SkeletonBox className="h-7 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

