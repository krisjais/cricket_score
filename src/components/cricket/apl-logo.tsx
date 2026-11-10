'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  subtitle?: string
}

export function AplLogo({ size = 'md', className = '', showText = false, subtitle = 'Cricket Live' }: LogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }

  const dimensionMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 rounded-xl overflow-hidden bg-white/50 p-0.5 border border-[#e8e2d5]/60 shadow-xs flex items-center justify-center`}>
        <Image
          src="/APL.png"
          alt="APL Cricket"
          width={dimensionMap[size]}
          height={dimensionMap[size]}
          priority
          className="object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-serif font-black text-sm tracking-wide text-[#0d3a24] uppercase leading-tight">
            APL Cricket
          </span>
          <span className="text-[10px] tracking-widest uppercase font-bold text-[#c59b27] leading-none mt-0.5">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )
}
