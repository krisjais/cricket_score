'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Megaphone,
  Mail,
  Smartphone,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, fmtDate } from '@/lib/client'
import type { PlayerSession } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  isWebPushSupported,
  getPushPermissionState,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  checkHasActivePushSubscription,
} from '@/lib/web-push'
import type { InAppNotificationDto, NotificationPreferencesDto } from './player-types'
import { cn } from '@/lib/utils'

interface PlayerNotificationsPageProps {
  playerSession: PlayerSession
  navigate: (to: string) => void
}

export function PlayerNotificationsPage({ playerSession, navigate }: PlayerNotificationsPageProps) {
  const [notifications, setNotifications] = useState<InAppNotificationDto[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Preferences & Push state
  const [preferences, setPreferences] = useState<NotificationPreferencesDto | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [hasPushSub, setHasPushSub] = useState(false)
  const [subscribingPush, setSubscribingPush] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  // Detect push capability on mount
  useEffect(() => {
    const supported = isWebPushSupported()
    setPushSupported(supported)
    if (supported) {
      checkHasActivePushSubscription().then(setHasPushSub)
    }
  }, [])

  // Fetch notifications with active filters
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'all') query.set('status', statusFilter)
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter)

      const res = await api<{ notifications: InAppNotificationDto[]; unreadCount: number }>(
        `/api/notifications?${query.toString()}`
      )
      if (res?.notifications) {
        setNotifications(res.notifications)
        setUnreadCount(res.unreadCount ?? 0)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter])

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api<{ preferences: NotificationPreferencesDto; activePushDevicesCount: number }>(
        '/api/notifications/preferences'
      )
      if (res?.preferences) {
        setPreferences(res.preferences)
      }
    } catch {
      // Quiet fail
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()
    void fetchPreferences()
  }, [fetchNotifications, fetchPreferences])

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
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
      toast.error('Failed to update notification')
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  // Handle Push Enable
  const handleEnablePush = async () => {
    setSubscribingPush(true)
    try {
      const res = await subscribeToWebPush()
      if (res.success) {
        setHasPushSub(true)
        toast.success('Browser push notifications enabled!')
        void fetchPreferences()
      } else {
        toast.error(res.error || 'Failed to enable browser notifications')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error subscribing to push notifications')
    } finally {
      setSubscribingPush(false)
    }
  }

  // Handle Push Disable
  const handleDisablePush = async () => {
    setSubscribingPush(true)
    try {
      const res = await unsubscribeFromWebPush()
      if (res.success) {
        setHasPushSub(false)
        toast.info('Browser push notifications disabled for this device')
        void fetchPreferences()
      } else {
        toast.error(res.error || 'Failed to disable push')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error unsubscribing')
    } finally {
      setSubscribingPush(false)
    }
  }

  // Save Preferences
  const handleSavePreferences = async () => {
    if (!preferences) return
    setSavingPrefs(true)
    try {
      await api('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      })
      toast.success('Notification preferences updated')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[#7A1426]/10 p-2 text-[#7A1426]">
              <BellRing className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-[#111827]">
              Notification Center
            </h1>
          </div>
          <p className="text-xs text-gray-600">
            Official announcements, practice schedules, match alerts, and notices from your team captain.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreferences((v) => !v)}
            className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-gray-500" />
            <span>{showPreferences ? 'Hide Preferences' : 'Notification Preferences'}</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              type="button"
              onClick={handleMarkAllAsRead}
              className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read ({unreadCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Voluntary Web Push Banner (if supported and not yet subscribed) */}
      {pushSupported && !hasPushSub && (
        <Card className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-100 p-2 text-blue-700 shrink-0">
                <Smartphone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-blue-950">
                  Enable Instant Browser Push Notifications
                </h3>
                <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
                  Receive real-time match reminders, practice schedules, and urgent alerts straight in your browser even when this tab is closed.
                </p>
                {isIOS && (
                  <p className="text-[11px] text-blue-700/80 mt-1 italic">
                    Note for iOS: Tap Safari Share &rarr; "Add to Home Screen" to enable browser push on iPhone / iPad.
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleEnablePush}
              disabled={subscribingPush}
              className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
            >
              {subscribingPush ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  <span>Enable Push on this Device</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Preferences Panel (Collapsible) */}
      {showPreferences && preferences && (
        <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#7A1426]" />
              <CardTitle className="text-sm font-black text-[#111827]">
                Notification Delivery Channels & Categories
              </CardTitle>
            </div>
            <span className="text-[11px] text-gray-500">
              Customize how and when you receive team announcements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Channels */}
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Delivery Channels
              </h4>

              {/* Email */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#7A1426]" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">Email Notifications</div>
                    <div className="text-[10px] text-gray-500">
                      Deliver formatted announcement emails via Resend
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, emailEnabled: e.target.checked })
                  }
                  className="rounded text-[#7A1426] focus:ring-[#7A1426] h-4 w-4"
                />
              </label>

              {/* Web Push */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">Browser Push Notifications</div>
                    <div className="text-[10px] text-gray-500">
                      Standard Web Push API on subscribed browsers
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, pushEnabled: e.target.checked })
                  }
                  className="rounded text-[#7A1426] focus:ring-[#7A1426] h-4 w-4"
                />
              </label>

              {/* Push Device Status */}
              {pushSupported && (
                <div className="flex items-center justify-between text-[11px] px-1 pt-1">
                  <span className="text-gray-500">
                    Device Push Status:{' '}
                    <strong className={hasPushSub ? 'text-emerald-700' : 'text-amber-700'}>
                      {hasPushSub ? 'Subscribed & Active' : 'Not Subscribed'}
                    </strong>
                  </span>
                  {hasPushSub ? (
                    <button
                      type="button"
                      onClick={handleDisablePush}
                      disabled={subscribingPush}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Disable this device
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={subscribingPush}
                      className="text-xs text-blue-700 hover:underline font-bold"
                    >
                      Enable on this device
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category Preferences */}
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Announcement Categories
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'GENERAL', label: 'General Notices' },
                  { key: 'PRACTICE', label: 'Practice Schedules' },
                  { key: 'MATCH_REMINDER', label: 'Match Reminders' },
                  { key: 'MEETING', label: 'Team Meetings' },
                  { key: 'UPDATE', label: 'Important Updates' },
                  { key: 'TOURNAMENT', label: 'Tournament Info' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={(preferences.categoryPreferences as any)[key] ?? true}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          categoryPreferences: {
                            ...preferences.categoryPreferences,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#7A1426] focus:ring-[#7A1426] h-3.5 w-3.5"
                    />
                    <span className="font-semibold text-gray-800 text-[11px] truncate">
                      {label}
                    </span>
                  </label>
                ))}

                <label className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/80 border border-rose-200 text-xs col-span-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="rounded text-rose-600 h-3.5 w-3.5"
                  />
                  <span className="font-bold text-rose-800 text-[11px]">
                    Emergency Notices (Always delivered)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {savingPrefs ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All Notifications' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'read', label: 'Read' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key as any)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer',
                statusFilter === key
                  ? 'bg-[#7A1426] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7A1426]"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL">General Notice</option>
            <option value="PRACTICE">Practice Schedule</option>
            <option value="MATCH_REMINDER">Match Reminder</option>
            <option value="MEETING">Team Meeting</option>
            <option value="UPDATE">Important Update</option>
            <option value="TOURNAMENT">Tournament Information</option>
            <option value="EMERGENCY">Emergency Notice</option>
          </select>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#7A1426] mb-2" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
            <Bell className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No notifications found</h3>
            <p className="text-gray-500 mt-1">
              {statusFilter === 'unread'
                ? 'You have caught up with all team announcements!'
                : 'No announcements match the selected filter.'}
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const teamName =
              typeof item.teamId === 'object' && item.teamId?.name
                ? item.teamId.name
                : 'Assigned Team'
            const isUrgent = item.priority === 'URGENT'

            return (
              <Card
                key={item.id}
                className={cn(
                  'rounded-3xl border transition-all shadow-2xs overflow-hidden',
                  !item.isRead
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/10'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar: Team, Priority, Category, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority pill */}
                      {isUrgent ? (
                        <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          Urgent Notice
                        </span>
                      ) : item.priority === 'IMPORTANT' ? (
                        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          Important
                        </span>
                      ) : null}

                      {/* Category */}
                      <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                        {item.category.replace(/_/g, ' ')}
                      </span>

                      {/* Team badge */}
                      <span className="rounded-full bg-[#7A1426]/10 px-2.5 py-0.5 text-[10px] font-extrabold text-[#7A1426]">
                        {teamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">
                        {fmtDate(item.createdAt)}
                      </span>
                      {!item.isRead && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(item.id)}
                          className="h-7 px-2 text-xs font-bold text-[#7A1426] hover:bg-amber-100/60 rounded-lg cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Mark Read</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Announcement Title */}
                  <h3
                    className={cn(
                      'text-base font-black',
                      !item.isRead ? 'text-[#111827]' : 'text-gray-800'
                    )}
                  >
                    {item.title}
                  </h3>

                  {/* Announcement Content */}
                  <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {item.content}
                  </div>

                  {/* Event Details Card (if present) */}
                  {(item.eventDate || item.eventTime || item.location) && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {item.eventDate && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-[#7A1426] shrink-0" />
                          <div>
                            <div className="text-[10px] font-bold uppercase text-gray-500">Date</div>
                            <div className="font-extrabold">
                              {new Date(item.eventDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {item.eventTime && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <div className="text-[10px] font-bold uppercase text-gray-500">Time</div>
                            <div className="font-extrabold">{item.eventTime}</div>
                          </div>
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-[10px] font-bold uppercase text-gray-500">Location</div>
                            <div className="font-extrabold">{item.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachment if present */}
                  {item.attachmentUrl && (
                    <div className="pt-1">
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A1426] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Attachment</span>
                      </a>
                    </div>
                  )}

                  {/* Footer Captain Attribution */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>
                      Published by Captain: <strong className="text-gray-700">{item.captainName}</strong>
                    </span>
                    {item.isRead && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

