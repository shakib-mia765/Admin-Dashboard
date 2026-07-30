import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

const ROOT_ID = 'root';
const EVENT_NAMES = Object.freeze({
  error: 'error',
  rejection: 'unhandledrejection',
});
const BOOT_TASKS = Object.freeze([
  () => Promise.resolve(document.documentElement.setAttribute('data-app', 'admin-dashboard')),
  () => Promise.resolve(document.documentElement.setAttribute('lang', 'en')),
]);

const reportRuntimeError = (error, context = {}) => {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const payload = {
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    context,
    timestamp: new Date().toISOString(),
  };
  if (import.meta.env.DEV) console.error('[runtime]', payload);
  return payload;
};
class AppErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportRuntimeError(error, { componentStack: info.componentStack });
  }
  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <section
          role="alert"
          className="w-full max-w-md rounded-2xl border border-rose-900/70 bg-slate-900 p-6 shadow-2xl shadow-black/30"
        >
          <p className="text-sm font-semibold text-rose-400">Application error</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            The dashboard could not load
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Retry the application. Contact support if the problem continues.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 h-10 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }
}

const registerRuntimeListeners = () => {
  const handleError = event => {
    reportRuntimeError(event.error ?? event.message, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  };
  const handleRejection = event => {
    reportRuntimeError(event.reason, { source: EVENT_NAMES.rejection });
  };

  window.addEventListener(EVENT_NAMES.error, handleError);
  window.addEventListener(EVENT_NAMES.rejection, handleRejection);
  return () => {
    window.removeEventListener(EVENT_NAMES.error, handleError);
    window.removeEventListener(EVENT_NAMES.rejection, handleRejection);
  };
};

const runBootTasks = async () => {
  const results = await Promise.allSettled(
    BOOT_TASKS.map(task => Promise.resolve().then(task)),
  );
  results
    .filter(result => result.status === 'rejected')
    .map(result => reportRuntimeError(result.reason, { source: 'bootstrap' }));
  return results;
};

const renderApplication = () => {
  const container = document.getElementById(ROOT_ID);
  if (!container) {
    throw new Error(`Missing required #${ROOT_ID} application root.`);
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
  return root;
};

const bootstrap = async () => {
  const unregister = registerRuntimeListeners();
  try {
    await runBootTasks();
    renderApplication();
  } catch (error) {
    reportRuntimeError(error, { source: 'bootstrap' });
    unregister();
    throw error;
  }
};

void bootstrap();