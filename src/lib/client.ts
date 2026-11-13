'use client'

/**
 * Client-side data layer: fetch helper, Socket.IO singleton and hooks
 * for hash routing, live match updates and admin session.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { MatchStatePayload, MatchSummary } from '@/lib/match-state'

export type { MatchStatePayload, MatchSummary }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  API_BASE ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
).replace(/\/+$/, '')

const ADMIN_UNAUTH_EVENT = 'npl:admin-unauth'

let silentRefreshPromise: Promise<boolean> | null = null

async function silentPlayerRefresh(): Promise<boolean> {
  if (silentRefreshPromise) return silentRefreshPromise

  silentRefreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/player-auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      return Boolean(res.ok && data?.ok && data?.data?.refreshed)
    } catch {
      return false
    } finally {
      silentRefreshPromise = null
    }
  })()

  return silentRefreshPromise
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const res = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string } | null
  if (!res.ok || !data?.ok) {
    const isRetry = Boolean((init?.headers as Record<string, string> | undefined)?.['x-refresh-retry'])
    const isAuthRoute = path.includes('/player-auth/') || path.includes('/auth/')

    // If 401 on a non-auth route, attempt silent token refresh and retry
    if (res.status === 401 && !isRetry && !isAuthRoute) {
      const refreshed = await silentPlayerRefresh()
      if (refreshed) {
        return api<T>(path, {
          ...init,
          headers: {
            ...((init?.headers as Record<string, string>) ?? {}),
            'x-refresh-retry': '1',
          },
        })
      }
    }

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      (path.startsWith('/api/admin') || path.startsWith('/admin'))
    ) {
      window.dispatchEvent(new Event(ADMIN_UNAUTH_EVENT))
    }
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status)
  }
  return data.data as T
}

// ---------------------------------------------------------------------------
// Socket.IO singleton
// ---------------------------------------------------------------------------

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
    })
  }
  return socket
}

/** Subscribe to full-state pushes for one match. */
export function useMatchChannel(matchId: string, initial: MatchStatePayload | null) {
  const [state, setState] = useState<MatchStatePayload | null>(initial)
  const [connected, setConnected] = useState(false)
  const handler = useCallback((payload: MatchStatePayload | null) => {
    if (payload && payload.match?.id === matchId) setState(payload)
  }, [matchId])

  useEffect(() => {
    let alive = true
    api<MatchStatePayload>(`/api/matches/${matchId}`)
      .then((p) => alive && setState(p))
      .catch(() => alive && setState(null))
    const sock = getSocket()
    const onConnect = () => {
      setConnected(true)
      sock.emit('subscribe:match', matchId)
    }
    const onDisconnect = () => setConnected(false)
    const onDeleted = () => {
      api<MatchStatePayload>(`/api/matches/${matchId}`)
        .then((p) => alive && setState(p))
        .catch(() => alive && setState(null))
    }
    sock.on('connect', onConnect)
    sock.on('disconnect', onDisconnect)
    sock.on('match:update', handler)
    sock.on('match:deleted', onDeleted)
    if (sock.connected) {
      queueMicrotask(() => setConnected(true))
      sock.emit('subscribe:match', matchId)
    }
    return () => {
      alive = false
      sock.emit('unsubscribe:match', matchId)
      sock.off('connect', onConnect)
      sock.off('disconnect', onDisconnect)
      sock.off('match:update', handler)
      sock.off('match:deleted', onDeleted)
    }
  }, [matchId, handler])

  return { state, setLiveState: setState, connected }
}

/** Subscribe to the global matches feed. */
export function useMatchesFeed(initial: MatchSummary[] | null) {
  const [matches, setMatches] = useState<MatchSummary[]>(initial ?? [])
  const [loading, setLoading] = useState(initial === null)

  useEffect(() => {
    let alive = true
    const load = () =>
      api<MatchSummary[]>('/api/matches')
        .then((m) => alive && (setMatches(m), setLoading(false)))
        .catch(() => alive && setLoading(false))
    load()
    const sock = getSocket()
    const onConnect = () => sock.emit('subscribe:matches')
    const onUpdate = (list: MatchSummary[]) => {
      if (Array.isArray(list)) setMatches(list)
      else load()
    }
    sock.on('connect', onConnect)
    sock.on('matches:update', onUpdate)
    if (sock.connected) sock.emit('subscribe:matches')
    return () => {
      alive = false
      sock.off('connect', onConnect)
      sock.off('matches:update', onUpdate)
    }
  }, [])

  return { matches, loading }
}

