// ============================================================================
// Alliance Premier League - Web Push Client Helper
// Standard Web Push API only (zero native mobile SDKs)
// ============================================================================

import { api } from './client'

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  } catch (err) {
    console.warn('[WebPush] Service worker registration failed:', err)
    return null
  }
}

export async function subscribeToWebPush(): Promise<{ success: boolean; error?: string }> {
  if (!isWebPushSupported()) {
    return {
      success: false,
      error: 'Browser push notifications are not supported in this browser.',
    }
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied'
          ? 'Notification permission was denied. You can enable it in your browser settings.'
          : 'Notification permission request was dismissed.',
      }
    }

    const registration = await registerServiceWorker()
    if (!registration) {
      return { success: false, error: 'Could not register service worker.' }
    }

    // Fetch VAPID public key from backend
    const keyRes = await api<{ publicKey: string }>('/api/notifications/push/public-key')
    const vapidPublicKey = keyRes?.publicKey

    if (!vapidPublicKey) {
      return { success: false, error: 'Server did not return a valid push key.' }
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

    // Check existing or create new subscription
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      })
    }

    const subJson = subscription.toJSON()

    // Send subscription payload to backend
    await api('/api/notifications/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subJson.keys,
        deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 180)}` : 'Browser',
      }),
    })

    return { success: true }
  } catch (err: any) {
    console.error('[WebPush] Subscribe error:', err)
    return { success: false, error: err?.message || 'Failed to enable browser notifications.' }
  }
}

export async function unsubscribeFromWebPush(): Promise<{ success: boolean; error?: string }> {
  if (!isWebPushSupported()) return { success: true }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      // Notify backend
      try {
        await api('/api/notifications/push/unsubscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      } catch (err) {
        console.warn('[WebPush] Backend unsubscribe request error:', err)
      }

      await subscription.unsubscribe()
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to unsubscribe.' }
  }
}

export async function checkHasActivePushSubscription(): Promise<boolean> {
  if (!isWebPushSupported()) return false
  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration) return false
    const sub = await registration.pushManager.getSubscription()
    return Boolean(sub)
  } catch {
    return false
  }
}

