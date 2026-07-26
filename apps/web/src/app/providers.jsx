import { Component, StrictMode, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store/redux/store";

const NON_RETRYABLE_STATUS = Object.freeze([400, 401, 403, 404, 409, 422]);
const QUERY_CONFIG = Object.freeze({
  staleTime: 30_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
});
const getStatusCode = (error) =>
  Number(error?.status ?? error?.response?.status ?? error?.cause?.status) || null;
const shouldRetry = (failureCount, error) => {
  const status = getStatusCode(error);
  return failureCount < 2 && (!status || !NON_RETRYABLE_STATUS.includes(status));
};

const reportError = (error, info) => {
  const payload = {
    name: error?.name ?? "ApplicationError",
    message: error?.message ?? "Unknown application error",
    stack: error?.stack,
    componentStack: info?.componentStack,
    timestamp: new Date().toISOString(),
  };
  if (import.meta.env.DEV) console.error("[AppErrorBoundary]", payload);
  window.dispatchEvent(new CustomEvent("app:error", { detail: payload }));
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { ...QUERY_CONFIG, retry: shouldRetry },
    mutations: { retry: false },
  },
});

const LoadingScreen = () => (
  <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
    <div className="flex items-center gap-3" role="status" aria-live="polite" aria-label="Loading application">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" aria-hidden="true" />
      <span className="text-sm font-medium text-slate-300">Loading application</span>
    </div>
  </main>
);

const ErrorScreen = ({ onRetry }) => (
  <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
    <section className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 p-8 text-center shadow-2xl" role="alert">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-rose-400">Application error</p>
      <h1 className="mt-3 text-2xl font-bold">Dashboard unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">The application could not initialize correctly. Retry to restore the session.</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
        Retry
      </button>
    </section>
  </main>
);

class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    reportError(error, info);
  }
  reset = async () => {
    await queryClient.cancelQueries();
    queryClient.resetQueries();
    this.setState({ failed: false });
  };
  render() {
    return this.state.failed ? <ErrorScreen onRetry={this.reset} /> : this.props.children;
  }
}

const AppProviders = ({ children }) => (
  <StrictMode>
    <AppErrorBoundary>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        </QueryClientProvider>
      </ReduxProvider>
    </AppErrorBoundary>
  </StrictMode>
);

export { queryClient };
export default AppProviders;