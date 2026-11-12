'use client'

import { cn } from '@/lib/utils'

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface LogoProps {
  size?: LogoSize
  className?: string
  imgClassName?: string
  showText?: boolean
  title?: string
  subtitle?: string
  variant?: 'light' | 'dark'
  lazy?: boolean
  priority?: boolean
  alt?: string
}

const SIZE_MAP: Record<LogoSize, string> = {
  xs: 'h-8',
  sm: 'h-9 sm:h-10',
  md: 'h-12',
  lg: 'h-20',
  xl: 'h-24',
  '2xl': 'h-28 xl:h-32',
}

export function NplLogo({
  size = 'md',
  className = '',
  imgClassName = '',
  showText = false,
  title = 'Nexcore Premier League',
  subtitle = 'Cricket Tournament',
  variant = 'light',
  lazy = false,
  priority = false,
  alt,
}: LogoProps) {
  const resolvedAlt = alt ?? (showText ? '' : `${title} — APL Season 9 Logo`)

  return (
    <div className={cn('inline-flex max-w-full min-w-0 items-center gap-2 sm:gap-2.5', className)}>
      <picture className="inline-flex shrink-0 items-center justify-center">
        <source srcSet="/apl-logo-s9.avif" type="image/avif" />
        <source srcSet="/apl-logo-s9.webp" type="image/webp" />
        <img
          src="/apl-logo-s9.png"
          alt={resolvedAlt}
          width={400}
          height={478}
          decoding="async"
          loading={lazy ? 'lazy' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          className={cn(
            'w-auto object-contain select-none pointer-events-none',
            SIZE_MAP[size],
            variant === 'dark'
              ? 'drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]'
              : 'drop-shadow-[0_2px_4px_rgba(17,24,39,0.2)]',
            imgClassName
          )}
        />
      </picture>

      {showText && (
        <div className="flex min-w-0 flex-col text-left leading-tight">
          <span
            className={cn(
              'truncate font-bold tracking-tight text-[13px] sm:text-sm',
              variant === 'dark' ? 'text-white' : 'text-[#111827]'
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'mt-0.5 truncate text-[10.5px] sm:text-[11px] font-medium leading-none',
              variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )
}

export const AplLogo = NplLogo
