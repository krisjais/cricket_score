'use client'

import dynamic from 'next/dynamic'
import { SplashLoadingFallback } from '@/components/cricket/portal-splash'

const AppShell = dynamic(
  () => import('@/components/cricket/app-shell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => <SplashLoadingFallback />,
  }
)

export default function Home() {
  return <AppShell />
}
