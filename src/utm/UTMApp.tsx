import { useMediaPlannerStore } from '../store';
import { UTMBuilder } from '../components/utm/UTMBuilder';
import { initializeUTMWorkspace } from '../lib/excel';

export function UTMApp() {
  const { isLoading, error, setLoading, setError } = useMediaPlannerStore();

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setError(null);
      await initializeUTMWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-base font-semibold tracking-tight">UTM Builder</h1>
        <button
          onClick={handleInitialize}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Setting up\u2026' : 'Initialize Workspace'}
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 text-xs bg-red-900/30 border border-red-800 rounded-md text-red-300">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        <UTMBuilder />
      </main>
    </div>
  );
}
