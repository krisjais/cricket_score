'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  title?: string
  subtitle?: string
  variant?: 'light' | 'dark'
}

export function NplLogo({
  size = 'md',
  className = '',
  showText = false,
  title = 'Nexcore Premier League',
  subtitle = 'Cricket Tournament',
  variant = 'light',
}: LogoProps) {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative shrink-0 rounded-full flex items-center justify-center shadow-xs border',
          variant === 'dark'
            ? 'bg-[#1D2538] border-white/15'
            : 'bg-white border-gray-200',
          sizeMap[size]
        )}
      >
        {/* Clean Vector NPL Crest */}
        <svg viewBox="0 0 40 40" className="w-[82%] h-[82%]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" stroke="#7A1426" strokeWidth="2.5" />
          <path d="M12 29L27 11" stroke={variant === 'dark' ? '#FFFFFF' : '#111827'} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M28 29L13 11" stroke="#7A1426" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="12.5" r="3" fill="#7A1426" />
          <circle cx="20" cy="27.5" r="2.2" fill={variant === 'dark' ? '#E5E7EB' : '#1F2937'} />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={cn(
              'font-bold tracking-tight text-sm',
              variant === 'dark' ? 'text-white' : 'text-[#111827]'
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'text-[11px] font-medium leading-none mt-0.5',
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
