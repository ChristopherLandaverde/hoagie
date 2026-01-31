import { useState, Fragment } from 'react';
import type { MediaChannel } from '../../types';
import type { ChannelMixEntry } from '../../store';
import type { ForecastConfig } from '../../store';
import { distributeBudget, forecastImpressions } from '../../lib/calculations';
import { getChannelById } from '../../constants/channels';

interface PreviewRow {
  channel: string;
  budget: number;
  impressions: number;
  fees: number;
  total: number;
}

interface Props {
  rows: PreviewRow[];
  channels: MediaChannel[];
  mix: ChannelMixEntry[];
  config: ForecastConfig;
  isWriting: boolean;
  writeSuccess: boolean;
  writeError: string | null;
  onWrite: () => void;
  onClearAndRewrite: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US').format(Math.round(n));

export function ForecastPreviewSection({
  rows,
  mix,
  config,
  isWriting,
  writeSuccess,
  writeError,
  onWrite,
  onClearAndRewrite,
  isOpen,
  onToggle,
}: Props) {
  const [showPeriods, setShowPeriods] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      impressions: acc.impressions + r.impressions,
      fees: acc.fees + r.fees,
      total: acc.total + r.total,
    }),
    { budget: 0, impressions: 0, fees: 0, total: 0 },
  );

  const getPeriodsForChannel = (channelName: string) => {
    const entry = mix.find((e) => {
      const ch = getChannelById(e.channelId);
      return ch?.name === channelName;
    });
    if (!entry) return [];

    const channelBudget = (entry.percentage / 100) * config.totalBudget;
    const cpm = entry.cpmOverride ?? 0;
    const distribution = distributeBudget({
      pattern: config.flightingPattern,
      totalBudget: channelBudget,
      periods: config.periods,
      seasonalIndices: config.seasonalIndices,
      customWeights: config.customWeights,
    });

    return distribution.map((budget, i) => ({
      period: i + 1,
      budget,
      impressions: cpm > 0 ? forecastImpressions(budget, cpm) : 0,
    }));
  };

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-300">
          Preview &amp; Write
          {rows.length > 0 && !isOpen && (
            <span className="ml-1.5 text-xs font-normal text-zinc-500">
              ({formatCurrency(totals.total)})
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-3 space-y-3">
          {rows.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Configure budget, channels, and fees above to see a preview.
            </p>
          ) : (
            <>
              {/* Toggle for period detail */}
              <div className="flex items-center justify-end">
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPeriods}
                    onChange={(e) => {
                      setShowPeriods(e.target.checked);
                      if (!e.target.checked) setExpandedChannel(null);
                    }}
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  Show period detail
                </label>
              </div>

              {/* Summary table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-700">
                      <th className="text-left py-1 pr-2">Channel</th>
                      <th className="text-right py-1 pr-2">Budget</th>
                      <th className="text-right py-1 pr-2">Est. Impr.</th>
                      <th className="text-right py-1 pr-2">Fees</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isExpanded = showPeriods && expandedChannel === r.channel;
                      const periods = isExpanded ? getPeriodsForChannel(r.channel) : [];
                      return (
                        <Fragment key={i}>
                          <tr
                            className={`border-b border-zinc-800 text-zinc-300 ${showPeriods ? 'cursor-pointer hover:bg-zinc-800/50' : ''}`}
                            onClick={() => {
                              if (showPeriods) {
                                setExpandedChannel(isExpanded ? null : r.channel);
                              }
                            }}
                          >
                            <td className="py-1 pr-2">
                              {showPeriods && (
                                <span className="inline-block w-3 text-zinc-600">
                                  {isExpanded ? '▾' : '▸'}
                                </span>
                              )}
                              {r.channel}
                            </td>
                            <td className="text-right py-1 pr-2">{formatCurrency(r.budget)}</td>
                            <td className="text-right py-1 pr-2">{formatNumber(r.impressions)}</td>
                            <td className="text-right py-1 pr-2">{formatCurrency(r.fees)}</td>
                            <td className="text-right py-1">{formatCurrency(r.total)}</td>
                          </tr>
                          {isExpanded && periods.map((p) => (
                            <tr key={`${i}-p${p.period}`} className="text-zinc-500 bg-zinc-900/50">
                              <td className="py-0.5 pr-2 pl-6">P{p.period}</td>
                              <td className="text-right py-0.5 pr-2">{formatCurrency(p.budget)}</td>
                              <td className="text-right py-0.5 pr-2">{formatNumber(p.impressions)}</td>
                              <td className="text-right py-0.5 pr-2">—</td>
                              <td className="text-right py-0.5">—</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    <tr className="font-semibold text-zinc-200">
                      <td className="py-1 pr-2">{showPeriods && <span className="inline-block w-3" />}Total</td>
                      <td className="text-right py-1 pr-2">{formatCurrency(totals.budget)}</td>
                      <td className="text-right py-1 pr-2">{formatNumber(totals.impressions)}</td>
                      <td className="text-right py-1 pr-2">{formatCurrency(totals.fees)}</td>
                      <td className="text-right py-1">{formatCurrency(totals.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Row count summary */}
              <p className="text-xs text-zinc-600">
                {rows.length} channel{rows.length !== 1 ? 's' : ''} &times; {config.periods} period{config.periods !== 1 ? 's' : ''} = {rows.length * config.periods} rows in Excel
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onWrite}
                  disabled={isWriting}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isWriting ? 'Writing...' : 'Write to Excel'}
                </button>
                <button
                  onClick={onClearAndRewrite}
                  disabled={isWriting}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                >
                  {isWriting ? 'Writing...' : 'Clear & Rewrite'}
                </button>
              </div>

              {writeSuccess && (
                <div className="px-3 py-2 bg-emerald-900/30 border border-emerald-800 rounded-md">
                  <p className="text-xs text-emerald-300">
                    Forecast written to Excel with live formulas.
                  </p>
                </div>
              )}

              {writeError && (
                <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-md">
                  <p className="text-xs text-red-300">{writeError}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

