import type { FlightingPattern } from '../../types';
import type { ForecastConfig } from '../../store';

interface Props {
  config: ForecastConfig;
  onChange: (config: ForecastConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const inputClass =
  'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

const PATTERNS: { value: FlightingPattern; label: string; desc: string }[] = [
  { value: 'even', label: 'Even', desc: 'Equal spend each period' },
  { value: 'front-loaded', label: 'Front-loaded', desc: '60 / 40 split' },
  { value: 'back-loaded', label: 'Back-loaded', desc: '40 / 60 split' },
  { value: 'seasonal', label: 'Seasonal', desc: 'Custom seasonal indices' },
  { value: 'custom', label: 'Custom', desc: 'Manual weights per period' },
];

export function CampaignSetupSection({ config, onChange, isOpen, onToggle }: Props) {
  const update = (partial: Partial<ForecastConfig>) =>
    onChange({ ...config, ...partial });

  const handleSeasonalChange = (index: number, value: string) => {
    const indices = [...config.seasonalIndices];
    indices[index] = parseFloat(value) || 0;
    update({ seasonalIndices: indices });
  };

  const handleCustomWeightChange = (index: number, value: string) => {
    const weights = [...config.customWeights];
    weights[index] = parseFloat(value) || 0;
    update({ customWeights: weights });
  };

  const handlePeriodsChange = (value: string) => {
    const periods = Math.max(1, Math.min(52, parseInt(value, 10) || 1));
    const seasonalIndices = Array.from({ length: periods }, (_, i) =>
      i < config.seasonalIndices.length ? config.seasonalIndices[i] : 1,
    );
    const customWeights = Array.from({ length: periods }, (_, i) =>
      i < config.customWeights.length ? config.customWeights[i] : 1,
    );
    update({ periods, seasonalIndices, customWeights });
  };

  const selectedPattern = PATTERNS.find((p) => p.value === config.flightingPattern);

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-300">Campaign Setup</span>
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
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Total Budget ($)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={config.totalBudget || ''}
              onChange={(e) => update({ totalBudget: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 500000"
            />
            {config.totalBudget > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(config.totalBudget)}
                {' '}across {config.periods} period{config.periods !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Periods (1–52)</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={52}
                value={config.periods}
                onChange={(e) => handlePeriodsChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Flighting Pattern</label>
              <select
                className={inputClass}
                value={config.flightingPattern}
                onChange={(e) => update({ flightingPattern: e.target.value as FlightingPattern })}
              >
                {PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {selectedPattern && (
                <p className="text-xs text-zinc-500 mt-0.5">{selectedPattern.desc}</p>
              )}
            </div>
          </div>

          {config.flightingPattern === 'seasonal' && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Seasonal Indices (relative weights per period)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {config.seasonalIndices.slice(0, config.periods).map((val, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500 w-5">{i + 1}</span>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step={0.1}
                      value={val}
                      onChange={(e) => handleSeasonalChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.flightingPattern === 'custom' && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Custom Weights (per period)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {config.customWeights.slice(0, config.periods).map((val, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500 w-5">{i + 1}</span>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step={0.1}
                      value={val}
                      onChange={(e) => handleCustomWeightChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