// ---------------------------------------------------------------------------
// Hash routing (single-page app: every view lives under /)
// ---------------------------------------------------------------------------

export interface HashRoute {
  segments: string[]
  query: URLSearchParams
}

function parseHash(): HashRoute {
  const hashRaw = window.location.hash.replace(/^#\/?/, '')
  const raw =
    hashRaw ||
    `${window.location.pathname.replace(/^\/?/, '')}${window.location.search || ''}`
  const [pathPart, queryPart] = raw.split('?')
  return {
    segments: pathPart ? pathPart.split('/').filter(Boolean) : [],
    query: new URLSearchParams(queryPart ?? ''),
  }
}

let lastRawLocation: string | null = null
let lastRoute: HashRoute = { segments: [], query: new URLSearchParams() }
function getHashSnapshot(): HashRoute {
  const raw = `${window.location.hash}||${window.location.pathname}${window.location.search}`
  if (raw !== lastRawLocation) {
    lastRawLocation = raw
    lastRoute = parseHash()
  }
  return lastRoute
}
const SERVER_ROUTE: HashRoute = { segments: [], query: new URLSearchParams() }
function getServerHashSnapshot(): HashRoute {
  return SERVER_ROUTE
}
const ROUTE_CHANGE_EVENT = 'npl:routechange'

function subscribeHash(onChange: () => void): () => void {
  const listener = () => {
    window.scrollTo({ top: 0 })
    onChange()
  }
  window.addEventListener('hashchange', listener)
  window.addEventListener('popstate', listener)
  window.addEventListener(ROUTE_CHANGE_EVENT, listener)
  return () => {
    window.removeEventListener('hashchange', listener)
    window.removeEventListener('popstate', listener)
    window.removeEventListener(ROUTE_CHANGE_EVENT, listener)
  }
}

export function useHashRoute(): [HashRoute, (to: string) => void] {
  const route = useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot)

  // Upgrade any legacy `#/...` URL to a clean path URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const clean = `/${window.location.hash.replace(/^#\/?/, '')}`
      if (typeof window.history?.replaceState === 'function') {
        window.history.replaceState(null, '', clean)
        window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
      }
    }
  }, [])

  const navigate = useCallback((to: string) => {
    const clean = to.startsWith('/') ? to : `/${to}`
    if (typeof window.history?.pushState === 'function') {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (current !== clean) {
        window.history.pushState(null, '', clean)
        window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
      } else {
        window.scrollTo({ top: 0 })
      }
      return
    }
    window.location.assign(clean)
  }, [])
  return [route, navigate]
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------

const AUTH_SYNC_EVENT = 'npl:auth-sync'

function notifyAuthSync(origin: 'admin' | 'player') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SYNC_EVENT, { detail: origin }))
  }
}

export interface AdminSession {
  isAdmin: boolean
  username: string | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<{ isAdmin: boolean; username: string | null }>({
    isAdmin: false,
    username: null,
  })
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const wasAdminRef = useRef<boolean | null>(null)

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ isAdmin: boolean; username: string | null }>('/api/auth/me')
      if (mounted.current) {
        const nextAdmin = Boolean(me.isAdmin)
        const prevAdmin = wasAdminRef.current
        wasAdminRef.current = nextAdmin
        setSession({ isAdmin: nextAdmin, username: me.username })
        if (prevAdmin !== null && prevAdmin !== nextAdmin && nextAdmin) {
          notifyAuthSync('admin')
        }
      }
    } catch {
      if (mounted.current) {
        wasAdminRef.current = false
        setSession({ isAdmin: false, username: null })
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current) void refresh()
    })
    const onAuthSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === 'player' && mounted.current) {
        void refresh()
      }
    }
    const onAdminUnauth = () => {
      if (mounted.current) {
        wasAdminRef.current = false
        setSession({ isAdmin: false, username: null })
      }
    }
    const onFocus = () => {
      if (mounted.current) void refresh()
    }
    window.addEventListener(AUTH_SYNC_EVENT, onAuthSync)
    window.addEventListener(ADMIN_UNAUTH_EVENT, onAdminUnauth)
    window.addEventListener('focus', onFocus)
    return () => {
      mounted.current = false
      window.removeEventListener(AUTH_SYNC_EVENT, onAuthSync)
      window.removeEventListener(ADMIN_UNAUTH_EVENT, onAdminUnauth)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    await refresh()
  }, [refresh])

  return { ...session, loading, refresh, logout }
}

