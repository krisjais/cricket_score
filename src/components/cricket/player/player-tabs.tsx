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
    const btn = tabRefs.current[nextKey]
    if (btn) {
      btn.focus()
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
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

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="player-tablist items-center gap-1 rounded-2xl bg-white border border-[#E5E7EB] px-2 pt-1.5 pb-1 shadow-2xs"
    >
      {tabs.map((t) => {
        const selected = t.key === activeKey
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
            onClick={(e) => {
              onSelect(t.key)
              e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 pt-2 pb-2.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426] ${
              selected
                ? 'bg-[#7A1426]/6 text-[#7A1426]'
                : 'text-gray-600 hover:bg-[#F3F4F6] hover:text-[#111827]'
            }`}
          >
            {t.icon ? <span aria-hidden="true">{t.icon}</span> : null}
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge !== null && t.badge !== '' ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  selected ? 'bg-[#7A1426] text-white' : 'bg-gray-100 text-gray-600'
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

