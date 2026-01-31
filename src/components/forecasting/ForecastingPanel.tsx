import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMediaPlannerStore } from '../../store';
import type { ForecastConfig } from '../../store';
import { distributeBudget, forecastImpressions } from '../../lib/calculations';
import {
  clearForecastTable,
  writeForecastToSheet,
  writeForecastSummary,
  applyForecastFormatting,
} from '../../lib/excel';
import type { ForecastRow } from '../../lib/excel';
import { getChannelById } from '../../constants/channels';
import { CampaignSetupSection } from './CampaignSetupSection';
import { ChannelMixSection } from './ChannelMixSection';
import { FeeConfigSection } from './FeeConfigSection';
import { ForecastPreviewSection } from './ForecastPreviewSection';

const DEFAULT_CONFIG: ForecastConfig = {
  totalBudget: 0,
  periods: 4,
  flightingPattern: 'even',
  seasonalIndices: [1, 1, 1, 1],
  customWeights: [1, 1, 1, 1],
  feeType: 'percentage',
  feePct: 0,
  feeFlat: 0,
};

export function ForecastingPanel() {
  const { channels, channelMix, setChannelMix, addChannelToMix, removeChannelFromMix, updateChannelMixEntry } =
    useMediaPlannerStore();

  const [config, setConfig] = useState<ForecastConfig>(DEFAULT_CONFIG);
  const [openSections, setOpenSections] = useState({
    setup: true,
    mix: true,
    fees: false,
    preview: true,
  });
  const [isWriting, setIsWriting] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (writeSuccess) {
      successTimerRef.current = setTimeout(() => setWriteSuccess(false), 4000);
      return () => clearTimeout(successTimerRef.current);
    }
  }, [writeSuccess]);

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const handleAutoBalance = useCallback(() => {
    if (channelMix.length === 0) return;
    const even = 100 / channelMix.length;
    const balanced = channelMix.map((e) => ({ ...e, percentage: parseFloat(even.toFixed(2)) }));
    // Fix rounding: give remainder to first entry
    const sum = balanced.reduce((s, e) => s + e.percentage, 0);
    if (balanced.length > 0) {
      balanced[0].percentage += parseFloat((100 - sum).toFixed(2));
    }
    setChannelMix(balanced);
  }, [channelMix, setChannelMix]);

  // Compute preview rows (one per channel, aggregated across periods)
  const previewRows = useMemo(() => {
    if (config.totalBudget <= 0 || channelMix.length === 0) return [];

    const totalPct = channelMix.reduce((s, e) => s + e.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.5) return [];

    return channelMix.map((entry) => {
      const ch = getChannelById(entry.channelId);
      const channelBudget = (entry.percentage / 100) * config.totalBudget;
      const cpm = entry.cpmOverride ?? 0;
      const impressions = cpm > 0 ? forecastImpressions(channelBudget, cpm) : 0;

      let fees = 0;
      switch (config.feeType) {
        case 'percentage':
          fees = channelBudget * config.feePct;
          break;
        case 'flat':
          fees = config.feeFlat * config.periods;
          break;
        case 'hybrid':
          fees = channelBudget * config.feePct + config.feeFlat * config.periods;
          break;
      }

      return {
        channel: ch?.name ?? entry.channelId,
        budget: channelBudget,
        impressions,
        fees,
        total: channelBudget + fees,
      };
    });
  }, [config, channelMix]);

  // Build full forecast rows (channels x periods)
  const buildForecastRows = useCallback((): ForecastRow[] => {
    const rows: ForecastRow[] = [];

    for (const entry of channelMix) {
      const ch = getChannelById(entry.channelId);
      const tactic = ch?.tactics.find((t) => t.id === entry.tacticId) ?? ch?.tactics[0];
      const channelBudget = (entry.percentage / 100) * config.totalBudget;
      const cpm = entry.cpmOverride ?? tactic?.platformCPM ?? 0;
      const universe = ch?.audienceUniverse ?? 0;

      // Distribute this channel's budget across periods
      const distribution = distributeBudget({
        pattern: config.flightingPattern,
        totalBudget: channelBudget,
        periods: config.periods,
        seasonalIndices: config.seasonalIndices,
        customWeights: config.customWeights,
      });

      // Fee per period
      let feePctPerRow = 0;
      let feeFlatPerRow = 0;
      if (config.feeType === 'percentage' || config.feeType === 'hybrid') {
        feePctPerRow = config.feePct;
      }
      if (config.feeType === 'flat' || config.feeType === 'hybrid') {
        feeFlatPerRow = config.feeFlat;
      }

      for (let p = 0; p < config.periods; p++) {
        rows.push({
          period: p + 1,
          channel: ch?.name ?? entry.channelId,
          tactic: tactic?.name ?? '',
          buyType: tactic?.buyType ?? '',
          budget: distribution[p],
          cpm,
          universe,
          feePct: feePctPerRow,
          feeFlat: feeFlatPerRow,
        });
      }
    }

    return rows;
  }, [channelMix, config]);

  const validate = (): string[] => {
    const errors: string[] = [];
    if (config.totalBudget <= 0) errors.push('Budget must be greater than 0.');
    if (config.periods <= 0) errors.push('Periods must be at least 1.');
    if (channelMix.length === 0) errors.push('Add at least one channel.');
    const totalPct = channelMix.reduce((s, e) => s + e.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.5) {
      errors.push(`Channel allocation is ${totalPct.toFixed(1)}%, must equal 100%.`);
    }
    return errors;
  };

  const handleWrite = async (clearFirst: boolean) => {
    const errors = validate();
    if (errors.length > 0) {
      setWriteError(errors.join(' '));
      setWriteSuccess(false);
      return;
    }

    setIsWriting(true);
    setWriteError(null);
    setWriteSuccess(false);

    try {
      const rows = buildForecastRows();

      if (clearFirst) {
        await clearForecastTable();
      }

      await writeForecastToSheet(rows);
      await writeForecastSummary(rows.length);
      await applyForecastFormatting(rows.length);

      setWriteSuccess(true);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : 'Failed to write forecast to Excel.');
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-300">Impression Forecasting</h2>

      <CampaignSetupSection
        config={config}
        onChange={setConfig}
        isOpen={openSections.setup}
        onToggle={() => toggleSection('setup')}
      />

      <ChannelMixSection
        channels={channels}
        mix={channelMix}
        onAdd={addChannelToMix}
        onRemove={removeChannelFromMix}
        onUpdate={updateChannelMixEntry}
        onAutoBalance={handleAutoBalance}
        isOpen={openSections.mix}
        onToggle={() => toggleSection('mix')}
      />

      <FeeConfigSection
        config={config}
        onChange={setConfig}
        totalBudget={config.totalBudget}
        isOpen={openSections.fees}
        onToggle={() => toggleSection('fees')}
      />

      <ForecastPreviewSection
        rows={previewRows}
        channels={channels}
        mix={channelMix}
        config={config}
        isWriting={isWriting}
        writeSuccess={writeSuccess}
        writeError={writeError}
        onWrite={() => handleWrite(false)}
        onClearAndRewrite={() => handleWrite(true)}
        isOpen={openSections.preview}
        onToggle={() => toggleSection('preview')}
      />
    </div>
  );
}
