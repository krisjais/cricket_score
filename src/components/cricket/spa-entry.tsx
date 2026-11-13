'use client'

import dynamic from 'next/dynamic'
import { SplashLoadingFallback } from '@/components/cricket/portal-splash'

export const SpaEntry = dynamic(
  () => import('@/components/cricket/app-shell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => <SplashLoadingFallback />,
  }
)

