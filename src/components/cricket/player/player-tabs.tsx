'use client'

import { useRef, type ReactNode } from 'react'

export interface PlayerTabItem<T extends string> {
  key: T
  label: string
  icon?: ReactNode
  badge?: string | number
}

export function getPlayerTabId(prefix: string, key: string) {
  return `${prefix}-tab-${key}`
}

export function getPlayerPanelId(prefix: string, key: string) {
  return `${prefix}-panel-${key}`
}

export function PlayerTabs<T extends string>({
  idPrefix,
  ariaLabel,
  tabs,
  activeKey,
  onSelect,
}: {
  idPrefix: string
  ariaLabel: string
  tabs: ReadonlyArray<PlayerTabItem<T>>
  activeKey: T
  onSelect: (key: T) => void
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function selectAndFocus(nextKey: T) {
    onSelect(nextKey)
    tabRefs.current[nextKey]?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = tabs.findIndex((t) => t.key === activeKey)
    if (idx === -1) return

    let nextIdx: number | null = null
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIdx = 0
    else if (e.key === 'End') nextIdx = tabs.length - 1

    if (nextIdx !== null) {
      e.preventDefault()
      selectAndFocus(tabs[nextIdx].key)
    }
  }

  const hasOddTabCount = tabs.length % 2 === 1

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="player-tablist grid grid-cols-2 gap-1.5 rounded-2xl bg-white border border-[#E5E7EB] p-1.5 md:flex md:flex-wrap md:items-center md:gap-1 md:px-2 md:pt-1.5 md:pb-1 shadow-2xs"
    >
      {tabs.map((t, idx) => {
        const selected = t.key === activeKey
        const isTrailingOdd = hasOddTabCount && idx === tabs.length - 1
        return (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[t.key] = el
            }}
            id={getPlayerTabId(idPrefix, t.key)}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(t.key)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426] md:justify-start md:border-0 md:px-3.5 md:pt-2 md:pb-2.5 md:whitespace-nowrap ${
              isTrailingOdd ? 'col-span-2 md:col-span-1' : ''
            } ${
              selected
                ? 'bg-[#7A1426] border-[#7A1426] text-white shadow-xs md:bg-[#7A1426]/6 md:text-[#7A1426] md:shadow-none'
                : 'bg-[#F8F9FB] border-gray-200/90 text-gray-700 hover:bg-[#F3F4F6] hover:text-[#111827] md:bg-transparent md:text-gray-600'
            }`}
          >
            {t.icon ? <span aria-hidden="true">{t.icon}</span> : null}
            <span className="text-center md:text-left">{t.label}</span>
            {t.badge !== undefined && t.badge !== null && t.badge !== '' ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                  selected
                    ? 'bg-white/20 text-white md:bg-[#7A1426] md:text-white'
                    : 'bg-white border border-gray-200 text-gray-700 md:border-0 md:bg-gray-100 md:text-gray-600'
                }`}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

