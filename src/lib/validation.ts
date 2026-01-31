import type { UTMParams, UTMCampaignName, ValidationRule } from '../types';

export const validationRules: Record<string, ValidationRule> = {
  budget: { min: 0, max: 100_000_000, required: true },
  impressions: { min: 0, max: 10_000_000_000 },
  cpm: { min: 0.01, max: 500, required: true },
  weight: { min: 0, max: 1, sumTo: 1 },
  vcr: { min: 0, max: 1, format: 'percentage' },
  pacing: { min: 0, max: 5, warningThreshold: { under: 0.90, over: 1.10 } },
};

/** Lowercase, replace spaces with hyphens, strip special characters */
export function sanitizeUTMValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '');
}

/** Build campaign name from structured parts: [Client]_[Product]_[Audience]_[CreativeID] */
export function buildCampaignName(parts: UTMCampaignName): string {
  return [parts.client, parts.product, parts.audience, parts.creativeId]
    .map(sanitizeUTMValue)
    .join('_');
}

/** Build full UTM query string from params */
export function buildUTMString(params: UTMParams, baseUrl?: string): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  const queryString = entries
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join('&');

  if (!baseUrl) return queryString;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${queryString}`;
}

/** Validate UTM params — returns array of error messages (empty = valid) */
export function validateUTMParams(params: UTMParams): string[] {
  const errors: string[] = [];

  if (!params.utm_source || params.utm_source.trim() === '') {
    errors.push('utm_source is required');
  }
  if (!params.utm_medium || params.utm_medium.trim() === '') {
    errors.push('utm_medium is required');
  }
  if (!params.utm_campaign || params.utm_campaign.trim() === '') {
    errors.push('utm_campaign is required');
  }

  const illegalPattern = /[^a-z0-9\-_.%]/;
  for (const [key, value] of Object.entries(params)) {
    if (value && illegalPattern.test(value)) {
      errors.push(
        `${key} contains illegal characters. Use lowercase, hyphens, underscores only.`,
      );
    }
  }

  return errors;
}

/** Validate a numeric value against a named rule */
export function validateNumericValue(value: number, ruleName: string): string | null {
  const rule = validationRules[ruleName];
  if (!rule) return null;
  if (rule.required && (value === null || value === undefined)) {
    return `${ruleName} is required`;
  }
  if (value < rule.min) return `${ruleName} must be at least ${rule.min}`;
  if (value > rule.max) return `${ruleName} must be at most ${rule.max}`;
  return null;
}

/** Check that weights sum to 1.0 (within tolerance) */
export function validateWeights(...weights: number[]): boolean {
  const sum = weights.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 0.01;
}
