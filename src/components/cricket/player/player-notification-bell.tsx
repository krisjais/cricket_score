'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, getSocket } from '@/lib/client'
import type { PlayerSession } from '@/lib/client'
import type { InAppNotificationDto } from './player-types'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  playerSession: PlayerSession
  navigate: (to: string) => void
}

export function PlayerNotificationBell({ playerSession, navigate }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<InAppNotificationDto[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const playerId = playerSession.player?.id

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!playerId) return
    try {
      const res = await api<{ unreadCount: number }>('/api/notifications/unread-count')
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      }
    } catch {
      // Quiet fail if network offline
    }
  }, [playerId])

  // Fetch latest notifications when dropdown opens
  const fetchRecentNotifications = useCallback(async () => {
    if (!playerId) return
    setLoading(true)
    try {
      const res = await api<{ notifications: InAppNotificationDto[]; unreadCount: number }>(
        '/api/notifications?limit=6'
      )
      if (res?.notifications) {
        setNotifications(res.notifications)
        setUnreadCount(res.unreadCount ?? 0)
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false)
    }
  }, [playerId])

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const res = await api<{ unreadCount: number }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      } else {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch {
      // Quiet fail
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  // Setup Socket.IO real-time delivery
  useEffect(() => {
    if (!playerId) return

    void fetchUnreadCount()

    const socket = getSocket()
    const handleConnect = () => {
      socket.emit('subscribe:player', playerId)
    }

    if (socket.connected) {
      handleConnect()
    }
    socket.on('connect', handleConnect)

    const handleNewNotification = (data: { notification?: InAppNotificationDto; announcement?: any }) => {
      setUnreadCount((c) => c + 1)
      if (data?.notification) {
        setNotifications((prev) => [data.notification!, ...prev.slice(0, 9)])
      }
      const title = data.announcement?.title || data.notification?.title || 'New Announcement'
      toast.info(`Team Notice: ${title}`, {
        description: 'New update from your team captain.',
        action: {
          label: 'View',
          onClick: () => navigate('/player/dashboard?tab=notifications'),
        },
      })
    }

    socket.on('notification:new', handleNewNotification)

    return () => {
      socket.emit('unsubscribe:player', playerId)
      socket.off('connect', handleConnect)
      socket.off('notification:new', handleNewNotification)
    }
  }, [playerId, fetchUnreadCount, navigate])

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleDropdown = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      void fetchRecentNotifications()
    }
  }

  const handleNotificationClick = (item: InAppNotificationDto) => {
    if (!item.isRead) {
      void handleMarkAsRead(item.id)
    }
    setIsOpen(false)
    navigate('/player/dashboard?tab=notifications')
  }

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ')
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'relative p-2 rounded-full border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1426]',
          unreadCount > 0
            ? 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#7A1426]" />
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Team Announcements
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-[#7A1426] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2 opacity-50" />
                <p className="font-semibold text-gray-700">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Announcements from your team captain will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const teamName =
                  typeof item.teamId === 'object' && item.teamId?.name
                    ? item.teamId.name
                    : 'Your Team'
                const isUrgent = item.priority === 'URGENT'

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      'p-3.5 hover:bg-gray-50/90 transition-colors cursor-pointer relative group flex gap-3',
                      !item.isRead ? 'bg-amber-50/30' : 'bg-white'
                    )}
                  >
                    {/* Unread dot */}
                    <div className="pt-1 shrink-0">
                      {!item.isRead ? (
                        <div className="w-2 h-2 rounded-full bg-[#7A1426] ring-2 ring-[#7A1426]/20" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500 truncate">
                          {teamName}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <h4
                          className={cn(
                            'text-xs line-clamp-1',
                            !item.isRead
                              ? 'font-black text-[#111827]'
                              : 'font-semibold text-gray-800'
                          )}
                        >
                          {item.title}
                        </h4>
                        {isUrgent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            Urgent
                          </span>
                        )}
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          {formatCategory(item.category)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Event metadata pill if present */}
                      {(item.eventDate || item.location) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          {item.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#7A1426]" />
                              {new Date(item.eventDate).toLocaleDateString()}
                              {item.eventTime ? ` at ${item.eventTime}` : ''}
                            </span>
                          )}
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mark read button on hover */}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        title="Mark as read"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-[#7A1426] self-start"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer: View All link */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/player/dashboard?tab=notifications')
              }}
              className="text-xs font-bold text-[#7A1426] hover:text-[#5E0E1D] flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

