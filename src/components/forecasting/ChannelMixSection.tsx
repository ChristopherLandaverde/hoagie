import type { MediaChannel } from '../../types';
import type { ChannelMixEntry } from '../../store';

interface Props {
  channels: MediaChannel[];
  mix: ChannelMixEntry[];
  onAdd: (entry: ChannelMixEntry) => void;
  onRemove: (channelId: string) => void;
  onUpdate: (channelId: string, updates: Partial<ChannelMixEntry>) => void;
  onAutoBalance: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const inputClass =
  'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

const CATEGORIES = [
  { key: 'video' as const, label: 'Video' },
  { key: 'digital' as const, label: 'Digital' },
  { key: 'social' as const, label: 'Social' },
];

export function ChannelMixSection({
  channels,
  mix,
  onAdd,
  onRemove,
  onUpdate,
  onAutoBalance,
  isOpen,
  onToggle,
}: Props) {
  const totalPct = mix.reduce((sum, e) => sum + e.percentage, 0);
  const isBalanced = Math.abs(totalPct - 100) < 0.01;
  const isOver = totalPct > 100.5;

  const selectedIds = new Set(mix.map((e) => e.channelId));

  const handleToggleChannel = (channel: MediaChannel) => {
    if (selectedIds.has(channel.id)) {
      onRemove(channel.id);
    } else {
      const defaultTactic = channel.tactics[0];
      onAdd({
        channelId: channel.id,
        tacticId: defaultTactic?.id ?? '',
        percentage: 0,
        cpmOverride: defaultTactic?.platformCPM ?? null,
      });
    }
  };

  const getChannel = (id: string) => channels.find((c) => c.id === id);

  const allocationColor = isBalanced
    ? 'text-emerald-400'
    : isOver
      ? 'text-red-400'
      : 'text-amber-400';

  const allocationHint = isBalanced
    ? 'Balanced'
    : isOver
      ? `${(totalPct - 100).toFixed(1)}% over`
      : `${(100 - totalPct).toFixed(1)}% remaining`;

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-300">
          Channel Mix
          {mix.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-zinc-500">
              ({mix.length} channel{mix.length !== 1 ? 's' : ''})
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
          {/* Channel checkboxes by category */}
          {CATEGORIES.map((cat) => {
            const catChannels = channels.filter((c) => c.category === cat.key);
            if (catChannels.length === 0) return null;
            return (
              <div key={cat.key}>
                <p className="text-xs font-medium text-zinc-400 mb-1">{cat.label}</p>
                <div className="flex flex-wrap gap-2">
                  {catChannels.map((ch) => (
                    <label
                      key={ch.id}
                      className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ch.id)}
                        onChange={() => handleToggleChannel(ch)}
                        className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      {ch.name}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Allocation bar */}
          {mix.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">
                  Allocation:{' '}
                  <span className={allocationColor}>{totalPct.toFixed(1)}%</span>
                  <span className="ml-1 text-zinc-600">— {allocationHint}</span>
                </span>
                <button
                  onClick={onAutoBalance}
                  className="px-2 py-0.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                >
                  Auto-balance
                </button>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isBalanced ? 'bg-emerald-500' : isOver ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(totalPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Per-channel config */}
          {mix.map((entry) => {
            const ch = getChannel(entry.channelId);
            if (!ch) return null;
            return (
              <div
                key={entry.channelId}
                className="p-2 bg-zinc-900 border border-zinc-700 rounded-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">{ch.name}</span>
                  <button
                    onClick={() => onRemove(entry.channelId)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    aria-label={`Remove ${ch.name}`}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Tactic</label>
                    <select
                      className={inputClass}
                      value={entry.tacticId}
                      onChange={(e) => {
                        const tactic = ch.tactics.find((t) => t.id === e.target.value);
                        onUpdate(entry.channelId, {
                          tacticId: e.target.value,
                          cpmOverride: tactic?.platformCPM ?? entry.cpmOverride,
                        });
                      }}
                    >
                      {ch.tactics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Alloc %</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={entry.percentage || ''}
                      onChange={(e) =>
                        onUpdate(entry.channelId, {
                          percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">CPM ($)</label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step={0.01}
                      value={entry.cpmOverride ?? ''}
                      onChange={(e) =>
                        onUpdate(entry.channelId, {
                          cpmOverride: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
