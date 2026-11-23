'use client'

import { useState, useEffect } from 'react'
import { api, type MatchSummary, type MatchStatePayload } from '@/lib/client'
import { ScrollText, RefreshCw, AlertCircle } from 'lucide-react'
import { AdminPagination } from '@/components/cricket/admin/admin-pagination'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface AdminLogViewProps {
  matches: MatchSummary[]
  selectedMatchId?: string
}

export function AdminLogView({ matches, selectedMatchId }: AdminLogViewProps) {
  const [matchId, setMatchId] = useState<string>(selectedMatchId || matches[0]?.id || '')
  const [payload, setPayload] = useState<MatchStatePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [inningsPages, setInningsPages] = useState<Record<string, number>>({})
  const [pageSize, setPageSize] = useState<number>(10)

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
      setInningsPages({})
      loadMatch(matchId)
    }
  }, [matchId])

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#F4F5F7]">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-[#7A1426] border border-rose-100">
              <ScrollText className="w-5 h-5" />
            </span>
            <span>Match Event Log &amp; Audit</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Chronological delivery-by-delivery event stream for accurate scoring audit
          </p>
        </div>

        {/* Match Selector */}
        <div className="flex items-center gap-2">
          {matches.length > 0 ? (
            <Select value={matchId} onValueChange={(val) => setMatchId(val)}>
              <SelectTrigger className="bg-white border-gray-200 text-xs font-bold text-gray-900 min-w-[260px] h-10 rounded-xl shadow-xs focus:ring-2 focus:ring-[#7A1426]/20">
                <SelectValue placeholder="Select a match" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.teamA.shortName} vs {m.teamB.shortName} ({m.format}) — {m.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              No matches available
            </div>
          )}
          <button
            onClick={() => loadMatch(matchId)}
            className="h-10 w-10 flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:text-[#7A1426] hover:bg-gray-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Refresh log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7A1426]' : ''}`} />
          </button>
        </div>
      </div>

      {!payload || !payload.match || !Array.isArray(payload.innings) ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
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
            const currentPage = inningsPages[inn.inningsId] ?? 1
            const totalPages = Math.ceil(items.length / pageSize) || 1
            const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)

            return (
              <div key={inn.inningsId} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <div>
                      <h2 className="font-bold text-base text-gray-900">
                        Innings {inn.number}: {battingTeamName} Batting
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {inn.runs}/{inn.wickets} in {inn.oversDisplay} overs &bull; Extras: {inn.extras.total} (wd {inn.extras.wides}, nb {inn.extras.noBalls}, b {inn.extras.byes}, lb {inn.extras.legByes})
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {inn.totalDeliveries} deliveries
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-6 text-center">No deliveries recorded in this innings yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold tracking-wider">
                            <th className="pb-2.5 pl-2">Seq</th>
                            <th className="pb-2.5">Over</th>
                            <th className="pb-2.5">Description</th>
                            <th className="pb-2.5">Runs</th>
                            <th className="pb-2.5">Event</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono">
                          {paginatedItems.map((b) => (
                            <tr key={`${inn.inningsId}-${b.sequence}`} className="hover:bg-gray-50/70 transition-colors">
                              <td className="py-2.5 pl-2 text-gray-400">#{b.sequence}</td>
                              <td className="py-2.5 font-bold text-gray-900">{b.overDisplay}</td>
                              <td className="py-2.5 font-sans font-medium text-gray-800">{b.text}</td>
                              <td className="py-2.5 font-bold text-gray-900">{b.runs}</td>
                              <td className="py-2.5 font-sans">
                                {b.kind === 'W' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                                    Wicket
                                  </span>
                                ) : b.kind === '6' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                                    SIX
                                  </span>
                                ) : b.kind === '4' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                    FOUR
                                  </span>
                                ) : b.kind === 'extra' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                                    Extra
                                  </span>
                                ) : b.kind === 'dot' ? (
                                  <span className="text-gray-400">Dot ball</span>
                                ) : (
                                  <span className="text-gray-700 font-semibold">{b.runs} run(s)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={items.length}
                    pageSize={pageSize}
                    onPageChange={(p) => setInningsPages((prev) => ({ ...prev, [inn.inningsId]: p }))}
                    onPageSizeChange={(s) => {
                      setPageSize(s)
                      setInningsPages({})
                    }}
                    itemLabel="deliveries"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
