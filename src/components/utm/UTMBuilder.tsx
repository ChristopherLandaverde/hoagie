import { useState } from 'react';
import { useMediaPlannerStore } from '../../store';
import {
  sanitizeUTMValue,
  buildUTMString,
  validateUTMParams,
} from '../../lib/validation';
import { batchAppendUTMsToTable } from '../../lib/excel';
import type { UTMParams } from '../../types';

interface QueuedUTM {
  landingPageUrl: string;
  campaignName: string;
  source: string;
  medium: string;
  utmString: string;
}

export function UTMBuilder() {
  const { channels } = useMediaPlannerStore();
  const [baseUrl, setBaseUrl] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [queue, setQueue] = useState<QueuedUTM[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [writeSuccess, setWriteSuccess] = useState(false);

  const clearForm = () => {
    setBaseUrl('');
    setCampaignName('');
    setSource('');
    setMedium('');
    setContent('');
    setTerm('');
    setErrors([]);
  };

  const handleAddToQueue = () => {
    const params: UTMParams = {
      utm_source: sanitizeUTMValue(source),
      utm_medium: sanitizeUTMValue(medium),
      utm_campaign: sanitizeUTMValue(campaignName),
      utm_content: content ? sanitizeUTMValue(content) : undefined,
      utm_term: term ? sanitizeUTMValue(term) : undefined,
    };

    const validationErrors = validateUTMParams(params);
    if (!baseUrl.trim()) {
      validationErrors.push('Landing page URL is required');
    } else {
      try {
        new URL(baseUrl);
      } catch {
        validationErrors.push('Landing page URL must be a valid URL (e.g. https://example.com)');
      }
    }
    if (!campaignName.trim()) {
      validationErrors.push('Campaign name is required');
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    const utmString = buildUTMString(params, baseUrl);
    setQueue((prev) => [
      ...prev,
      {
        landingPageUrl: baseUrl,
        campaignName: sanitizeUTMValue(campaignName),
        source: sanitizeUTMValue(source),
        medium: sanitizeUTMValue(medium),
        utmString,
      },
    ]);
    clearForm();
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = async (utmString: string, index: number) => {
    try {
      await navigator.clipboard.writeText(utmString);
      setCopied(index);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Fallback for Office Add-in context where clipboard API may be restricted
      const textarea = document.createElement('textarea');
      textarea.value = utmString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(index);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const handleWriteAll = async () => {
    if (queue.length === 0) return;
    try {
      await batchAppendUTMsToTable(queue);
      setQueue([]);
      setWriteSuccess(true);
      setTimeout(() => setWriteSuccess(false), 2000);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to write UTMs to sheet']);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300">UTM Builder</h2>

      {/* Landing Page URL */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Landing Page URL *</label>
        <input
          className={inputClass}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://example.com/landing"
        />
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Campaign Name *</label>
        <input
          className={inputClass}
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g. summer-sale-2025"
        />
      </div>

      {/* Source / Medium */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Source *</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputClass}
          >
            <option value="">Select source&hellip;</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.name.toLowerCase().replace(/\s+/g, '-')}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Medium *</label>
          <select
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className={inputClass}
          >
            <option value="">Select medium&hellip;</option>
            <option value="cpm">CPM</option>
            <option value="cpc">CPC</option>
            <option value="cpv">CPV</option>
            <option value="cpa">CPA</option>
          </select>
        </div>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Content</label>
          <input className={inputClass} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Term</label>
          <input className={inputClass} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-md">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-300">{err}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleAddToQueue}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Add to Queue
        </button>
        <button
          onClick={clearForm}
          className="px-3 py-2 text-xs font-medium rounded-md bg-zinc-700 hover:bg-zinc-600 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-300">Queue ({queue.length})</p>
            <button
              onClick={handleWriteAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              Write All to Sheet
            </button>
          </div>
          {queue.map((item, i) => (
            <div key={i} className="p-2 bg-zinc-900 border border-zinc-700 rounded-md">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs text-zinc-400 truncate">
                  {item.campaignName} &middot; {item.source} / {item.medium}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(item.utmString, i)}
                    className="px-2 py-0.5 text-[10px] font-medium rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  >
                    {copied === i ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleRemoveFromQueue(i)}
                    className="px-2 py-0.5 text-[10px] font-medium rounded bg-zinc-700 hover:bg-red-900/50 text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <code className="text-[10px] text-emerald-400 break-all leading-relaxed">{item.utmString}</code>
            </div>
          ))}
        </div>
      )}

      {/* Success message */}
      {writeSuccess && (
        <div className="px-3 py-2 bg-emerald-900/30 border border-emerald-800 rounded-md">
          <p className="text-xs text-emerald-300">UTMs written to sheet successfully.</p>
        </div>
      )}
    </div>
  );
}
