import { useMediaPlannerStore } from '../store';
import { UTMBuilder } from '../components/utm/UTMBuilder';
import { ForecastingPanel } from '../components/forecasting/ForecastingPanel';
import { PacingPanel } from '../components/pacing/PacingPanel';
import {
  initializeUTMWorkspace,
  initializeForecastingWorkspace,
  initializePacingWorkspace,
} from '../lib/excel';

const NAV_ITEMS = [
  { key: 'utm' as const, label: 'UTM Builder' },
  { key: 'forecasting' as const, label: 'Forecasting' },
  { key: 'pacing' as const, label: 'Pacing' },
] as const;

const INIT_FNS = {
  utm: initializeUTMWorkspace,
  forecasting: initializeForecastingWorkspace,
  pacing: initializePacingWorkspace,
} as const;

export function App() {
  const { activeView, setActiveView, isLoading, error, setLoading, setError } =
    useMediaPlannerStore();

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setError(null);
      await INIT_FNS[activeView]();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-base font-semibold tracking-tight">Hoagie</h1>
        <button
          onClick={handleInitialize}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Setting up\u2026' : 'Initialize Workspace'}
        </button>
      </header>

      {/* Navigation */}
      <nav className="flex gap-1 px-4 pt-3">
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeView === key
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 text-xs bg-red-900/30 border border-red-800 rounded-md text-red-300">
          {error}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeView === 'utm' && <UTMBuilder />}
        {activeView === 'forecasting' && <ForecastingPanel />}
        {activeView === 'pacing' && <PacingPanel />}
      </main>
    </div>
  );
}
