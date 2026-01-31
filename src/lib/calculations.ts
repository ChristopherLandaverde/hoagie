import type {
  ChannelBenchmark,
  ChannelMix,
  FeeStructure,
  FeeResult,
  FlightingConfig,
  MediaPlanningError,
  PacingData,
  PacingResult,
  PacingStatus,
} from '../types';

// === Weighted Benchmark ===

export function calculateLCBenchmark(benchmark: ChannelBenchmark): number {
  const {
    fyPriorPerformance,
    historicalWeight,
    planNumber,
    planWeight,
    actualAdjustment = 0,
    adjustmentWeight,
  } = benchmark;

  const totalWeight = historicalWeight + planWeight + adjustmentWeight;
  if (totalWeight === 0) return 0;

  const lcBenchmark =
    fyPriorPerformance * historicalWeight +
    planNumber * planWeight +
    actualAdjustment * adjustmentWeight;

  return lcBenchmark / totalWeight;
}

// === Impression Forecasting ===

export function forecastImpressions(budget: number, cpm: number): number {
  if (cpm === 0) return 0;
  return (budget / cpm) * 1000;
}

export function forecastBudgetFromImpressions(impressions: number, cpm: number): number {
  return (impressions / 1000) * cpm;
}

// === TRP Calculations ===

export function calculateTRPs(impressions: number, universeSize: number): number {
  if (universeSize === 0) return 0;
  return (impressions / universeSize) * 100;
}

export function calculateCPP(spend: number, trps: number): number {
  if (trps === 0) return 0;
  return spend / trps;
}

export function impressionsFromTRPs(trps: number, universeSize: number): number {
  return (trps / 100) * universeSize;
}

// === Performance Metrics ===

export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}

export function calculateVCR(completedViews: number, impressions: number): number {
  if (impressions === 0) return 0;
  return completedViews / impressions;
}

export function calculateCPCV(spend: number, completedViews: number): number {
  if (completedViews === 0) return 0;
  return spend / completedViews;
}

export function calculateCPLPV(spend: number, landingPageViews: number): number {
  if (landingPageViews === 0) return 0;
  return spend / landingPageViews;
}

export function calculateCVR(conversions: number, impressions: number): number {
  if (impressions === 0) return 0;
  return conversions / impressions;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return clicks / impressions;
}

export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) return 0;
  return spend / clicks;
}

export function calculateCPThruPlay(spend: number, thruPlays: number): number {
  if (thruPlays === 0) return 0;
  return spend / thruPlays;
}

// === Budget Distribution ===

export function distributeBudget(config: FlightingConfig): number[] {
  const { pattern, totalBudget, periods, seasonalIndices, customWeights } = config;

  switch (pattern) {
    case 'even':
      return Array(periods).fill(totalBudget / periods) as number[];

    case 'front-loaded': {
      const frontHalf = Math.ceil(periods / 2);
      const frontAmount = (totalBudget * 0.6) / frontHalf;
      const backAmount = (totalBudget * 0.4) / (periods - frontHalf);
      return [
        ...Array(frontHalf).fill(frontAmount) as number[],
        ...Array(periods - frontHalf).fill(backAmount) as number[],
      ];
    }

    case 'back-loaded': {
      const firstHalf = Math.ceil(periods / 2);
      const firstAmount = (totalBudget * 0.4) / firstHalf;
      const secondAmount = (totalBudget * 0.6) / (periods - firstHalf);
      return [
        ...Array(firstHalf).fill(firstAmount) as number[],
        ...Array(periods - firstHalf).fill(secondAmount) as number[],
      ];
    }

    case 'seasonal': {
      if (!seasonalIndices || seasonalIndices.length === 0) {
        return Array(periods).fill(totalBudget / periods) as number[];
      }
      const totalIndex = seasonalIndices.reduce((a, b) => a + b, 0);
      return seasonalIndices.map((idx) => (idx / totalIndex) * totalBudget);
    }

    case 'custom': {
      if (!customWeights || customWeights.length === 0) {
        return Array(periods).fill(totalBudget / periods) as number[];
      }
      const totalWeight = customWeights.reduce((a, b) => a + b, 0);
      return customWeights.map((w) => (w / totalWeight) * totalBudget);
    }

    default:
      return Array(periods).fill(totalBudget / periods) as number[];
  }
}

