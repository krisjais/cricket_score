'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InningsStats } from '@/lib/cricket'
import type { MatchStatePayload, TeamLite } from '@/lib/match-state'

function teamOf(payload: MatchStatePayload, id: string): TeamLite {
  return payload.match.teamA.id === id ? payload.match.teamA : payload.match.teamB
}

export function ScorecardView({
  payload,
  navigate,
}: {
  payload: MatchStatePayload
  navigate?: (to: string) => void
}) {
  const innings = Array.isArray(payload?.innings) ? payload.innings : []
  if (innings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
        Scorecard will be available once the match begins.
      </div>
    )
  }
  return (
    <Tabs defaultValue={String(innings[0].number)} className="space-y-4">
      <TabsList className="bg-white border border-gray-200 p-1 rounded-xl h-auto gap-1 flex-wrap shadow-2xs">
        {innings.map((inn) => (
          <TabsTrigger
            key={inn.number}
            value={String(inn.number)}
            className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-[#7A1426] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            {teamOf(payload, inn.battingTeamId).shortName} Innings {inn.number}
          </TabsTrigger>
        ))}
      </TabsList>
      {innings.map((inn) => (
        <TabsContent key={inn.number} value={String(inn.number)}>
          <InningsScorecard innings={inn} payload={payload} navigate={navigate} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function InningsScorecard({
  innings,
  payload,
  navigate,
}: {
  innings: InningsStats
  payload: MatchStatePayload
  navigate?: (to: string) => void
}) {
  const openPlayer = (idOrCode: string) => {
    const dest = `/players/${encodeURIComponent(idOrCode)}`
    if (navigate) {
      navigate(dest)
    } else if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/#${dest}`)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }
  const batTeam = teamOf(payload, innings.battingTeamId)
  const bowlTeam = teamOf(payload, innings.bowlingTeamId)
  const batted = innings.batting.filter((b) => b.batted || b.out)
  const dnb = innings.batting.filter((b) => !b.batted && !b.out)
  const extrasRows = ([
    ['Wides', innings.extras.wides],
    ['No-balls', innings.extras.noBalls],
    ['Byes', innings.extras.byes],
    ['Leg-byes', innings.extras.legByes],
  ] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k} ${n}`)
    .join(', ')

  return (
    <div className="space-y-4">
      {/* Batting Card */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:px-6 flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#111827]">
            <Trophy className="w-4 h-4 text-[#7A1426]" />
            <span>{batTeam.name} Batting</span>
          </CardTitle>
          <span className="text-sm font-extrabold tabular-nums text-[#7A1426] bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-2xs">
            {innings.runs}/{innings.wickets}{' '}
            <span className="text-xs font-medium text-gray-500">({innings.oversDisplay} ov)</span>
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/70">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="pl-6 text-gray-600 font-bold text-[11px] uppercase tracking-wider">Batter</TableHead>
                  <TableHead className="text-gray-600 font-bold text-[11px] uppercase tracking-wider">Dismissal</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">R</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">B</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">4s</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">6s</TableHead>
                  <TableHead className="pr-6 text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">SR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-gray-400">
                      No deliveries faced in this innings yet.
                    </TableCell>
                  </TableRow>
                )}
                {batted.map((b) => (
                  <TableRow
                    key={b.id}
                    className={cn(
                      'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                      b.atCrease && 'bg-[#7A1426]/[0.03]'
                    )}
                  >
                    <TableCell className="pl-6 font-bold text-sm text-[#111827] whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openPlayer(b.playerCode || b.id)}
                        className="hover:text-[#7A1426] hover:underline cursor-pointer text-left"
                      >
                        {b.name}
                      </button>
                      {b.isOnStrike && (
                        <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7A1426] text-white">
                          *
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-medium">
                      {b.out ? (
                        <span className="text-gray-700 font-semibold">{b.dismissalText}</span>
                      ) : b.atCrease ? (
                        <span className="text-emerald-700 font-bold">batting</span>
                      ) : (
                        <span className="text-gray-500">not out</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black tabular-nums text-sm text-[#111827]">
                      {b.runs}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-gray-600 font-semibold">
                      {b.balls}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-bold text-emerald-700">
                      {b.fours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-bold text-[#7A1426]">
                      {b.sixes}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums text-xs font-bold text-gray-700">
                      {b.strikeRate.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 border-t border-gray-200 text-xs">
                  <TableCell colSpan={2} className="pl-6 font-bold text-gray-700 uppercase tracking-wider">
                    Extras
                  </TableCell>
                  <TableCell colSpan={5} className="pr-6 text-right tabular-nums font-bold text-[#111827]">
                    {innings.extras.total}{' '}
                    {extrasRows && <span className="font-normal text-gray-500 ml-1">({extrasRows})</span>}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-[#7A1426]/5 font-bold border-t border-[#7A1426]/20">
                  <TableCell colSpan={2} className="pl-6 text-[#111827] uppercase tracking-wider text-xs">
                    Total Score
                  </TableCell>
                  <TableCell colSpan={5} className="pr-6 text-right tabular-nums text-sm text-[#7A1426]">
                    {innings.runs}/{innings.wickets}{' '}
                    <span className="font-semibold text-xs text-gray-600">
                      ({innings.oversDisplay} ov • RR {innings.runRate.toFixed(2)})
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {dnb.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-600">
              <span className="font-bold text-[#111827] uppercase tracking-wider text-[11px] mr-1.5">
                Yet to bat:
              </span>
              <span>{dnb.map((p) => p.name).join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fall of Wickets */}
      {innings.fow.length > 0 && (
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:px-6">
            <CardTitle className="text-sm font-bold text-[#111827] uppercase tracking-wider">
              Fall of Wickets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:px-6 flex flex-wrap gap-2">
            {innings.fow.map((f) => (
              <span
                key={f.wicket}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs tabular-nums shadow-2xs"
              >
                <b className="text-[#7A1426]">
                  {f.runs}-{f.wicket}
                </b>{' '}
                <span className="font-bold text-[#111827]">({f.batsmanName}, {f.over} ov)</span>
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bowling Card */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#111827]">
            <Shield className="w-4 h-4 text-[#7A1426]" />
            <span>{bowlTeam.name} Bowling</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/70">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="pl-6 text-gray-600 font-bold text-[11px] uppercase tracking-wider">Bowler</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">O</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">M</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">R</TableHead>
                  <TableHead className="text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">W</TableHead>
                  <TableHead className="pr-6 text-right text-gray-600 font-bold text-[11px] uppercase tracking-wider">ECO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {innings.bowling.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-gray-400">
                      No overs bowled yet.
                    </TableCell>
                  </TableRow>
                )}
                {innings.bowling.map((b) => (
                  <TableRow key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-6 font-bold text-sm text-[#111827]">
                      <button
                        type="button"
                        onClick={() => openPlayer(b.playerCode || b.id)}
                        className="hover:text-[#7A1426] hover:underline cursor-pointer text-left"
                      >
                        {b.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-gray-600 font-semibold">{b.overs}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-gray-600">{b.maidens}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-gray-600 font-semibold">{b.runsConceded}</TableCell>
                    <TableCell className="text-right font-black tabular-nums text-sm text-[#7A1426]">{b.wickets}</TableCell>
                    <TableCell className="pr-6 text-right tabular-nums text-xs font-bold text-gray-700">{b.economy.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
