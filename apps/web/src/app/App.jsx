import { Suspense, useCallback, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const APP_CONFIG = Object.freeze({
    name: 'UltraFAANG Admin',
    startupTimeout: 6000,
});

const APP_STATUS = Object.freeze({
    starting: 'starting',
    ready: 'ready',
    failed: 'failed',
});

const STARTUP_CHECKS = Object.freeze([
    {
        key: 'router',
        run: () => Promise.resolve(Boolean(router)),
    },
    {
        key: 'browser',
        run: () =>
            Promise.resolve(
                typeof window !== 'undefined' &&
                typeof document !== 'undefined',
            ),
    },
]);

const Spinner = () => (
    <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"
    />
);

const LoadingScreen = ({ message = 'Loading workspace...' }) => (
    <main
        role="status"
        aria-live="polite"
        className="grid min-h-screen place-items-center bg-slate-950 p-4 text-slate-100"
    >
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 shadow-xl shadow-black/20">
            <Spinner />
            <span className="text-sm font-medium">{message}</span>
        </div>
    </main>
);

const ErrorScreen = ({ error, onRetry }) => (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4 text-slate-100">
        <section
            role="alert"
            className="w-full max-w-md rounded-2xl border border-rose-900/70 bg-slate-900 p-6 shadow-2xl shadow-black/30"
        >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
                Startup failure
            </p>
            <h1 className="mt-2 text-xl font-semibold">
                {APP_CONFIG.name} could not start
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
                {error?.message || 'An unexpected application error occurred.'}
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
                Retry startup
            </button>
        </section>
    </main>
);

const createTimeout = (timeout, signal) =>
    new Promise((_, reject) => {
        const timeoutId = window.setTimeout(
            () => reject(new Error('Application startup timed out.')),
            timeout,
        );

        signal.addEventListener(
            'abort',
            () => {
                window.clearTimeout(timeoutId);
                reject(new DOMException('Startup cancelled.', 'AbortError'));
            },
            { once: true },
        );
    });

const runStartupChecks = signal => {
    const checks = Promise.all(
        STARTUP_CHECKS.map(async ({ key, run }) => ({
            key,
            passed: await run(),
        })),
    );

    return Promise.race([
        checks,
        createTimeout(APP_CONFIG.startupTimeout, signal),
    ]);
};

const initializeApplication = async signal => {
    const results = await runStartupChecks(signal);
    const failedChecks = results
        .filter(({ passed }) => !passed)
        .map(({ key }) => key);

    if (failedChecks.length) {
        throw new Error(`Startup checks failed: ${failedChecks.join(', ')}.`);
    }

    return results;
};

const App = () => {
    const [startup, setStartup] = useState({
        status: APP_STATUS.starting,
        error: null,
        attempt: 0,
    });

    const retryStartup = useCallback(() => {
        setStartup(current => ({
            status: APP_STATUS.starting,
            error: null,
            attempt: current.attempt + 1,
        }));
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        const startApplication = async () => {
            try {
                await initializeApplication(controller.signal);

                if (!active) return;

                setStartup(current => ({
                    ...current,
                    status: APP_STATUS.ready,
                    error: null,
                }));
            } catch (error) {
                if (!active || error?.name === 'AbortError') return;

                setStartup(current => ({
                    ...current,
                    status: APP_STATUS.failed,
                    error,
                }));
            }
        };

        startApplication();

        return () => {
            active = false;
            controller.abort();
        };
    }, [startup.attempt]);

    if (startup.status === APP_STATUS.failed) {
        return <ErrorScreen error={startup.error} onRetry={retryStartup} />;
    }

    if (startup.status !== APP_STATUS.ready) {
        return (
            <LoadingScreen
                message={
                    startup.attempt
                        ? 'Restarting workspace...'
                        : 'Starting workspace...'
                }
            />
        );
    }

    return (
        <Suspense fallback={<LoadingScreen />}>
            <RouterProvider
                router={router}
                fallbackElement={<LoadingScreen message="Opening page..." />}
            />
        </Suspense>
    );
};

export default App;