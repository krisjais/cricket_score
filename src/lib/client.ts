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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

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
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
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
function subscribeHash(onChange: () => void): () => void {
  const listener = () => {
    window.scrollTo({ top: 0 })
    onChange()
  }
  window.addEventListener('hashchange', listener)
  window.addEventListener('popstate', listener)
  return () => {
    window.removeEventListener('hashchange', listener)
    window.removeEventListener('popstate', listener)
  }
}

export function useHashRoute(): [HashRoute, (to: string) => void] {
  const route = useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot)
  const navigate = useCallback((to: string) => {
    const clean = to.startsWith('/') ? to : `/${to}`
    if (window.location.pathname !== '/' && typeof window.history?.replaceState === 'function') {
      window.history.replaceState(null, '', `/#${clean}`)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      return
    }
    window.location.hash = clean
  }, [])
  return [route, navigate]
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------

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

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ isAdmin: boolean; username: string | null }>('/api/auth/me')
      if (mounted.current) setSession({ isAdmin: me.isAdmin, username: me.username })
    } catch {
      if (mounted.current) setSession({ isAdmin: false, username: null })
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current) void refresh()
    })
    return () => {
      mounted.current = false
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
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export function usePlayerSession(): PlayerSession {
  const [state, setState] = useState<Omit<PlayerSession, 'loading' | 'refresh' | 'logout'>>({
    isAuthenticated: false,
    user: null,
    player: null,
    currentMembership: null,
  })
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      type PlayerMePayload = {
        isAuthenticated: boolean
        user: PlayerSessionUser | null
        player: PlayerSessionProfile | null
        currentMembership: PlayerSession['currentMembership']
      }
      let me = await api<PlayerMePayload>('/api/player-auth/me')
      if (!me.isAuthenticated) {
        try {
          await api('/api/player-auth/refresh', { method: 'POST' })
          me = await api<PlayerMePayload>('/api/player-auth/me')
        } catch {
          // No valid refresh cookie; remain signed out
        }
      }
      if (mounted.current) {
        setState({
          isAuthenticated: Boolean(me.isAuthenticated),
          user: me.user,
          player: me.player,
          currentMembership: me.currentMembership ?? null,
        })
      }
    } catch {
      if (mounted.current) {
        setState({ isAuthenticated: false, user: null, player: null, currentMembership: null })
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
    return () => {
      mounted.current = false
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
