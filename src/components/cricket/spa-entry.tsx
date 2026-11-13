'use client'

import dynamic from 'next/dynamic'

export const SpaEntry = dynamic(
  () => import('@/components/cricket/app-shell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[100] bg-[#070B16]" />,
  }
)

