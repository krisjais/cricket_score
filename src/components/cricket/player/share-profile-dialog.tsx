'use client'

import { useState } from 'react'
import { Check, Copy, Mail, MessageCircle, MessageSquare, Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

async function copyTextSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback below
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function ShareProfileDialog({
  open,
  onOpenChange,
  playerName,
  profileSlug,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerName: string
  profileSlug: string
}) {
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/players/${encodeURIComponent(profileSlug)}`
  const shareTitle = `${playerName} — Nexcore Premier League Profile`
  const shareText = `Check out ${playerName}'s career stats and cricket profile on Nexcore Premier League:`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleCopy = async () => {
    const ok = await copyTextSafe(shareUrl)
    if (ok) {
      setCopied(true)
      toast.success('Profile link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Please select and copy the link manually')
    }
  }

  const handleNativeShare = async () => {
    if (!canNativeShare) return
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        void handleCopy()
      }
    }
  }

  const fullMessage = `${shareText} ${shareUrl}`
  const channels = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
      icon: MessageCircle,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
    {
      label: 'Messages / SMS',
      href: `sms:?body=${encodeURIComponent(fullMessage)}`,
      icon: MessageSquare,
      className: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullMessage)}`,
      icon: Mail,
      className: 'bg-rose-50 text-[#7A1426] border-rose-200 hover:bg-rose-100',
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: Send,
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#7A1426]" />
            <span>Share Player Profile</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Copy {playerName}&apos;s public profile link or share directly with your contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="share-profile-url" className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Public Profile Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="share-profile-url"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="rounded-xl border-gray-200 bg-gray-50 text-xs font-mono text-[#111827]"
              />
              <Button
                type="button"
                onClick={() => void handleCopy()}
                className="shrink-0 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white text-xs font-bold px-3.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {canNativeShare && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleNativeShare()}
              className="w-full rounded-xl border-gray-200 hover:bg-gray-50 text-xs font-bold text-[#111827] cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-[#7A1426]" />
              Share via Device Contacts &amp; Apps
            </Button>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Quick Share to Contacts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {channels.map((ch) => {
                const Icon = ch.icon
                return (
                  <a
                    key={ch.label}
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${ch.className}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{ch.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
