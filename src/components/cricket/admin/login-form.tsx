'use client'

import { useId, useState } from 'react'
import { NplLogo } from '@/components/cricket/apl-logo'
import { Lock, User, ArrowRight, ShieldCheck, Key, Eye, EyeOff } from 'lucide-react'
import { api, type AdminSession } from '@/lib/client'
import { useToast } from '@/hooks/use-toast'

export function LoginForm({ session }: { session: AdminSession }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const passwordToggleWarningId = useId()
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast({ title: 'Input required', description: 'Please provide both username and password.', variant: 'destructive' })
      return
    }

    setBusy(true)
    try {
      await api('/api/auth/login', { method: 'POST', json: { username: username.trim(), password } })
      await session.refresh()
      toast({ title: 'Welcome to NPL Admin', description: `Authenticated as ${username}.` })
    } catch (err) {
      toast({ title: 'Sign-in failed', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = () => {
    setUsername('admin')
    setPassword('admin123')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F4F5F7]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <NplLogo size="lg" />
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-[#111827]">
            Nexcore Premier League
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Official Admin &amp; Umpire Scoring Portal
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
            <span className="p-2 rounded-xl bg-[#7A1426]/10 text-[#7A1426]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Administrator Login</h2>
              <p className="text-[11px] text-gray-500">Authenticated session required for match &amp; live scoring</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#7A1426] focus:ring-1 focus:ring-[#7A1426] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#7A1426] focus:ring-1 focus:ring-[#7A1426] forced-colors:focus-visible:outline-2 transition-all [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                  aria-label="Show password"
                  aria-describedby={passwordToggleWarningId}
                  className="absolute inset-y-0 right-0 flex items-center justify-center min-w-11 px-3.5 rounded-r-xl bg-transparent text-gray-500 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-[#7A1426] focus-visible:-outline-offset-2 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
                <span id={passwordToggleWarningId} className="sr-only">
                  Warning: this will display your password on the screen.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 bg-[#7A1426] hover:bg-[#5E0E1D] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <span>{busy ? 'Authenticating...' : 'Sign In to Admin Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Default: admin / admin123</span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-[#7A1426] hover:text-[#5E0E1D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Fill Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
