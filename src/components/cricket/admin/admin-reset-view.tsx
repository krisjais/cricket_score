'use client'

import { useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, Sparkles, Trash2, ShieldAlert } from 'lucide-react'

export function AdminResetView({ onResetSuccess }: { onResetSuccess?: () => void }) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const handleReset = async (scope: 'teams' | 'matches' | 'demo') => {
    if (scope !== 'demo') {
      const confirmed = window.confirm(
        scope === 'teams'
          ? 'WARNING: This will permanently delete ALL matches, teams, and players. Proceed?'
          : 'WARNING: This will permanently delete ALL match history. Teams and players will be kept. Proceed?'
      )
      if (!confirmed) return
    }

    setBusy(true)
    try {
      const res = await api<any>('/api/admin/reset', { method: 'POST', json: { scope } })
      if (scope === 'demo') {
        toast({ title: 'Demo Data Loaded', description: `Created 2 demo teams with ${res.playersCreated} players & scheduled match.` })
      } else {
        toast({ title: 'Reset Completed', description: `Cleared ${res.matchesDeleted || 0} match(es) from database.` })
      }
      if (onResetSuccess) onResetSuccess()
    } catch (err: any) {
      toast({ title: 'Operation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#f8f6f0]">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-red-100 text-red-700">
            <ShieldAlert className="w-6 h-6" />
          </span>
          <span>Danger Zone & Reset Operations</span>
        </h1>
        <p className="text-xs text-[#6b7280] mt-1 font-medium">
          Tournament wipe, testing reset, and automated demonstration data injection
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {/* Load Demo Data */}
        <div className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-[#0d3a24]">
              <Sparkles className="w-5 h-5 text-[#c59b27]" />
              <span>Load Official Demo Tournament Data</span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
              Creates Rising Stars CC and Royal Warriors with 11 players each, and schedules a live T10 match for testing.
            </p>
          </div>
          <button
            onClick={() => handleReset('demo')}
            disabled={busy}
            className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            Load Demo Data
          </button>
        </div>

        {/* Reset Matches Only */}
        <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Reset All Matches</span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
              Deletes all match history, scorecards, and ball-by-ball deliveries. Teams and players will be preserved.
            </p>
          </div>
          <button
            onClick={() => handleReset('matches')}
            disabled={busy}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            Clear Matches
          </button>
        </div>

        {/* Danger Zone Full Reset */}
        <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-red-900">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Complete Tournament Wipe</span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
              Deletes everything: all matches, innings, deliveries, franchises, and player squads. Starts completely fresh.
            </p>
          </div>
          <button
            onClick={() => handleReset('teams')}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            Wipe Entire Database
          </button>
        </div>
      </div>
    </div>
  )
}
