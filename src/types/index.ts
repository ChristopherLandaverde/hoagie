// === Channel Configuration ===

export type ObjectiveKPI =
  | 'Awareness-CPM'
  | 'Awareness-CPV'
  | 'Engagement-VCR'
  | 'Engagement-CP Thru-Play'
  | 'Traffic-CP Site Visit'
  | 'Traffic-CPC'
  | 'Conversion-CPA';

export type BuyType = 'cpm' | 'cpc' | 'cpv' | 'cpa' | 'flat' | 'trp';

export type ChannelCategory = 'video' | 'digital' | 'social' | 'audio' | 'ooh';

export interface Tactic {
  id: string;
  name: string;
  adUnits: string[];
  buyType: BuyType;
  platformCPM?: number;
}

export interface MediaChannel {
  id: string;
  name: string;
  category: ChannelCategory;
  objectiveKPI: ObjectiveKPI;
  tactics: Tactic[];
  audienceUniverse?: number;
}

// === Budget & Flighting ===

export interface FlightPeriod {
  startDate: Date;
  endDate: Date;
  weekNumber: number;
  month: string;
  fiscalYear: string;
  fiscalQuarter: string;
}

export interface BudgetAllocation {
  channelId: string;
  tacticId: string;
  period: FlightPeriod;
  plannedSpend: number;
  plannedImpressions: number;
  plannedTRPs?: number;
  notes?: string;
}

export type FlightingPattern = 'even' | 'front-loaded' | 'back-loaded' | 'seasonal' | 'custom';

export interface FlightingConfig {
  pattern: FlightingPattern;
  totalBudget: number;
  periods: number;
  seasonalIndices?: number[];
  customWeights?: number[];
}

export interface ChannelMix {
  channelId: string;
  percentage: number;
  minSpend?: number;
  maxSpend?: number;
}

// === Benchmarks ===

export interface ChannelBenchmark {
  channelId: string;
  objectiveKPI: ObjectiveKPI;
  fyPriorPerformance: number;
  fyPriorBenchmark: number;
  historicalWeight: number;
  planNumber: number;
  planWeight: number;
  actualAdjustment?: number;
  adjustmentWeight: number;
  lcBenchmark: number;
}

// === Pacing ===

export interface PacingData {
  channelId: string;
  period: string;
  plannedSpend: number;
  plannedImpressions: number;
  actualSpend: number;
  actualImpressions: number;
  actualPerformanceMetric: number;
}

export type PacingStatus = 'on-track' | 'under-pacing' | 'over-pacing';

export interface PacingResult {
  spendPacing: number;
  impressionPacing: number;
  performanceVsBenchmark: number;
  status: PacingStatus;
}

// === Fees & Fiscal ===

export type FeeType = 'percentage' | 'flat' | 'hybrid';

export interface FeeStructure {
  type: FeeType;
  percentageFee?: number;
  flatFee?: number;
  appliesTo: 'media' | 'production' | 'all';
}

export interface FeeResult {
  mediaSpend: number;
  fees: number;
  total: number;
}

export interface FiscalSummary {
  fiscalYear: string;
  quarter: string;
  channelBreakdown: {
    channelId: string;
    spend: number;
    impressions: number;
    performanceMetric: number;
  }[];
  totalSpend: number;
  totalImpressions: number;
  totalTRPs?: number;
  priorYearSpend: number;
  yoyChange: number;
}

// === UTM ===

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
}

export interface UTMCampaignName {
  client: string;
  product: string;
  audience: string;
  creativeId: string;
}

// === Validation ===

export interface ValidationRule {
  min: number;
  max: number;
  required?: boolean;
  format?: string;
  sumTo?: number;
  warningThreshold?: { under: number; over: number };
}

export type MediaPlanningError =
  | 'INVALID_BUDGET'
  | 'MISSING_BENCHMARK'
  | 'WEIGHT_SUM_ERROR'
  | 'DIVISION_BY_ZERO'
  | 'DATE_RANGE_ERROR'
  | 'CHANNEL_NOT_FOUND';

// === Excel Tables ===

export interface ChannelTableRow {
  source: string;
  medium: string;
  defaultCPC: number;
  defaultCTR: number;
}

export interface BudgetTableRow {
  campaignName: string;
  utmString: string;
  monthlyBudget: number;
  startDate: Date;
}

export interface ForecastTableRow {
  date: Date;
  projectedSpend: number;
  projectedConversions: number;
  formulaType: string;
}
