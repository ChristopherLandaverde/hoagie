import type { FeeType } from '../../types';
import type { ForecastConfig } from '../../store';

interface Props {
  config: ForecastConfig;
  onChange: (config: ForecastConfig) => void;
  totalBudget: number;
  isOpen: boolean;
  onToggle: () => void;
}

const inputClass =
  'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

const FEE_TYPES: { value: FeeType; label: string; desc: string }[] = [
  { value: 'percentage', label: 'Percentage', desc: '% of media spend' },
  { value: 'flat', label: 'Flat', desc: 'Fixed amount per period' },
  { value: 'hybrid', label: 'Hybrid', desc: '% of spend + flat per period' },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function FeeConfigSection({ config, onChange, totalBudget, isOpen, onToggle }: Props) {
  const update = (partial: Partial<ForecastConfig>) =>
    onChange({ ...config, ...partial });

  const estimatedFees = (() => {
    switch (config.feeType) {
      case 'percentage':
        return totalBudget * config.feePct;
      case 'flat':
        return config.feeFlat * config.periods;
      case 'hybrid':
        return totalBudget * config.feePct + config.feeFlat * config.periods;
      default:
        return 0;
    }
  })();

  const selectedFeeType = FEE_TYPES.find((ft) => ft.value === config.feeType);
  const hasFees = estimatedFees > 0;

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-300">
          Fee Configuration
          {hasFees && !isOpen && (
            <span className="ml-1.5 text-xs font-normal text-zinc-500">
              ({formatCurrency(estimatedFees)})
            </span>
          )}
        </span>
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
            <label className="block text-xs text-zinc-400 mb-1">Fee Type</label>
            <select
              className={inputClass}
              value={config.feeType}
              onChange={(e) => update({ feeType: e.target.value as FeeType })}
            >
              {FEE_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
            {selectedFeeType && (
              <p className="text-xs text-zinc-500 mt-0.5">{selectedFeeType.desc}</p>
            )}
          </div>

          {(config.feeType === 'percentage' || config.feeType === 'hybrid') && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Fee Percentage (%)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={(config.feePct * 100) || ''}
                onChange={(e) =>
                  update({ feePct: (parseFloat(e.target.value) || 0) / 100 })
                }
                placeholder="e.g. 15"
              />
            </div>
          )}

          {(config.feeType === 'flat' || config.feeType === 'hybrid') && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Flat Fee (per period)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={1}
                value={config.feeFlat || ''}
                onChange={(e) => update({ feeFlat: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 500"
              />
            </div>
          )}

          <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Estimated Total Fees</p>
              {totalBudget > 0 && estimatedFees > 0 && (
                <p className="text-xs text-zinc-500">
                  {((estimatedFees / totalBudget) * 100).toFixed(1)}% of budget
                </p>
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-200">
              {formatCurrency(estimatedFees)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
