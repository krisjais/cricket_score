'use client'

import { useState, useEffect } from 'react'
import { api, type MatchSummary, type MatchStatePayload } from '@/lib/client'
import { ScrollText, RefreshCw, AlertCircle } from 'lucide-react'

interface AdminLogViewProps {
  matches: MatchSummary[]
  selectedMatchId?: string
}

export function AdminLogView({ matches, selectedMatchId }: AdminLogViewProps) {
  const [matchId, setMatchId] = useState<string>(selectedMatchId || matches[0]?.id || '')
  const [payload, setPayload] = useState<MatchStatePayload | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMatch = async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const data = await api<MatchStatePayload>(`/api/matches/${id}`)
      setPayload(data)
    } catch {
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (matchId) {
      loadMatch(matchId)
    }
  }, [matchId])

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#f8f6f0]">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-[#0d3a24]/10 text-[#0d3a24]">
              <ScrollText className="w-6 h-6" />
            </span>
            <span>Match Event Log & Audit</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">
            Chronological delivery-by-delivery event stream for accurate scoring audit
          </p>
        </div>

        {/* Match Selector */}
        <div className="flex items-center gap-2">
          <select
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="bg-white border border-[#e8e2d5] text-xs font-bold text-[#111827] px-3.5 py-2.5 rounded-xl focus:border-[#0d3a24] focus:outline-none shadow-xs cursor-pointer"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.teamA.shortName} vs {m.teamB.shortName} ({m.format}) — {m.status}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadMatch(matchId)}
            className="p-2.5 bg-white border border-[#e8e2d5] text-[#0d3a24] hover:bg-[#f4efe6] rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Refresh log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!payload || !payload.match || !Array.isArray(payload.innings) ? (
        <div className="bg-white border border-[#e8e2d5] rounded-3xl p-12 text-center text-[#6b7280]">
          <AlertCircle className="w-8 h-8 mx-auto text-[#9ca3af] mb-2" />
          <p className="text-sm font-semibold">Select a match to view delivery events</p>
        </div>
      ) : (
        <div className="space-y-6">
          {payload.innings.map((inn) => {
            const battingTeamName =
              inn.battingTeamId === payload.match.teamA.id
                ? payload.match.teamA.name
                : payload.match.teamB.name
            const items = inn.commentary ?? []

            return (
              <div key={inn.inningsId} className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#e8e2d5] mb-4">
                  <div>
                    <h2 className="font-serif font-bold text-base text-[#0d3a24]">
                      Innings {inn.number}: {battingTeamName} Batting
                    </h2>
                    <p className="text-xs text-[#6b7280]">
                      {inn.runs}/{inn.wickets} in {inn.oversDisplay} overs • Extras: {inn.extras.total} (wd {inn.extras.wides}, nb {inn.extras.noBalls}, b {inn.extras.byes}, lb {inn.extras.legByes})
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5]">
                    {inn.totalDeliveries} deliveries
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-[#9ca3af] italic py-6 text-center">No deliveries recorded in this innings yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#e8e2d5] text-[#9ca3af] uppercase font-bold tracking-wider">
                          <th className="pb-2.5 pl-2">Seq</th>
                          <th className="pb-2.5">Over</th>
                          <th className="pb-2.5">Description</th>
                          <th className="pb-2.5">Runs</th>
                          <th className="pb-2.5">Event</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e2d5]/60 font-mono">
                        {items.map((b) => (
                          <tr key={`${inn.inningsId}-${b.sequence}`} className="hover:bg-[#faf8f5]">
                            <td className="py-2.5 pl-2 text-[#9ca3af]">#{b.sequence}</td>
                            <td className="py-2.5 font-bold text-[#111827]">{b.overDisplay}</td>
                            <td className="py-2.5 font-sans font-medium text-[#111827]">{b.text}</td>
                            <td className="py-2.5 font-bold">{b.runs}</td>
                            <td className="py-2.5 font-sans">
                              {b.kind === 'W' ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">
                                  Wicket
                                </span>
                              ) : b.kind === '6' ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                                  SIX
                                </span>
                              ) : b.kind === '4' ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                                  FOUR
                                </span>
                              ) : b.kind === 'extra' ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#f4efe6] text-[#c59b27] text-[10px] font-black uppercase">
                                  Extra
                                </span>
                              ) : b.kind === 'dot' ? (
                                <span className="text-[#9ca3af]">Dot ball</span>
                              ) : (
                                <span className="text-[#111827]">{b.runs} run(s)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
