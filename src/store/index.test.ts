import { describe, it, expect, beforeEach } from 'vitest';
import { useMediaPlannerStore } from './index';

describe('useMediaPlannerStore — channelMix actions', () => {
  beforeEach(() => {
    // Reset channelMix before each test
    useMediaPlannerStore.setState({ channelMix: [] });
  });

  it('addChannelToMix adds a new entry', () => {
    const entry = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 50, cpmOverride: 38 };
    useMediaPlannerStore.getState().addChannelToMix(entry);
    expect(useMediaPlannerStore.getState().channelMix).toHaveLength(1);
    expect(useMediaPlannerStore.getState().channelMix[0]).toEqual(entry);
  });

  it('addChannelToMix prevents duplicate channelId', () => {
    const entry = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 50, cpmOverride: 38 };
    useMediaPlannerStore.getState().addChannelToMix(entry);
    useMediaPlannerStore.getState().addChannelToMix(entry);
    expect(useMediaPlannerStore.getState().channelMix).toHaveLength(1);
  });

  it('removeChannelFromMix removes by channelId', () => {
    const entry1 = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 50, cpmOverride: 38 };
    const entry2 = { channelId: 'olv', tacticId: 'olv-preroll', percentage: 50, cpmOverride: 15 };
    useMediaPlannerStore.getState().addChannelToMix(entry1);
    useMediaPlannerStore.getState().addChannelToMix(entry2);
    useMediaPlannerStore.getState().removeChannelFromMix('ctv');
    const mix = useMediaPlannerStore.getState().channelMix;
    expect(mix).toHaveLength(1);
    expect(mix[0].channelId).toBe('olv');
  });

  it('updateChannelMixEntry updates fields for matching channelId', () => {
    const entry = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 50, cpmOverride: 38 };
    useMediaPlannerStore.getState().addChannelToMix(entry);
    useMediaPlannerStore.getState().updateChannelMixEntry('ctv', { percentage: 75, cpmOverride: 42 });
    const updated = useMediaPlannerStore.getState().channelMix[0];
    expect(updated.percentage).toBe(75);
    expect(updated.cpmOverride).toBe(42);
    expect(updated.tacticId).toBe('ctv-preroll');
  });

  it('updateChannelMixEntry does not affect other entries', () => {
    const entry1 = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 50, cpmOverride: 38 };
    const entry2 = { channelId: 'olv', tacticId: 'olv-preroll', percentage: 50, cpmOverride: 15 };
    useMediaPlannerStore.getState().addChannelToMix(entry1);
    useMediaPlannerStore.getState().addChannelToMix(entry2);
    useMediaPlannerStore.getState().updateChannelMixEntry('ctv', { percentage: 80 });
    expect(useMediaPlannerStore.getState().channelMix[1].percentage).toBe(50);
  });

  it('setChannelMix replaces the entire array', () => {
    const entry = { channelId: 'ctv', tacticId: 'ctv-preroll', percentage: 100, cpmOverride: 38 };
    useMediaPlannerStore.getState().addChannelToMix(entry);
    useMediaPlannerStore.getState().setChannelMix([]);
    expect(useMediaPlannerStore.getState().channelMix).toHaveLength(0);
  });
});

describe('useMediaPlannerStore — forecastConfig', () => {
  it('setForecastConfig stores config', () => {
    const config = {
      totalBudget: 500_000,
      periods: 12,
      flightingPattern: 'even' as const,
      seasonalIndices: Array(12).fill(1) as number[],
      customWeights: Array(12).fill(1) as number[],
      feeType: 'percentage' as const,
      feePct: 0.15,
      feeFlat: 0,
    };
    useMediaPlannerStore.getState().setForecastConfig(config);
    expect(useMediaPlannerStore.getState().forecastConfig).toEqual(config);
  });
});
