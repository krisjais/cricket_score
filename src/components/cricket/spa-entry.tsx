'use client'

import dynamic from 'next/dynamic'

export const SpaEntry = dynamic(
  () => import('@/components/cricket/app-shell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0d3a24] border-t-[#c59b27] rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#0d3a24]">
            Loading APL Cricket Live...
          </p>
        </div>
      </div>
    ),
  }
)