// ---------------------------------------------------------------------------
// Player session
// ---------------------------------------------------------------------------

export interface PlayerSessionUser {
  id: string
  name: string
  email: string | null
  mobile: string | null
  role: string
  emailVerified: boolean
  mobileVerified: boolean
  playerId: string | null
}

export interface PlayerSessionProfile {
  id: string
  playerCode: string | null
  name: string
  role: string
  avatarUrl: string | null
  isVerified: boolean
}

export interface PlayerSession {
  isAuthenticated: boolean
  user: PlayerSessionUser | null
  player: PlayerSessionProfile | null
  currentMembership: {
    id: string
    team?: { id: string; name: string; shortName: string; color: string; logoUrl?: string | null } | null
    season?: { id: string; name: string; year: number; status: string } | null
  } | null
  activeCaptaincy?: {
    isCaptain: boolean
    assignmentId?: string
    playerId?: string
    teamId?: string
    seasonId?: string
    assignedAt?: string
    team?: { id: string; name: string; shortName: string; color: string; logoUrl?: string | null } | null
    season?: { id: string; name: string; code: string; year: number; status: string } | null
  } | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

let playerRefreshInFlight: Promise<void> | null = null

export function usePlayerSession(): PlayerSession {
  const [state, setState] = useState<Omit<PlayerSession, 'loading' | 'refresh' | 'logout'>>({
    isAuthenticated: false,
    user: null,
    player: null,
    currentMembership: null,
    activeCaptaincy: null,
  })
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const wasAuthedRef = useRef<boolean | null>(null)

  const refresh = useCallback(async () => {
    if (playerRefreshInFlight) {
      await playerRefreshInFlight
      return
    }

    const run = async () => {
      try {
        type PlayerMePayload = {
          isAuthenticated: boolean
          user: PlayerSessionUser | null
          player: PlayerSessionProfile | null
          currentMembership: PlayerSession['currentMembership']
          activeCaptaincy?: PlayerSession['activeCaptaincy']
        }
        let me = await api<PlayerMePayload>('/api/player-auth/me')
        const onAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
        if (!me.isAuthenticated && !onAdminPage) {
          try {
            const refRes = await api<{ refreshed?: boolean }>('/api/player-auth/refresh', { method: 'POST' })
            if (refRes?.refreshed) {
              me = await api<PlayerMePayload>('/api/player-auth/me')
            }
          } catch {
            // No valid refresh cookie; remain signed out
          }
        }
        if (mounted.current) {
          const nextAuthed = Boolean(me.isAuthenticated)
          const prevAuthed = wasAuthedRef.current
          wasAuthedRef.current = nextAuthed
          setState({
            isAuthenticated: nextAuthed,
            user: me.user,
            player: me.player,
            currentMembership: me.currentMembership ?? null,
            activeCaptaincy: me.activeCaptaincy ?? null,
          })
          if (prevAuthed !== null && prevAuthed !== nextAuthed && nextAuthed) {
            notifyAuthSync('player')
          }
        }
      } catch {
        if (mounted.current) {
          wasAuthedRef.current = false
          setState({ isAuthenticated: false, user: null, player: null, currentMembership: null, activeCaptaincy: null })
        }
      } finally {
        if (mounted.current) setLoading(false)
      }
    }

    playerRefreshInFlight = run().finally(() => {
      playerRefreshInFlight = null
    })
    await playerRefreshInFlight
  }, [])

  useEffect(() => {
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current) void refresh()
    })
    const onAuthSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === 'admin' && mounted.current) {
        void refresh()
      }
    }
    window.addEventListener(AUTH_SYNC_EVENT, onAuthSync)
    return () => {
      mounted.current = false
      window.removeEventListener(AUTH_SYNC_EVENT, onAuthSync)
    }
  }, [refresh])

  const logout = useCallback(async () => {
    await api('/api/player-auth/logout', { method: 'POST' })
    await refresh()
  }, [refresh])

  return { ...state, loading, refresh, logout }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Upcoming',
  TOSS_DONE: 'Toss done',
  LIVE: 'Live',
  PAUSED: 'Paused',
  INNINGS_BREAK: 'Innings break',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
}

export const FORMAT_LABEL: Record<string, string> = {
  T10: 'T10',
  T20: 'T20',
  ODI: 'ODI',
  CUSTOM: 'Custom',
}

export const ROLE_LABEL: Record<string, string> = {
  BATTER: 'Batter',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-rounder',
  WICKETKEEPER: 'Wicket-keeper',
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
