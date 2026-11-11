'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client'
import { AplLogo } from '@/components/cricket/apl-logo'
import { Button } from '@/components/ui/button'
import { PlayerAvatarField } from './player-avatar-field'

const AUTH_INPUT_CLASS =
  'validated-field w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300 focus:border-[#7A1426] focus:bg-white focus:ring-4 focus:ring-[#7A1426]/10 focus-visible:outline-2 focus-visible:outline-[#7A1426] focus:outline-none'

function PasswordInputField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  ariaDescribedBy,
  ariaInvalid = false,
  hintAbove,
  enterKeyHint = 'done',
  leadingIcon = false,
}: {
  id: string
  name: string
  label: ReactNode
  value: string
  onChange: (next: string) => void
  placeholder: string
  autoComplete: 'current-password' | 'new-password'
  required?: boolean
  minLength?: number
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  hintAbove?: ReactNode
  enterKeyHint?: 'done' | 'next'
  leadingIcon?: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)
  const warningId = useId()
  const hintId = useId()
  const describedBy = [ariaDescribedBy, hintAbove ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-[#111827]">
        {label}
      </label>
      {hintAbove && (
        <p id={hintId} className="text-[11px] text-gray-500">
          {hintAbove}
        </p>
      )}
      <div className="relative group">
        {leadingIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-[#7A1426]"
            aria-hidden="true"
          >
            <Lock className="w-4 h-4" />
          </span>
        )}
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          required={required}
          minLength={minLength}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ? 'true' : 'false'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`validated-field w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] ${
            leadingIcon ? 'pl-10' : 'pl-3.5'
          } pr-11 py-2.5 text-sm text-[#111827] placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300 focus:border-[#7A1426] focus:bg-white focus:ring-4 focus:ring-[#7A1426]/10 focus-visible:outline-2 focus-visible:outline-[#7A1426] focus:outline-none [&::-ms-reveal]:hidden`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-pressed={showPassword}
          aria-label="Show password"
          aria-describedby={warningId}
          className="absolute inset-y-0 right-0 flex items-center justify-center min-w-11 px-3 rounded-r-xl bg-transparent text-gray-500 hover:text-[#7A1426] hover:bg-[#7A1426]/6 focus-visible:outline-2 focus-visible:outline-[#7A1426] focus-visible:-outline-offset-2 transition-colors cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showPassword ? 'hide' : 'show'}
              initial={{ opacity: 0, scale: 0.78 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.78 }}
              transition={{ duration: 0.14 }}
              className="inline-flex items-center justify-center"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <span id={warningId} className="sr-only">
          Warning: this will display your password on the screen.
        </span>
      </div>
    </div>
  )
}

function BatsmanWatermark() {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none select-none w-36 h-36 xl:w-44 xl:h-44 text-white/[0.06]"
      aria-hidden="true"
    >
      {/* Helmet + visor */}
      <circle cx="62" cy="48" r="14" fill="currentColor" />
      <path d="M56 44H77" stroke="#0B0F1A" strokeWidth="3.5" strokeLinecap="round" />
      {/* Torso */}
      <path d="M52 67L71 67L75 104L49 104Z" fill="currentColor" />
      {/* Left & right legs */}
      <path d="M53 103L42 140" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      <path d="M69 103L83 140" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      {/* Arms & angled bat playing drive */}
      <path d="M70 73L94 98" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <path d="M90 94L126 134" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      {/* Pitch crease dots */}
      <circle cx="30" cy="154" r="2.2" fill="currentColor" />
      <circle cx="42" cy="156" r="2.2" fill="currentColor" />
      <circle cx="54" cy="157" r="2.2" fill="currentColor" />
      <circle cx="66" cy="157" r="2.2" fill="currentColor" />
      <circle cx="78" cy="156" r="2.2" fill="currentColor" />
      <circle cx="90" cy="155" r="2.2" fill="currentColor" />
      <circle cx="102" cy="153" r="2.2" fill="currentColor" />
    </svg>
  )
}

