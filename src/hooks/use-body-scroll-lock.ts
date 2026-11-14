'use client'

import { useEffect, useRef } from 'react'

let lockCount = 0
let previousBodyStyles = {
  position: '',
  top: '',
  left: '',
  right: '',
  width: '',
  overflow: '',
  paddingRight: '',
}
let previousHtmlOverflow = ''
let scrollPosition = 0

/**
 * Custom hook to lock body scrolling across all browsers, especially iOS Safari.
 * Uses `position: fixed` with top scroll offset to guarantee 0 scroll bleeding on mobile.
 * Reference-counted so overlapping modals/drawers don't prematurely unlock the scroll.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof window === 'undefined') return

    if (lockCount === 0) {
      // Capture current scroll position
      scrollPosition =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0

      // Calculate scrollbar width to prevent horizontal layout shift on desktop
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // Save previous inline styles
      previousBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      }
      previousHtmlOverflow = document.documentElement.style.overflow

      // Apply locks
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPosition}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    lockCount++

    return () => {
      lockCount--

      if (lockCount <= 0) {
        lockCount = 0
        const storedTop = document.body.style.top
        const restoreY = storedTop ? Math.abs(parseInt(storedTop, 10)) : scrollPosition

        // Restore body styles
        document.body.style.position = previousBodyStyles.position
        document.body.style.top = previousBodyStyles.top
        document.body.style.left = previousBodyStyles.left
        document.body.style.right = previousBodyStyles.right
        document.body.style.width = previousBodyStyles.width
        document.body.style.overflow = previousBodyStyles.overflow
        document.body.style.paddingRight = previousBodyStyles.paddingRight

        // Restore html overflow
        document.documentElement.style.overflow = previousHtmlOverflow

        // Restore exact scroll position
        window.scrollTo(0, restoreY)
      }
    }
  }, [isLocked])
}

/**
 * Ref callback to attach a non-passive touchmove event listener that stops
 * background dragging / rubber-banding on iOS mobile backdrops.
 */
export function usePreventTouchMove<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default touch movement on this backdrop
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return ref
}
