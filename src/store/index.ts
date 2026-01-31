import { create } from 'zustand';
import type {
  MediaChannel,
  ChannelBenchmark,
  BudgetAllocation,
  PacingData,
  FlightingPattern,
  FeeType,
} from '../types';
import { MEDIA_CHANNELS } from '../constants/channels';

export interface ForecastConfig {
  totalBudget: number;
  periods: number;
  flightingPattern: FlightingPattern;
  seasonalIndices: number[];
  customWeights: number[];
  feeType: FeeType;
  feePct: number;
  feeFlat: number;
}

export interface ChannelMixEntry {
  channelId: string;
  tacticId: string;
  percentage: number;
  cpmOverride: number | null;
}

interface MediaPlannerState {
  // Data
  channels: MediaChannel[];
  benchmarks: ChannelBenchmark[];
  allocations: BudgetAllocation[];
  pacingData: PacingData[];

  // Forecast state
  forecastConfig: ForecastConfig | null;
  channelMix: ChannelMixEntry[];

  // UI state
  selectedChannelId: string | null;
  activeView: 'utm' | 'forecasting' | 'pacing';
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedChannel: (id: string | null) => void;
  setActiveView: (view: MediaPlannerState['activeView']) => void;
  setBenchmarks: (benchmarks: ChannelBenchmark[]) => void;
  setAllocations: (allocations: BudgetAllocation[]) => void;
  setPacingData: (data: PacingData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Forecast actions
  setForecastConfig: (config: ForecastConfig) => void;
  setChannelMix: (mix: ChannelMixEntry[]) => void;
  addChannelToMix: (entry: ChannelMixEntry) => void;
  removeChannelFromMix: (channelId: string) => void;
  updateChannelMixEntry: (channelId: string, updates: Partial<ChannelMixEntry>) => void;
}

export const useMediaPlannerStore = create<MediaPlannerState>((set) => ({
  channels: MEDIA_CHANNELS,
  benchmarks: [],
  allocations: [],
  pacingData: [],
  forecastConfig: null,
  channelMix: [],
  selectedChannelId: null,
  activeView: 'utm',
  isLoading: false,
  error: null,

  setSelectedChannel: (id) => set({ selectedChannelId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setBenchmarks: (benchmarks) => set({ benchmarks }),
  setAllocations: (allocations) => set({ allocations }),
  setPacingData: (data) => set({ pacingData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setForecastConfig: (config) => set({ forecastConfig: config }),
  setChannelMix: (mix) => set({ channelMix: mix }),
  addChannelToMix: (entry) =>
    set((state) => {
      if (state.channelMix.some((e) => e.channelId === entry.channelId)) return state;
      return { channelMix: [...state.channelMix, entry] };
    }),
  removeChannelFromMix: (channelId) =>
    set((state) => ({
      channelMix: state.channelMix.filter((e) => e.channelId !== channelId),
    })),
  updateChannelMixEntry: (channelId, updates) =>
    set((state) => ({
      channelMix: state.channelMix.map((e) =>
        e.channelId === channelId ? { ...e, ...updates } : e,
      ),
    })),
}));
