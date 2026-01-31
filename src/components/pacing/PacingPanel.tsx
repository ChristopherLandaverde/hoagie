import { useMediaPlannerStore } from '../../store';
import { calculatePacing } from '../../lib/calculations';

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    'on-track': 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    'under-pacing': 'bg-red-900/40 text-red-400 border-red-800',
    'over-pacing': 'bg-amber-900/40 text-amber-400 border-amber-800',
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded border ${colors[status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
    >
      {status}
    </span>
  );
}

export function PacingPanel() {
  const { pacingData, channels, benchmarks } = useMediaPlannerStore();

  if (pacingData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">Pacing Dashboard</h2>
        <div className="p-6 text-center border border-dashed border-zinc-700 rounded-md">
          <p className="text-xs text-zinc-500">No pacing data loaded.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Import actuals from your platforms to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300">Pacing Dashboard</h2>
      <div className="space-y-2">
        {pacingData.map((data, i) => {
          const benchmark = benchmarks.find((b) => b.channelId === data.channelId);
          const result = calculatePacing(data, benchmark?.lcBenchmark ?? 0);
          const channel = channels.find((ch) => ch.id === data.channelId);

          return (
            <div
              key={i}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-md space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-200">
                  {channel?.name ?? data.channelId}
                </span>
                {statusBadge(result.status)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">Spend Pacing</p>
                  <p className="text-zinc-200">
                    {(result.spendPacing * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Impr. Pacing</p>
                  <p className="text-zinc-200">
                    {(result.impressionPacing * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">vs Benchmark</p>
                  <p
                    className={
                      result.performanceVsBenchmark > 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }
                  >
                    {(result.performanceVsBenchmark * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
