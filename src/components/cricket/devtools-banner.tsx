'use client'

import { useEffect } from 'react'

export function DevtoolsBanner() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Clean APL 2026 announcement in console (No CSS box glitches)
    const runCleanBanner = () => {
      try {
        const print = new Function(`
          try {
            console.clear();
            console.log(
              '%cAPL 2026',
              'font-size: 54px; font-weight: 900; color: #7A1426; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; letter-spacing: 2px;'
            );
            console.log(
              '%cAlliance Premier League • Official Scoring Portal',
              'font-size: 14px; font-weight: 600; color: #6B7280; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin-top: 4px;'
            );
          } catch {}
        `)
        print()
      } catch {}
    }

    runCleanBanner()

    // 2. Filter console to suppress code leaks, framework noise, and chunk traces
    const originalLog = console.log
    const originalInfo = console.info
    const originalDebug = console.debug
    const originalWarn = console.warn

    console.log = (...args: any[]) => {
      const str = typeof args[0] === 'string' ? args[0] : ''
      if (str.includes('APL 2026') || str.includes('Alliance Premier League')) {
        originalLog.apply(console, args)
      }
    }
    console.info = () => {}
    console.debug = () => {}
    console.warn = (...args: any[]) => {
      const str = typeof args[0] === 'string' ? args[0] : ''
      if (
        str.includes('devtools') ||
        str.includes('LayoutGroup') ||
        str.includes('source map') ||
        str.includes('Extra attributes from the server') ||
        str.includes('Fast Refresh')
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    // 3. Disable Right-Click (blocks "Inspect Element" and "View Page Source" context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }
    document.addEventListener('contextmenu', handleContextMenu)

    // 4. Block DevTools & Source Inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        e.stopPropagation()
        runCleanBanner()
        return false
      }

      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Picker)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault()
        e.stopPropagation()
        runCleanBanner()
        return false
      }

      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Ctrl+S / Cmd+S (Save Page HTML)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      console.log = originalLog
      console.info = originalInfo
      console.debug = originalDebug
      console.warn = originalWarn
      document.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  return null
}