// === Channel Mix Allocation ===

export function allocateChannelMix(
  totalBudget: number,
  channelMix: ChannelMix[],
): Map<string, number> {
  const allocations = new Map<string, number>();

  const totalPct = channelMix.reduce((sum, ch) => sum + ch.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error('Channel mix percentages must sum to 100%');
  }

  channelMix.forEach((channel) => {
    let allocation = (channel.percentage / 100) * totalBudget;
    if (channel.minSpend !== undefined) allocation = Math.max(allocation, channel.minSpend);
    if (channel.maxSpend !== undefined) allocation = Math.min(allocation, channel.maxSpend);
    allocations.set(channel.channelId, allocation);
  });

  return allocations;
}

// === Pacing ===

export function calculatePacing(data: PacingData, benchmark: number): PacingResult {
  const spendPacing = data.plannedSpend === 0 ? 0 : data.actualSpend / data.plannedSpend;
  const impressionPacing =
    data.plannedImpressions === 0 ? 0 : data.actualImpressions / data.plannedImpressions;
  const performanceVsBenchmark =
    benchmark === 0 ? 0 : (data.actualPerformanceMetric - benchmark) / benchmark;

  let status: PacingStatus;
  if (spendPacing >= 0.95 && spendPacing <= 1.05) {
    status = 'on-track';
  } else if (spendPacing < 0.95) {
    status = 'under-pacing';
  } else {
    status = 'over-pacing';
  }

  return { spendPacing, impressionPacing, performanceVsBenchmark, status };
}

export function calculateYTDPacing(monthlyData: PacingData[]): {
  ytdPlannedSpend: number;
  ytdPlannedImpressions: number;
  ytdActualSpend: number;
  ytdActualImpressions: number;
  ytdSpendPacing: number;
  ytdImpressionPacing: number;
} {
  const ytdPlannedSpend = monthlyData.reduce((sum, d) => sum + d.plannedSpend, 0);
  const ytdPlannedImpressions = monthlyData.reduce((sum, d) => sum + d.plannedImpressions, 0);
  const ytdActualSpend = monthlyData.reduce((sum, d) => sum + d.actualSpend, 0);
  const ytdActualImpressions = monthlyData.reduce((sum, d) => sum + d.actualImpressions, 0);

  return {
    ytdPlannedSpend,
    ytdPlannedImpressions,
    ytdActualSpend,
    ytdActualImpressions,
    ytdSpendPacing: ytdPlannedSpend === 0 ? 0 : ytdActualSpend / ytdPlannedSpend,
    ytdImpressionPacing: ytdPlannedImpressions === 0 ? 0 : ytdActualImpressions / ytdPlannedImpressions,
  };
}

// === Fees ===

export function calculateTotalWithFees(
  mediaSpend: number,
  feeStructure: FeeStructure,
): FeeResult {
  let fees = 0;

  switch (feeStructure.type) {
    case 'percentage':
      fees = mediaSpend * (feeStructure.percentageFee ?? 0);
      break;
    case 'flat':
      fees = feeStructure.flatFee ?? 0;
      break;
    case 'hybrid':
      fees = mediaSpend * (feeStructure.percentageFee ?? 0) + (feeStructure.flatFee ?? 0);
      break;
  }

  return { mediaSpend, fees, total: mediaSpend + fees };
}

// === Year-over-Year ===

export function calculateYoYChange(currentYearSpend: number, priorYearSpend: number): number {
  if (priorYearSpend === 0) return 0;
  return (currentYearSpend - priorYearSpend) / priorYearSpend;
}

// === Error Handling ===

export function handleCalculationError(error: MediaPlanningError, context: string): string {
  const messages: Record<MediaPlanningError, string> = {
    INVALID_BUDGET: 'Budget must be a positive number',
    MISSING_BENCHMARK: 'Benchmark not configured for this channel',
    WEIGHT_SUM_ERROR: 'Benchmark weights must sum to 1.0',
    DIVISION_BY_ZERO: 'Cannot calculate — division by zero',
    DATE_RANGE_ERROR: 'Invalid date range for flight period',
    CHANNEL_NOT_FOUND: 'Channel configuration not found',
  };

  return `${context}: ${messages[error]}`;
}
