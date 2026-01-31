import { describe, it, expect } from 'vitest';
import {
  forecastImpressions,
  forecastBudgetFromImpressions,
  distributeBudget,
  allocateChannelMix,
  calculateTotalWithFees,
  calculateTRPs,
} from './calculations';

describe('forecastImpressions', () => {
  it('calculates impressions from budget and CPM', () => {
    expect(forecastImpressions(50_000, 25)).toBe(2_000_000);
  });

  it('returns 0 when CPM is 0', () => {
    expect(forecastImpressions(50_000, 0)).toBe(0);
  });

  it('handles small CPM values', () => {
    expect(forecastImpressions(100, 0.5)).toBe(200_000);
  });
});

describe('forecastBudgetFromImpressions', () => {
  it('is the inverse of forecastImpressions', () => {
    const budget = 50_000;
    const cpm = 25;
    const impressions = forecastImpressions(budget, cpm);
    expect(forecastBudgetFromImpressions(impressions, cpm)).toBeCloseTo(budget);
  });
});

describe('distributeBudget', () => {
  describe('even pattern', () => {
    it('splits evenly across periods', () => {
      const dist = distributeBudget({ pattern: 'even', totalBudget: 1000, periods: 4 });
      expect(dist).toEqual([250, 250, 250, 250]);
    });

    it('handles single period', () => {
      const dist = distributeBudget({ pattern: 'even', totalBudget: 1000, periods: 1 });
      expect(dist).toEqual([1000]);
    });
  });

  describe('front-loaded pattern', () => {
    it('allocates 60% to first half', () => {
      const dist = distributeBudget({ pattern: 'front-loaded', totalBudget: 1000, periods: 4 });
      const firstHalf = dist.slice(0, 2).reduce((a, b) => a + b, 0);
      const secondHalf = dist.slice(2).reduce((a, b) => a + b, 0);
      expect(firstHalf).toBeCloseTo(600);
      expect(secondHalf).toBeCloseTo(400);
    });

    it('sums to total budget', () => {
      const dist = distributeBudget({ pattern: 'front-loaded', totalBudget: 1000, periods: 5 });
      const sum = dist.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1000);
    });
  });

  describe('back-loaded pattern', () => {
    it('allocates 60% to second half', () => {
      const dist = distributeBudget({ pattern: 'back-loaded', totalBudget: 1000, periods: 4 });
      const firstHalf = dist.slice(0, 2).reduce((a, b) => a + b, 0);
      const secondHalf = dist.slice(2).reduce((a, b) => a + b, 0);
      expect(firstHalf).toBeCloseTo(400);
      expect(secondHalf).toBeCloseTo(600);
    });
  });

  describe('seasonal pattern', () => {
    it('distributes by seasonal indices', () => {
      const dist = distributeBudget({
        pattern: 'seasonal',
        totalBudget: 1000,
        periods: 4,
        seasonalIndices: [1, 2, 3, 4],
      });
      expect(dist[0]).toBeCloseTo(100);
      expect(dist[1]).toBeCloseTo(200);
      expect(dist[2]).toBeCloseTo(300);
      expect(dist[3]).toBeCloseTo(400);
    });

    it('falls back to even when no indices provided', () => {
      const dist = distributeBudget({
        pattern: 'seasonal',
        totalBudget: 1000,
        periods: 4,
      });
      expect(dist).toEqual([250, 250, 250, 250]);
    });
  });

  describe('custom pattern', () => {
    it('distributes by custom weights', () => {
      const dist = distributeBudget({
        pattern: 'custom',
        totalBudget: 1000,
        periods: 3,
        customWeights: [1, 1, 2],
      });
      expect(dist[0]).toBeCloseTo(250);
      expect(dist[1]).toBeCloseTo(250);
      expect(dist[2]).toBeCloseTo(500);
    });
  });

  it('always sums to total budget regardless of pattern', () => {
    const patterns = ['even', 'front-loaded', 'back-loaded'] as const;
    for (const pattern of patterns) {
      const dist = distributeBudget({ pattern, totalBudget: 123_456, periods: 7 });
      const sum = dist.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(123_456);
    }
  });
});

describe('allocateChannelMix', () => {
  it('allocates budget by percentage', () => {
    const result = allocateChannelMix(100_000, [
      { channelId: 'a', percentage: 60 },
      { channelId: 'b', percentage: 40 },
    ]);
    expect(result.get('a')).toBe(60_000);
    expect(result.get('b')).toBe(40_000);
  });

  it('throws when percentages do not sum to 100', () => {
    expect(() =>
      allocateChannelMix(100_000, [
        { channelId: 'a', percentage: 50 },
        { channelId: 'b', percentage: 30 },
      ]),
    ).toThrow('Channel mix percentages must sum to 100%');
  });

  it('respects minSpend constraints', () => {
    const result = allocateChannelMix(10_000, [
      { channelId: 'a', percentage: 10, minSpend: 5_000 },
      { channelId: 'b', percentage: 90 },
    ]);
    expect(result.get('a')).toBe(5_000);
  });

  it('respects maxSpend constraints', () => {
    const result = allocateChannelMix(100_000, [
      { channelId: 'a', percentage: 80, maxSpend: 50_000 },
      { channelId: 'b', percentage: 20 },
    ]);
    expect(result.get('a')).toBe(50_000);
  });
});

describe('calculateTotalWithFees', () => {
  it('calculates percentage fees', () => {
    const result = calculateTotalWithFees(10_000, {
      type: 'percentage',
      percentageFee: 0.15,
      appliesTo: 'media',
    });
    expect(result.fees).toBe(1_500);
    expect(result.total).toBe(11_500);
  });

  it('calculates flat fees', () => {
    const result = calculateTotalWithFees(10_000, {
      type: 'flat',
      flatFee: 500,
      appliesTo: 'media',
    });
    expect(result.fees).toBe(500);
    expect(result.total).toBe(10_500);
  });

  it('calculates hybrid fees', () => {
    const result = calculateTotalWithFees(10_000, {
      type: 'hybrid',
      percentageFee: 0.10,
      flatFee: 200,
      appliesTo: 'media',
    });
    expect(result.fees).toBe(1_200);
    expect(result.total).toBe(11_200);
  });
});

describe('calculateTRPs', () => {
  it('calculates TRPs from impressions and universe', () => {
    expect(calculateTRPs(3_643_402, 3_643_402)).toBeCloseTo(100);
  });

  it('returns 0 when universe is 0', () => {
    expect(calculateTRPs(1_000_000, 0)).toBe(0);
  });
});
