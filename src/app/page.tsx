'use client'

import dynamic from 'next/dynamic'

const AppShell = dynamic(
  () => import('@/components/cricket/app-shell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[100] bg-[#070B16]" />,
  }
)

export default function Home() {
  return <AppShell />
}
