'use client'

import { useState } from 'react'
import { AplLogo } from '@/components/cricket/apl-logo'
import { Lock, User, ArrowRight, ShieldCheck, Key } from 'lucide-react'
import { api, type AdminSession } from '@/lib/client'
import { useToast } from '@/hooks/use-toast'

export function LoginForm({ session }: { session: AdminSession }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
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
      toast({ title: 'Welcome to APL Admin', description: `Authenticated as ${username}.` })
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#f8f6f0]">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <AplLogo size="lg" />
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-[#0d3a24]">
            APL Cricket Admin
          </h1>
          <p className="text-xs text-[#6b7280] font-medium mt-1">
            Official Tournament Scoring & Match Control Center
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e8e2d5] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 pb-5 border-b border-[#e8e2d5] mb-5">
            <span className="p-2 rounded-xl bg-[#0d3a24]/10 text-[#0d3a24]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Administrator Access</h2>
              <p className="text-[11px] text-[#6b7280]">Authenticated session required for live scoring</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4b5563] mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8e2d5] rounded-xl text-sm font-medium text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0d3a24] focus:ring-1 focus:ring-[#0d3a24] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4b5563] mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9ca3af]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8e2d5] rounded-xl text-sm font-medium text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0d3a24] focus:ring-1 focus:ring-[#0d3a24] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 bg-[#0d3a24] hover:bg-[#154d32] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <span>{busy ? 'Authenticating...' : 'Sign In to Admin Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials shortcut */}
          <div className="mt-6 pt-5 border-t border-[#e8e2d5] flex items-center justify-between text-xs">
            <span className="text-[#6b7280] font-medium">Default: admin / admin123</span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-[#c59b27] hover:text-[#916922] font-bold flex items-center gap-1 hover:underline cursor-pointer"
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
