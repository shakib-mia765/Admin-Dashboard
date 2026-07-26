import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PERIODS = Object.freeze(['7d', '30d', '90d']);
const STATUS_STYLE = Object.freeze({
  healthy: 'bg-emerald-400', warning: 'bg-amber-400', critical: 'bg-rose-400',
});
const KPI_DATA = Object.freeze([
  { id: 'revenue', label: 'Revenue', value: 128430, change: 18.4, prefix: '$' },
  { id: 'users', label: 'Active users', value: 24892, change: 12.7 },
  { id: 'orders', label: 'Orders', value: 6842, change: 9.2 },
  { id: 'conversion', label: 'Conversion', value: 4.86, change: -1.3, suffix: '%' },
]);
const ACTIVITY_DATA = Object.freeze([
  { id: 1, title: 'Enterprise plan upgraded', detail: 'Acme Inc. · $4,800 ARR', time: '4m' },
  { id: 2, title: 'New administrator invited', detail: 'maya@northstar.io', time: '18m' },
  { id: 3, title: 'Payout completed', detail: '$18,240 transferred', time: '42m' },
  { id: 4, title: 'Security policy updated', detail: 'MFA enforced for admins', time: '1h' },
]);
const HEALTH_DATA = Object.freeze([
  { id: 'api', label: 'API', value: '99.99%', status: 'healthy' },
  { id: 'database', label: 'Database', value: '18 ms', status: 'healthy' },
  { id: 'queue', label: 'Job queue', value: '72%', status: 'warning' },
]);
const CHART_DATA = Object.freeze({
  '7d': [42, 58, 51, 72, 64, 81, 76],
  '30d': [34, 48, 44, 59, 53, 67, 62, 74, 69, 82, 78, 88],
  '90d': [28, 35, 32, 41, 39, 49, 46, 57, 52, 63, 61, 70],
});

const cx = (...classes) => classes.filter(Boolean).join(' ');
const formatValue = ({ value, prefix = '', suffix = '' }) =>
  `${prefix}${Number(value).toLocaleString('en-US', { maximumFractionDigits: suffix ? 2 : 0 })}${suffix}`;

const DashboardPage = () => {
  const mounted = useRef(true);
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => () => { mounted.current = false; }, []);

  const chart = useMemo(() => CHART_DATA[period], [period]);
  const maxChartValue = useMemo(() => Math.max(...chart, 1), [chart]);

  const refreshDashboard = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      if (mounted.current) setUpdatedAt(new Date());
    } catch (refreshError) {
      if (mounted.current) setError(refreshError?.message ?? 'Dashboard refresh failed.');
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [refreshing]);

  const actions = useMemo(
    () => [
      { id: 'user', label: 'Add user', onClick: () => Promise.resolve() },
      { id: 'report', label: 'Export report', onClick: refreshDashboard },
      { id: 'billing', label: 'Review billing', onClick: () => Promise.resolve() },
    ],
    [refreshDashboard],
  );

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-400">Operations overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(item => (
              <button
                key={item}
                type="button"
                aria-pressed={period === item}
                onClick={() => setPeriod(item)}
                className={cx(
                  'h-9 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  period === item ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800',
                )}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              disabled={refreshing}
              onClick={refreshDashboard}
              className="h-9 rounded-lg border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}

        <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_DATA.map(metric => (
            <article key={metric.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/10">
              <p className="text-sm font-medium text-slate-400">{metric.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <strong className="text-2xl font-bold tracking-tight">{formatValue(metric)}</strong>
                <span className={cx('text-sm font-semibold', metric.change >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold">Revenue trend</h2><p className="text-sm text-slate-400">Normalized performance for {period}</p></div>
              <span className="text-sm font-semibold text-emerald-400">+14.8%</span>
            </div>
            <div className="mt-6 flex h-56 items-end gap-2" aria-label="Revenue bar chart">
              {chart.map((value, index) => (
                <div key={`${period}-${index}`} className="flex h-full flex-1 items-end">
                  <div title={`Point ${index + 1}: ${value}`} className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-300 transition-all hover:opacity-80" style={{ height: `${Math.max((value / maxChartValue) * 100, 8)}%` }} />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">System health</h2>
            <div className="mt-5 space-y-4">
              {HEALTH_DATA.map(service => (
                <div key={service.id} className="flex items-center justify-between rounded-xl bg-slate-950/70 p-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('size-2.5 rounded-full', STATUS_STYLE[service.status])} />
                    <span className="text-sm font-medium">{service.label}</span>
                  </div>
                  <span className="text-sm text-slate-400">{service.value}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold">Recent activity</h2>
            </div>
            <ul className="divide-y divide-slate-800">
              {ACTIVITY_DATA.map(activity => (
                <li key={activity.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div><p className="text-sm font-medium">{activity.title}</p><p className="mt-1 text-sm text-slate-400">{activity.detail}</p></div>
                  <time className="shrink-0 text-xs text-slate-500">{activity.time}</time>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-3">
              {actions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => void action.onClick()}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold transition hover:border-cyan-500 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;