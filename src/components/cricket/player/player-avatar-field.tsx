'use client'

import { useId, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export async function readAvatarAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP, or GIF).')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Profile photo must be smaller than 5 MB.')
  }

  // Keep small GIFs intact; downscale large raster photos smoothly to keep payload compact
  if (file.type !== 'image/gif' && typeof document !== 'undefined') {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Could not decode selected image.'))
        el.src = objectUrl
      })
      const maxDim = 400
      const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim))
      const targetW = Math.max(1, Math.round((img.width || maxDim) * scale))
      const targetH = Math.max(1, Math.round((img.height || maxDim) * scale))
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH)
        const mime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'
        const encoded = canvas.toDataURL(mime, 0.85)
        if (encoded.startsWith('data:image/')) {
          return encoded
        }
      }
    } catch {
      // Fall through to FileReader below if canvas decode fails
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
        resolve(reader.result)
      } else {
        reject(new Error('Could not read the selected image file.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the selected image file.'))
    reader.readAsDataURL(file)
  })
}

const DEFAULT_INPUT_CLASS =
  'validated-field w-full min-h-11 rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2 text-base sm:text-sm text-[#111827] placeholder:text-gray-400 shadow-2xs transition-colors focus:border-[#7A1426] focus:ring-2 focus:ring-[#7A1426]/15 focus-visible:outline-2 focus-visible:outline-[#7A1426] focus:outline-none'

export function PlayerAvatarField({
  id,
  label = 'Profile Photo (optional)',
  value,
  onChange,
  onError,
  playerName,
  showPreviewEmpty = false,
  layout = 'inline',
  inputClassName = DEFAULT_INPUT_CLASS,
  uploadButtonHeightClass = 'min-h-11',
}: {
  id: string
  label?: string
  value: string
  onChange: (nextValue: string) => void
  onError?: (message: string | null) => void
  playerName?: string
  showPreviewEmpty?: boolean
  layout?: 'inline' | 'stacked'
  inputClassName?: string
  uploadButtonHeightClass?: string
}) {
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()

  const trimmed = value.trim()
  const isUploadedDataUrl = trimmed.startsWith('data:image/')
  const hasPreview = Boolean(trimmed)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onError?.(null)
    setProcessing(true)
    try {
      const dataUrl = await readAvatarAsDataUrl(file)
      onChange(dataUrl)
      setUploadedName(file.name)
      toast.success('Profile photo attached')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile photo'
      onError?.(msg)
      toast.error(msg)
      e.target.value = ''
    } finally {
      setProcessing(false)
    }
  }

  function clearPhoto() {
    onChange('')
    setUploadedName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const initials = (playerName?.trim() || 'PL').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#111827]">
        {label}
      </label>
      <p id={hintId} className="text-[11px] text-gray-500">
        Upload a PNG, JPG, WebP, or GIF image (max 5 MB) or paste an HTTPS image URL.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose profile photo file"
      />

      {isUploadedDataUrl ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={trimmed}
              alt="Profile photo preview"
              className="w-10 h-10 rounded-lg object-cover border border-[#E5E7EB] bg-[#F9FAFB] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] truncate">
                {uploadedName || 'Uploaded photo'}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">Ready to save</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-9 rounded-lg border-[#7A1426]/30 bg-white px-2.5 text-xs font-bold text-[#7A1426] hover:bg-[#7A1426]/5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Change
            </Button>
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Remove profile photo"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-gray-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : layout === 'stacked' ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            {(hasPreview || showPreviewEmpty) && (
              <div className="w-12 h-12 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden shrink-0">
                {hasPreview ? (
                  <img src={trimmed} alt="Current profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-extrabold text-[#7A1426]">{initials}</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-10 rounded-lg border-[#7A1426]/30 bg-white px-3 text-xs font-bold text-[#7A1426] hover:bg-[#7A1426]/5 cursor-pointer"
              >
                {processing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                )}
                {processing ? 'Loading...' : hasPreview ? 'Upload New Photo' : 'Upload Photo'}
              </Button>
              {hasPreview && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>

          <input
            id={id}
            name="avatarUrl"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={hintId}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setUploadedName(null)
            }}
            placeholder="Or paste HTTPS image URL..."
            className={inputClassName}
          />
        </div>
      ) : (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {(hasPreview || showPreviewEmpty) && (
            <div className="w-11 h-11 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden shrink-0">
              {hasPreview ? (
                <img src={trimmed} alt="Current profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-extrabold text-[#7A1426]">{initials}</span>
              )}
            </div>
          )}

          <input
            id={id}
            name="avatarUrl"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={hintId}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setUploadedName(null)
            }}
            placeholder="https://... or click Upload"
            className={`${inputClassName} flex-1 min-w-[180px]`}
          />

          <Button
            type="button"
            variant="outline"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
            className={`${uploadButtonHeightClass} shrink-0 rounded-lg border-[#7A1426]/30 bg-white px-3.5 text-xs font-bold text-[#7A1426] hover:bg-[#7A1426]/5 cursor-pointer`}
          >
            {processing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            )}
            {processing ? 'Loading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  )
}

