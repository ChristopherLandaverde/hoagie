import { describe, it, expect } from 'vitest';
import {
  sanitizeUTMValue,
  buildCampaignName,
  buildUTMString,
  validateUTMParams,
  validateNumericValue,
  validateWeights,
} from './validation';

describe('sanitizeUTMValue', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(sanitizeUTMValue('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(sanitizeUTMValue('test@#$value')).toBe('testvalue');
  });

  it('handles empty string', () => {
    expect(sanitizeUTMValue('')).toBe('');
  });
});

describe('buildCampaignName', () => {
  it('joins parts with underscores', () => {
    const result = buildCampaignName({
      client: 'Acme',
      product: 'Widget',
      audience: 'B2B',
      creativeId: 'v1',
    });
    expect(result).toBe('acme_widget_b2b_v1');
  });
});

describe('buildUTMString', () => {
  it('builds a full UTM query string', () => {
    const result = buildUTMString({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring-sale',
    });
    expect(result).toContain('utm_source=google');
    expect(result).toContain('utm_medium=cpc');
    expect(result).toContain('utm_campaign=spring-sale');
  });

  it('appends to base URL when provided', () => {
    const result = buildUTMString(
      { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'test' },
      'https://example.com',
    );
    expect(result).toMatch(/^https:\/\/example\.com\?/);
  });
});

describe('validateUTMParams', () => {
  it('returns empty array for valid params', () => {
    const errors = validateUTMParams({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'test',
    });
    expect(errors).toEqual([]);
  });

  it('returns errors for missing required fields', () => {
    const errors = validateUTMParams({
      utm_source: '',
      utm_medium: 'cpc',
      utm_campaign: 'test',
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateNumericValue', () => {
  it('returns null for valid budget', () => {
    expect(validateNumericValue(50_000, 'budget')).toBeNull();
  });

  it('returns error for negative budget', () => {
    const result = validateNumericValue(-1, 'budget');
    expect(result).not.toBeNull();
  });

  it('returns error for budget exceeding max', () => {
    const result = validateNumericValue(200_000_000, 'budget');
    expect(result).not.toBeNull();
  });
});

describe('validateWeights', () => {
  it('returns true when weights sum to 1', () => {
    expect(validateWeights(0.5, 0.3, 0.2)).toBe(true);
  });

  it('returns false when weights do not sum to 1', () => {
    expect(validateWeights(0.5, 0.3, 0.3)).toBe(false);
  });

  it('tolerates small rounding errors', () => {
    expect(validateWeights(0.1, 0.2, 0.7)).toBe(true);
  });
});
