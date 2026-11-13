// ============================================================================
// Nexcore Premier League (NPL) - Standard Web Push Service Worker
// Standard Web Push API only (zero native mobile SDKs or third-party wrappers)
// ============================================================================

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle incoming Web Push notification event
self.addEventListener('push', (event) => {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: 'Nexcore Premier League',
        body: event.data.text() || 'New announcement published',
      }
    }
  } else {
    data = {
      title: 'Nexcore Premier League',
      body: 'New team announcement published',
    }
  }

  const title = data.title || 'NPL Team Announcement'
  const isUrgent = data.priority === 'URGENT'

  const options = {
    body: data.body || data.content || 'Your team captain has posted an update.',
    icon: '/apl-icon-s9.png',
    badge: '/apl-icon-s9.png',
    tag: data.tag || `npl-announcement-${data.announcementId || Date.now()}`,
    data: {
      url: data.url || '/player/dashboard?tab=notifications',
      announcementId: data.announcementId || null,
      priority: data.priority || 'NORMAL',
    },
    requireInteraction: isUrgent,
    vibrate: isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
    actions: [
      {
        action: 'open-announcement',
        title: 'View Details',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click and navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = event.notification.data?.url || '/player/dashboard?tab=notifications'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Look for an existing open window matching origin
        for (const client of clientList) {
          if ('focus' in client) {
            if (client.url.includes(targetUrl) || client.url.includes('/player/dashboard')) {
              client.navigate(targetUrl)
              return client.focus()
            }
          }
        }
        // If an open window of our origin exists, focus and navigate it
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// Handle subscription changes when push service rotates keys
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((newSub) => {
        return fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newSub),
        })
      })
      .catch((err) => {
        console.warn('[SW] pushsubscriptionchange resubscribe failed:', err)
      })
  )
})