function AuthSplitLayout({
  activeTab,
  onTabChange,
  title,
  subtitle,
  showTabs = true,
  wide = false,
  navigate,
  children,
}: {
  activeTab: 'SIGN_IN' | 'REGISTER'
  onTabChange: (tab: 'SIGN_IN' | 'REGISTER') => void
  title: string
  subtitle: string
  showTabs?: boolean
  wide?: boolean
  navigate: (to: string) => void
  children: ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full relative flex flex-col lg:flex-row bg-gradient-to-br from-[#F8F9FA] via-[#F4F5F7] to-[#EAECEF] text-[#111827] overflow-x-hidden">
        {/* Desktop left diagonal Midnight Navy + Crimson showcase panel */}
        <aside className="hidden lg:flex lg:w-[44%] xl:w-[45%] relative shrink-0 select-none">
          {/* Outer slate bevel creating slanted seam depth */}
          <div
            className="absolute inset-0 bg-[#DFE2E8]/75"
            style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' }}
            aria-hidden="true"
          />

          {/* Signature Nexcore Crimson diagonal accent ribbon */}
          <div
            className="absolute inset-0 bg-[#7A1426]"
            style={{ clipPath: 'polygon(0 0, 96.8% 0, 84.3% 100%, 0 100%)' }}
            aria-hidden="true"
          />

          {/* Main Midnight Navy diagonal surface with subtle crimson stadium glow */}
          <div
            className="relative w-full h-full flex flex-col justify-between p-9 xl:p-12 overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 95.5% 0, 83% 100%, 0 100%)',
              background:
                'radial-gradient(circle at 38% 36%, #2D1120 0%, #141928 52%, #0B0F1A 100%)',
            }}
          >
            {/* Top-left subtle return link */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                <ArrowLeft
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Tournament Home
              </button>
            </div>

            {/* Center brand showcase */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center text-center pr-12 xl:pr-16 my-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-5"
              >
                <AplLogo size="2xl" variant="dark" priority alt="APL Season 9 Official Crest" />
              </motion.div>

              <p className="text-xs font-semibold tracking-[0.28em] uppercase text-slate-300/90">
                Welcome To
              </p>
              <h2 className="mt-2 font-serif text-4xl xl:text-[42px] font-bold tracking-tight text-white leading-[1.1]">
                Player Portal
              </h2>
              <p className="mt-2 font-serif text-xl xl:text-2xl font-semibold text-[#F5C451]">
                Nexcore Premier League
              </p>
              <p className="mt-4 max-w-[270px] text-xs sm:text-[13px] leading-relaxed text-slate-300/80">
                Sign in or register once for verified season squads, personalized match tracking, and lifetime career statistics.
              </p>
            </motion.div>

            {/* Bottom-left batsman watermark */}
            <div className="relative z-0 -mb-6 -ml-4 flex items-end justify-start">
              <BatsmanWatermark />
            </div>
          </div>
        </aside>

        {/* Mobile / tablet compact top Midnight Navy & Crimson header */}
        <header
          className="lg:hidden relative px-5 pt-4 pb-6 text-white overflow-hidden border-b-4 border-[#7A1426] shadow-md"
          style={{
            background: 'radial-gradient(circle at 25% 20%, #2D1120 0%, #141928 60%, #0B0F1A 100%)',
          }}
        >
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AplLogo size="md" variant="dark" priority alt="APL Season 9 Official Crest" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F5C451]">
                  Nexcore Premier League
                </p>
                <p className="font-serif text-lg font-bold text-white leading-tight">
                  Player Portal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.15] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Home
            </button>
          </div>
        </header>

        {/* Right cool portal canvas with centered white auth card */}
        <main
          id="main"
          className={`relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10 ${
            wide ? 'lg:py-8' : 'lg:py-12'
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full ${wide ? 'max-w-[640px]' : 'max-w-[440px]'}`}
          >
            <div className="rounded-[28px] bg-white border border-[#E5E7EB] shadow-[0_24px_60px_-15px_rgba(18,24,38,0.12),0_8px_24px_-8px_rgba(122,20,38,0.06)] p-6 sm:p-9">
              {/* Heading */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#111827] leading-tight">
                  {title}
                </h1>
                <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed">{subtitle}</p>
              </div>

              {/* Segmented Sign In / Create Account pill switcher */}
              {showTabs && (
                <div
                  role="tablist"
                  aria-label="Player portal authentication mode"
                  className="relative grid grid-cols-2 rounded-2xl bg-[#F3F4F6] p-1 mt-6 mb-6 border border-[#E5E7EB]"
                >
                  {(
                    [
                      { key: 'SIGN_IN', label: 'Sign In' },
                      { key: 'REGISTER', label: 'Create Account' },
                    ] as const
                  ).map((tab) => {
                    const isActive = activeTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onTabChange(tab.key)}
                        className={`relative z-10 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer ${
                          isActive ? 'text-white' : 'text-gray-600 hover:text-[#111827]'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="auth-portal-pill"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-xl bg-[#7A1426] shadow-sm -z-10"
                          />
                        )}
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {!showTabs && <div className="mt-5" />}

              {/* Active form body */}
              <div>{children}</div>

              {/* Bottom quick links matching reference card footer */}
              <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => navigate('/matches')}
                  className="group inline-flex items-center gap-1 text-[#7A1426] hover:text-[#5E0E1D] transition-colors cursor-pointer"
                >
                  Watch Cricket Live
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/leaderboards')}
                  className="group inline-flex items-center gap-1 text-[#111827] hover:text-[#7A1426] transition-colors cursor-pointer"
                >
                  Leaderboards
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  )
}

const ROLE_OPTIONS = [
  { value: 'BATTER', label: 'Batsman' },
  { value: 'BOWLER', label: 'Bowler' },
  { value: 'ALL_ROUNDER', label: 'All-Rounder' },
  { value: 'WICKETKEEPER', label: 'Wicketkeeper' },
]

const BATTING_OPTIONS = [
  { value: '', label: 'Select batting style (optional)' },
  { value: 'RIGHT_HAND', label: 'Right-hand bat' },
  { value: 'LEFT_HAND', label: 'Left-hand bat' },
]

const BOWLING_OPTIONS = [
  { value: '', label: 'Select bowling style (optional)' },
  { value: 'RIGHT_ARM_FAST', label: 'Right-arm fast' },
  { value: 'RIGHT_ARM_MEDIUM', label: 'Right-arm medium' },
  { value: 'RIGHT_ARM_OFF_SPIN', label: 'Right-arm off spin' },
  { value: 'RIGHT_ARM_LEG_SPIN', label: 'Right-arm leg spin' },
  { value: 'LEFT_ARM_FAST', label: 'Left-arm fast' },
  { value: 'LEFT_ARM_MEDIUM', label: 'Left-arm medium' },
  { value: 'LEFT_ARM_ORTHODOX', label: 'Left-arm orthodox' },
  { value: 'LEFT_ARM_CHINAMAN', label: 'Left-arm chinaman' },
  { value: 'NONE', label: 'Does not bowl' },
]

interface OtpSendResult {
  sent: boolean
  channel: 'EMAIL' | 'MOBILE'
  maskedTarget: string
  expiresInSeconds: number
  deliveryProvider?: 'resend' | 'webhook' | 'console'
  devOtp?: string
}

export function PlayerLoginPage({
  navigate,
  onAuthenticated,
  initialMode = 'SIGN_IN',
}: {
  navigate: (to: string) => void
  onAuthenticated: () => Promise<void>
  initialMode?: 'SIGN_IN' | 'FORGOT_PASSWORD'
}) {
  const [mode, setMode] = useState<'SIGN_IN' | 'FORGOT_PASSWORD'>(initialMode)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null)

  const [resetEmail, setResetEmail] = useState('')
  const [resetOtpCode, setResetOtpCode] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetOtpInfo, setResetOtpInfo] = useState<OtpSendResult | null>(null)
  const [sendingResetOtp, setSendingResetOtp] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null)

  const resetEmailRef = useRef<HTMLInputElement>(null)
  const resetOtpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'FORGOT_PASSWORD') {
      if (resetOtpInfo) {
        resetOtpRef.current?.focus()
      } else {
        resetEmailRef.current?.focus()
      }
    }
  }, [mode, resetOtpInfo])

  function openForgotPassword() {
    setErrorMsg(null)
    setResetSuccessMsg(null)
    setResetErrorMsg(null)
    setResetOtpInfo(null)
    setResetOtpCode('')
    setResetNewPassword('')
    if (identifier.includes('@') && !resetEmail) {
      setResetEmail(identifier.trim())
    }
    setMode('FORGOT_PASSWORD')
  }

  function backToSignIn() {
    setResetErrorMsg(null)
    setMode('SIGN_IN')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setResetSuccessMsg(null)
    setSubmitting(true)
    try {
      await api('/api/player-auth/login', {
        method: 'POST',
        json: { identifier: identifier.trim(), password },
      })
      await onAuthenticated()
      toast.success('Signed in to your player profile')
      navigate('/player/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function sendResetOtpRequest() {
    setResetErrorMsg(null)
    const target = resetEmail.trim()
    if (!target || !target.includes('@')) {
      setResetErrorMsg('Please enter your registered email address.')
      return
    }
    setSendingResetOtp(true)
    try {
      const res = await api<OtpSendResult>('/api/player-auth/forgot-password/send', {
        method: 'POST',
        json: { email: target },
      })
      setResetOtpInfo(res)
      toast.success(`Password reset OTP sent to ${res.maskedTarget}. Check your inbox or spam folder.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset OTP'
      setResetErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSendingResetOtp(false)
    }
  }

  async function handleSendResetOtp(e: React.FormEvent) {
    e.preventDefault()
    await sendResetOtpRequest()
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetErrorMsg(null)
    if (resetOtpCode.trim().length < 6) {
      setResetErrorMsg('Please enter the 6-digit OTP from your email inbox.')
      return
    }
    setResettingPassword(true)
    try {
      const res = await api<{ reset: boolean; email: string }>('/api/player-auth/forgot-password/reset', {
        method: 'POST',
        json: {
          email: resetEmail.trim(),
          otpCode: resetOtpCode.trim(),
          newPassword: resetNewPassword,
        },
      })
      setIdentifier(res.email)
      setPassword('')
      setResetOtpInfo(null)
      setResetOtpCode('')
      setResetNewPassword('')
      setResetSuccessMsg('Password updated! Sign in with your new password.')
      setMode('SIGN_IN')
      toast.success('Password reset successfully. Sign in with your new password.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password'
      setResetErrorMsg(msg)
      toast.error(msg)
    } finally {
      setResettingPassword(false)
    }
  }

  const spamNoticeBanner = (
    <div className="auth-reveal rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
      <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        OTP emails (verification &amp; password reset) are sent to your <strong>email inbox only</strong>. If the OTP
        doesn&apos;t arrive in your inbox, please check your <strong>Spam</strong> folder.
      </span>
    </div>
  )

  const currentFlowKey = mode === 'SIGN_IN' ? 'sign-in' : resetOtpInfo ? 'forgot-step-2' : 'forgot-step-1'

  return (
    <AuthSplitLayout
      activeTab="SIGN_IN"
      showTabs={mode === 'SIGN_IN'}
      onTabChange={(tab) => {
        if (tab === 'REGISTER') navigate('/player/register')
      }}
      title={mode === 'SIGN_IN' ? 'Sign In' : 'Reset Password'}
      subtitle={
        mode === 'SIGN_IN'
          ? 'Access your Nexcore Player account'
          : resetOtpInfo
            ? 'Enter the 6-digit OTP from your email inbox'
            : 'Receive a password reset OTP in your email inbox'
      }
      navigate={navigate}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'SIGN_IN' ? (
          <motion.form
            key={currentFlowKey}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {resetSuccessMsg && (
              <div
                role="status"
                className="auth-reveal rounded-xl border border-emerald-300 bg-emerald-50/90 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="auth-reveal rounded-xl border border-red-300 bg-red-50/90 px-3.5 py-2.5 text-xs font-semibold text-red-800"
              >
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="player-login-identifier" className="block text-xs font-bold text-[#111827]">
                Email or Mobile Number
              </label>
              <div className="relative group">
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-[#7A1426]"
                  aria-hidden="true"
                >
                  <UserCheck className="w-4 h-4" />
                </span>
                <input
                  id="player-login-identifier"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  aria-invalid={errorMsg ? 'true' : 'false'}
                  placeholder="player@example.com or +919876543210"
                  className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <PasswordInputField
                id="player-login-password"
                name="password"
                label="Password"
                autoComplete="current-password"
                enterKeyHint="done"
                leadingIcon
                value={password}
                onChange={setPassword}
                ariaInvalid={Boolean(errorMsg)}
                placeholder="Enter your password"
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] text-gray-500">Career &amp; season portal</span>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-xs font-semibold text-[#7A1426] hover:text-[#5E0E1D] hover:underline cursor-pointer py-0.5 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="group w-full h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm shadow-md shadow-[#7A1426]/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn
                  className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              )}
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>

            {spamNoticeBanner}
          </motion.form>
        ) : (
          <motion.div
            key={currentFlowKey}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={backToSignIn}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#7A1426] cursor-pointer transition-colors"
              >
                <ArrowLeft
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Back to Sign In
              </button>

              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-1.5 w-6 rounded-full bg-[#7A1426]" />
                <span
                  className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                    resetOtpInfo ? 'bg-[#7A1426]' : 'bg-[#E5E7EB]'
                  }`}
                />
              </div>
            </div>

            {resetErrorMsg && (
              <div
                role="alert"
                className="auth-reveal rounded-xl border border-red-300 bg-red-50/90 px-3.5 py-2.5 text-xs font-semibold text-red-800"
              >
                {resetErrorMsg}
              </div>
            )}

            {!resetOtpInfo ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="block text-xs font-bold text-[#111827]">
                    Registered Email Address
                  </label>
                  <div className="relative group">
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-[#7A1426]"
                      aria-hidden="true"
                    >
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      ref={resetEmailRef}
                      id="reset-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="done"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      aria-invalid={resetErrorMsg ? 'true' : 'false'}
                      placeholder="player@example.com"
                      className={`${AUTH_INPUT_CLASS} pl-10 pr-3.5`}
                    />
                  </div>
                </div>

                {spamNoticeBanner}

                <Button
                  type="submit"
                  disabled={sendingResetOtp}
                  className="w-full h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm shadow-md shadow-[#7A1426]/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                >
                  {sendingResetOtp ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  )}
                  {sendingResetOtp ? 'Sending OTP...' : 'Send Reset OTP to Inbox'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div
                  role="status"
                  className="auth-reveal rounded-xl border border-emerald-300 bg-emerald-50/90 px-3.5 py-2.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" aria-hidden="true" />
                  <span>
                    Reset OTP sent to your email inbox (<strong>{resetOtpInfo.maskedTarget}</strong>). If the OTP
                    doesn&apos;t arrive in your inbox, please check your <strong>Spam</strong> folder.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-otp-code" className="block text-xs font-bold text-[#111827]">
                    6-Digit Email OTP
                  </label>
                  <p id="reset-otp-hint" className="text-[11px] text-gray-500">
                    Enter the 6-digit code from your email inbox (check Spam if not visible).
                  </p>
                  <input
                    ref={resetOtpRef}
                    id="reset-otp-code"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    enterKeyHint="next"
                    required
                    aria-describedby="reset-otp-hint"
                    aria-invalid={resetErrorMsg ? 'true' : 'false'}
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className={`${AUTH_INPUT_CLASS} text-center font-mono text-base font-bold tracking-[0.25em]`}
                  />
                </div>

                <PasswordInputField
                  id="reset-new-password"
                  name="new-password"
                  label="New Password"
                  autoComplete="new-password"
                  minLength={8}
                  enterKeyHint="done"
                  leadingIcon
                  hintAbove="Minimum 8 characters with at least one letter and one number."
                  value={resetNewPassword}
                  onChange={setResetNewPassword}
                  ariaInvalid={Boolean(resetErrorMsg)}
                  placeholder="Create a new password"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={resettingPassword}
                    className="flex-1 h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm shadow-md shadow-[#7A1426]/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                  >
                    {resettingPassword && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />}
                    {resettingPassword ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sendingResetOtp}
                    onClick={sendResetOtpRequest}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#111827] hover:border-[#7A1426] hover:text-[#7A1426] cursor-pointer transition-colors"
                  >
                    {sendingResetOtp ? 'Sending...' : 'Resend OTP'}
                  </Button>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetOtpInfo(null)
                      setResetOtpCode('')
                      setResetErrorMsg(null)
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-[#7A1426] hover:underline cursor-pointer"
                  >
                    Use a different email address
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitLayout>
  )
}

export function PlayerRegisterPage({
  navigate,
  onAuthenticated,
}: {
  navigate: (to: string) => void
  onAuthenticated: () => Promise<void>
}) {
  const [step, setStep] = useState<'DETAILS' | 'VERIFY_OTP'>('DETAILS')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE')
  const [role, setRole] = useState('ALL_ROUNDER')
  const [battingStyle, setBattingStyle] = useState('')
  const [bowlingStyle, setBowlingStyle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [otpCode, setOtpCode] = useState('')
  const [otpSentInfo, setOtpSentInfo] = useState<OtpSendResult | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'VERIFY_OTP') {
      otpInputRef.current?.focus()
    }
  }, [step, otpSentInfo])

  async function sendEmailRegistrationOtp(): Promise<boolean> {
    setErrorMsg(null)
    const target = email.trim()
    if (!target) {
      setErrorMsg('Enter your email address before requesting verification OTP.')
      return false
    }
    setSendingOtp(true)
    try {
      const res = await api<OtpSendResult>('/api/player-auth/otp/send', {
        method: 'POST',
        json: { channel: 'EMAIL', target, purpose: 'REGISTER' },
      })
      setOtpSentInfo(res)
      toast.success(`Verification OTP sent to ${res.maskedTarget}. Check your inbox or spam folder.`)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code'
      setErrorMsg(msg)
      toast.error(msg)
      return false
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleSubmitProfileDetails(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const cleanMobileDigits = mobile.replace(/\D/g, '')

    if (cleanName.length < 2) {
      setErrorMsg('Full name is required (min 2 characters).')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (cleanMobileDigits.length < 8 || cleanMobileDigits.length > 15) {
      setErrorMsg('Please enter a valid 8-15 digit mobile number.')
      return
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('Password must be at least 8 characters and include a letter and a number.')
      return
    }

    if (otpSentInfo) {
      setStep('VERIFY_OTP')
      return
    }

    const sent = await sendEmailRegistrationOtp()
    if (sent) {
      setStep('VERIFY_OTP')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (otpCode.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit OTP from your email inbox.')
      return
    }

    setSubmitting(true)
    try {
      await api('/api/player-auth/register', {
        method: 'POST',
        json: {
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
          gender,
          role,
          battingStyle: battingStyle || null,
          bowlingStyle: bowlingStyle || null,
          dob: null,
          city: null,
          avatarUrl: avatarUrl.trim() || null,
          otpCode: otpCode.trim(),
          otpChannel: 'EMAIL',
        },
      })
      await onAuthenticated()
      toast.success('Registration complete! Welcome to Nexcore Premier League.')
      navigate('/player/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedRoleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Player'

  return (
    <AuthSplitLayout
      activeTab="REGISTER"
      wide
      showTabs={step === 'DETAILS'}
      onTabChange={(tab) => {
        if (tab === 'SIGN_IN') navigate('/player/login')
      }}
      title={step === 'DETAILS' ? 'Create Player Account' : 'Verify Your Email'}
      subtitle={
        step === 'DETAILS'
          ? 'Register once with your email and mobile number for lifetime career stats'
          : `Enter the 6-digit email OTP to complete registration for ${name.trim() || 'your profile'}`
      }
      navigate={navigate}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'DETAILS' ? (
          <motion.form
            key="register-details"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmitProfileDetails}
            className="space-y-5"
          >
            {errorMsg && (
              <div
                role="alert"
                className="auth-reveal rounded-xl border border-red-300 bg-red-50/90 px-3.5 py-2.5 text-xs font-semibold text-red-800"
              >
                {errorMsg}
              </div>
            )}

            {/* Account Credentials & Identity */}
            <div className="space-y-3.5">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A1426]">
                1. Account &amp; Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="reg-name" className="block text-xs font-bold text-[#111827]">
                    Full Name <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid="false"
                    placeholder="e.g. Rahul Sharma"
                    className={AUTH_INPUT_CLASS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="block text-xs font-bold text-[#111827]">
                    Email Address <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setOtpSentInfo(null)
                      setOtpCode('')
                    }}
                    aria-invalid="false"
                    placeholder="player@example.com"
                    className={AUTH_INPUT_CLASS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-mobile" className="block text-xs font-bold text-[#111827]">
                    Mobile Number <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="reg-mobile"
                    name="mobile"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    aria-invalid="false"
                    placeholder="+91 9876543210"
                    className={AUTH_INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <PasswordInputField
                    id="reg-password"
                    name="new-password"
                    label={
                      <>
                        Password <span className="text-red-700">*</span>
                      </>
                    }
                    autoComplete="new-password"
                    minLength={8}
                    enterKeyHint="done"
                    leadingIcon
                    hintAbove="Minimum 8 characters with at least one letter and one number."
                    value={password}
                    onChange={setPassword}
                    placeholder="Create a strong password"
                  />
                </div>
              </div>
            </div>

            {/* Cricket Profile Details */}
            <div className="space-y-3.5 pt-1 border-t border-[#E5E7EB]">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A1426] pt-2">
                2. Cricket Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="reg-role" className="block text-xs font-bold text-[#111827]">
                    Playing Role
                  </label>
                  <select
                    id="reg-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-gender" className="block text-xs font-bold text-[#111827]">
                    Category / Division
                  </label>
                  <select
                    id="reg-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value === 'FEMALE' ? 'FEMALE' : 'MALE')}
                    className={AUTH_INPUT_CLASS}
                  >
                    <option value="MALE">Men&apos;s Division</option>
                    <option value="FEMALE">Women&apos;s Division</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-bat" className="block text-xs font-bold text-[#111827]">
                    Batting Style
                  </label>
                  <select
                    id="reg-bat"
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  >
                    {BATTING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-bowl" className="block text-xs font-bold text-[#111827]">
                    Bowling Style
                  </label>
                  <select
                    id="reg-bowl"
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value)}
                    className={AUTH_INPUT_CLASS}
                  >
                    {BOWLING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <PlayerAvatarField
                    id="reg-avatar"
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    onError={setErrorMsg}
                    inputClassName={AUTH_INPUT_CLASS}
                    uploadButtonHeightClass="h-[42px]"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={sendingOtp}
              className="group w-full h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm shadow-md shadow-[#7A1426]/20 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {sendingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
                  Sending Verification OTP...
                </>
              ) : (
                <>
                  Submit Profile &amp; Verify Contact
                  <ArrowRight
                    className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="register-verify-otp"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setStep('DETAILS')
                }}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#7A1426] cursor-pointer transition-colors"
              >
                <ArrowLeft
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Edit Profile Details
              </button>

              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-1.5 w-6 rounded-full bg-[#7A1426]" />
                <span className="h-1.5 w-6 rounded-full bg-[#7A1426]" />
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="auth-reveal rounded-xl border border-red-300 bg-red-50/90 px-3.5 py-2.5 text-xs font-semibold text-red-800"
              >
                {errorMsg}
              </div>
            )}

            {/* Compact player summary */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-bold text-[#111827]">
                {name.trim()}{' '}
                <span className="font-semibold text-gray-500">
                  &bull; {selectedRoleLabel}
                </span>
              </div>
              <span className="text-[11px] font-medium text-gray-600">{email.trim()}</span>
            </div>

            {otpSentInfo && (
              <div
                role="status"
                className="auth-reveal rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2"
              >
                <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Verification OTP sent to your email inbox (<strong>{otpSentInfo.maskedTarget}</strong>). If the OTP
                  doesn&apos;t arrive in your inbox, please check your <strong>Spam</strong> folder.
                </span>
              </div>
            )}

            {otpSentInfo?.devOtp && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Verification Preview Code (dev/testing): <strong className="font-mono">{otpSentInfo.devOtp}</strong>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="otp-code-input" className="block text-xs font-bold text-[#111827]">
                6-Digit Email OTP
              </label>
              <p id="otp-hint" className="text-[11px] text-gray-500">
                Enter the 6-digit code from your email inbox (check Spam if not visible).
              </p>
              <input
                ref={otpInputRef}
                id="otp-code-input"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                pattern="[0-9]{6}"
                maxLength={6}
                enterKeyHint="done"
                required
                aria-describedby="otp-hint"
                aria-invalid={Boolean(errorMsg)}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={`${AUTH_INPUT_CLASS} text-center font-mono text-base font-bold tracking-[0.25em]`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={submitting || !otpSentInfo || otpCode.trim().length < 6}
                className="flex-1 h-11 rounded-xl bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm shadow-md shadow-[#7A1426]/20 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                )}
                {submitting ? 'Verifying & Creating Account...' : 'Verify OTP & Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={sendEmailRegistrationOtp}
                disabled={sendingOtp || !email.trim()}
                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#111827] hover:border-[#7A1426] hover:text-[#7A1426] cursor-pointer transition-colors"
              >
                {sendingOtp ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                )}
                {sendingOtp ? 'Sending...' : 'Resend OTP'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthSplitLayout>
  )
}
