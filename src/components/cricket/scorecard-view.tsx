'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InningsStats } from '@/lib/cricket'
import type { MatchStatePayload, TeamLite } from '@/lib/match-state'
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
} from '@/components/cricket/cricket-graphics'

function teamOf(payload: MatchStatePayload, id: string): TeamLite {
  return payload.match.teamA.id === id ? payload.match.teamA : payload.match.teamB
}

export function ScorecardView({ payload }: { payload: MatchStatePayload }) {
  const innings = Array.isArray(payload?.innings) ? payload.innings : []
  if (innings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#e8e2d5] bg-white p-12 text-center text-xs text-[#6b7280]">
        Scorecard will be available once the match begins.
      </div>
    )
  }
  return (
    <Tabs defaultValue={String(innings[0].number)} className="space-y-4">
      <TabsList className="bg-[#f4efe6] border border-[#e8e2d5] p-1 rounded-2xl h-auto gap-1 flex-wrap">
        {innings.map((inn) => (
          <TabsTrigger
            key={inn.number}
            value={String(inn.number)}
            className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-[#0d3a24] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
          >
            {teamOf(payload, inn.battingTeamId).shortName} Innings {inn.number}
          </TabsTrigger>
        ))}
      </TabsList>
      {innings.map((inn) => (
        <TabsContent key={inn.number} value={String(inn.number)}>
          <InningsScorecard innings={inn} payload={payload} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function InningsScorecard({ innings, payload }: { innings: InningsStats; payload: MatchStatePayload }) {
  const batTeam = teamOf(payload, innings.battingTeamId)
  const bowlTeam = teamOf(payload, innings.bowlingTeamId)
  const batted = innings.batting.filter((b) => b.batted || b.out)
  const dnb = innings.batting.filter((b) => !b.batted && !b.out)
  const extrasRows = ([
    ['Wides', innings.extras.wides],
    ['No-balls', innings.extras.noBalls],
    ['Byes', innings.extras.byes],
    ['Leg-byes', innings.extras.legByes],
  ] as Array<[string, number]>).filter(([, v]) => v > 0)

  // Aggregate boundary metrics
  const totalFours = batted.reduce((acc, b) => acc + (b.fours || 0), 0)
  const totalSixes = batted.reduce((acc, b) => acc + (b.sixes || 0), 0)
  const boundaryRuns = totalFours * 4 + totalSixes * 6

  return (
    <div className="space-y-6">
      {/* Innings Telemetry Cards (Auction Broadcast Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Boundaries Counter */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Boundaries</div>
            <div className="text-xl font-serif font-black text-[#111827] mt-0.5">
              {totalFours + totalSixes} <span className="text-xs font-normal text-[#6b7280]">({boundaryRuns} runs)</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {totalFours} × 4s
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200">
                {totalSixes} × 6s
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c59b27]/15 text-[#c59b27] flex items-center justify-center">
            <CricketBatIcon size={22} />
          </div>
        </div>

        {/* Extras Breakdown */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Extras Conceded</div>
            <div className="text-xl font-serif font-black text-[#0d3a24] mt-0.5">
              {innings.extras.total} <span className="text-xs font-normal text-[#6b7280]">runs</span>
            </div>
            <div className="text-[11px] text-[#6b7280] mt-1">
              wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CricketBallIcon size={20} variant="gold" />
          </div>
        </div>

        {/* Run Rate Performance */}
        <div className="bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Scoring Pace</div>
            <div className="text-xl font-serif font-black text-[#0d3a24] mt-0.5">
              {innings.runRate.toFixed(2)} <span className="text-xs font-normal text-[#6b7280]">RPO</span>
            </div>
            <div className="text-[11px] text-[#6b7280] mt-1 font-mono">
              {innings.oversDisplay} overs ({innings.legalBalls} legal balls)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#0d3a24]" />
          </div>
        </div>
      </div>

      {/* Batting Card */}
      <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="bg-[#faf8f5] border-b border-[#e8e2d5] p-4 sm:p-5">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base font-serif font-bold text-[#111827]">
            <span className="flex items-center gap-2">
              <CricketBatIcon size={18} />
              <span>{batTeam.name} — Batting Innings</span>
            </span>
            <span className="font-serif font-black tabular-nums text-lg text-[#0d3a24]">
              {innings.runs}/{innings.wickets}{' '}
              <span className="text-xs font-medium text-[#6b7280]">({innings.oversDisplay} ov)</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f4efe6]">
              <TableRow className="border-b border-[#e8e2d5]">
                <TableHead className="pl-6 text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Batter</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">R</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">B</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">4s</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">6s</TableHead>
                <TableHead className="pr-6 text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">SR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batted.map((b) => (
                <TableRow key={b.id} className="border-b border-[#e8e2d5] hover:bg-[#f8f6f0] transition-colors">
                  <TableCell className="pl-6 py-3">
                    <div className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.isOnStrike && (
                        <span className="inline-flex items-center gap-0.5 text-[#0d3a24] text-[10px] bg-[#c59b27]/20 border border-[#c59b27]/40 px-1 py-0.2 rounded font-black">
                          <CricketBatIcon size={10} />
                          <span>*</span>
                        </span>
                      )}
                      {b.atCrease && !b.isOnStrike && <span className="text-xs text-[#6b7280] font-normal">(not out)</span>}
                    </div>
                    <div className="text-xs text-[#6b7280] mt-0.5 flex items-center gap-1">
                      {b.out && <CricketStumpsIcon size={12} broken={true} />}
                      <span>{b.dismissalText ?? 'not out'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black tabular-nums text-sm text-[#0d3a24]">{b.runs}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-[#6b7280] font-mono">{b.balls}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs font-semibold">
                    {b.fours > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {b.fours}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs font-semibold text-[#c59b27]">
                    {b.sixes > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200">
                        {b.sixes}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="pr-6 text-right tabular-nums text-xs font-bold text-[#111827] font-mono">
                    {b.strikeRate.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
              {batted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="pl-6 py-4 text-xs text-[#6b7280]">
                    Innings has not commenced yet.
                  </TableCell>
                </TableRow>
              )}
              {/* Extras Row */}
              <TableRow className="bg-[#faf8f5] border-b border-[#e8e2d5]">
                <TableCell className="pl-6 py-2.5 font-bold text-xs text-[#111827]" colSpan={1}>
                  Extras
                </TableCell>
                <TableCell colSpan={5} className="pr-6 py-2.5 text-xs text-[#6b7280]">
                  {extrasRows.length === 0 ? '0' : extrasRows.map(([k, v]) => `${k} ${v}`).join(', ')}
                  <span className="ml-2 font-bold text-[#111827]">({innings.extras.total})</span>
                </TableCell>
              </TableRow>
              {/* Total Row */}
              <TableRow className="bg-[#f4efe6] border-b border-[#e8e2d5]">
                <TableCell className="pl-6 py-3 font-serif font-black text-sm text-[#0d3a24]">Total</TableCell>
                <TableCell colSpan={5} className="pr-6 py-3 text-sm">
                  <span className="font-serif font-black tabular-nums text-base text-[#0d3a24]">
                    {innings.runs}/{innings.wickets}
                  </span>
                  <span className="ml-3 text-xs text-[#6b7280] font-semibold font-mono">
                    {innings.oversDisplay} overs • Run Rate: <b className="text-[#111827]">{innings.runRate.toFixed(2)}</b>
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Fall of wickets (Styled with Broken Wickets UI) */}
          {innings.fow.length > 0 && (
            <div className="border-t border-[#e8e2d5] bg-[#faf8f5] px-6 py-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#111827] uppercase tracking-wider">
                <CricketStumpsIcon size={16} broken={true} />
                <span>Fall of Wickets</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {innings.fow.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-white border border-[#e8e2d5] rounded-xl px-3 py-1.5 text-xs shadow-2xs"
                  >
                    <span className="font-mono font-bold text-[#0d3a24]">{f.runs}/{f.wicket}</span>
                    <span className="text-[#6b7280]">({f.batsmanName}, {f.over} ov)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Did not bat */}
          {dnb.length > 0 && (
            <div className="border-t border-[#e8e2d5] px-6 py-3 text-xs text-[#6b7280]">
              <span className="font-bold text-[#111827]">Yet to Bat: </span>
              {dnb.map((b) => b.name).join(', ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bowling Card */}
      <Card className="rounded-3xl border border-[#e8e2d5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="bg-[#faf8f5] border-b border-[#e8e2d5] p-4 sm:p-5">
          <CardTitle className="text-base font-serif font-bold text-[#111827] flex items-center gap-2">
            <CricketBallIcon size={18} variant="red" />
            <span>{bowlTeam.name} — Bowling Figures</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f4efe6]">
              <TableRow className="border-b border-[#e8e2d5]">
                <TableHead className="pl-6 text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Bowler</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Overs</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Maidens</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Runs</TableHead>
                <TableHead className="text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Wickets</TableHead>
                <TableHead className="pr-6 text-right text-[#0d3a24] font-bold text-[11px] uppercase tracking-wider">Economy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {innings.bowling.map((b) => (
                <TableRow key={b.id} className="border-b border-[#e8e2d5] hover:bg-[#f8f6f0] transition-colors">
                  <TableCell className="pl-6 py-3 font-bold text-sm text-[#111827]">{b.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-[#6b7280] font-mono">{b.overs}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-[#6b7280] font-mono">{b.maidens}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-[#111827] font-mono font-semibold">{b.runsConceded}</TableCell>
                  <TableCell className="text-right font-black tabular-nums text-sm text-[#0d3a24] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-[#0d3a24]/10 border border-[#0d3a24]/20">
                      {b.wickets}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right tabular-nums text-xs font-bold text-[#111827] font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        b.economy < 6
                          ? 'bg-emerald-50 text-emerald-800'
                          : b.economy > 9
                          ? 'bg-amber-50 text-amber-900'
                          : 'text-[#111827]'
                      }`}
                    >
                      {b.economy.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {innings.bowling.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="pl-6 py-4 text-xs text-[#6b7280]">
                    No bowling recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
