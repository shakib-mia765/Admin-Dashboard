import { useCallback, useMemo, useState } from 'react';

const PAGE_SIZE = 6;
const STATUS_STYLE = Object.freeze({
  active: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  invited: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
  suspended: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
});
const ROLE_STYLE = Object.freeze({
  Admin: 'text-violet-300',
  Manager: 'text-amber-300',
  Analyst: 'text-cyan-300',
  Member: 'text-slate-300',
});
const USERS = Object.freeze([
  { id: 1, name: 'Ava Morgan', email: 'ava@northstar.io', role: 'Admin', status: 'active', lastSeen: '2m ago' },
  { id: 2, name: 'Noah Chen', email: 'noah@lumina.dev', role: 'Manager', status: 'active', lastSeen: '18m ago' },
  { id: 3, name: 'Mia Patel', email: 'mia@vertex.co', role: 'Analyst', status: 'invited', lastSeen: 'Pending' },
  { id: 4, name: 'Liam Brooks', email: 'liam@atlas.app', role: 'Member', status: 'suspended', lastSeen: '3d ago' },
  { id: 5, name: 'Sofia Reyes', email: 'sofia@orbit.ai', role: 'Manager', status: 'active', lastSeen: '1h ago' },
  { id: 6, name: 'Ethan Cole', email: 'ethan@nova.com', role: 'Member', status: 'active', lastSeen: '4h ago' },
  { id: 7, name: 'Zara Khan', email: 'zara@prism.io', role: 'Analyst', status: 'invited', lastSeen: 'Pending' },
  { id: 8, name: 'Lucas Meyer', email: 'lucas@peak.dev', role: 'Member', status: 'active', lastSeen: 'Yesterday' },
]);

const cx = (...classes) => classes.filter(Boolean).join(' ');
const initials = name => name.split(' ').map(part => part[0]).join('').slice(0, 2);
const UsersPage = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return USERS.filter(user => {
      const matchesStatus = status === 'all' || user.status === status;
      const matchesQuery = !term || [user.name, user.email, user.role].some(value => value.toLowerCase().includes(term));
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  const pageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const visibleUsers = useMemo(() => {
    const safePage = Math.min(page, Math.max(pageCount - 1, 0));
    return filteredUsers.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  }, [filteredUsers, page, pageCount]);
  const toggleUser = useCallback(id => {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }, []);

  const togglePage = useCallback(() => {
    const ids = visibleUsers.map(user => user.id);
    const allSelected = ids.length > 0 && ids.every(id => selected.includes(id));
    setSelected(current => allSelected ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }, [selected, visibleUsers]);
  const refreshUsers = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 650));
    } catch (refreshError) {
      setError(refreshError?.message ?? 'Unable to refresh users.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const changePage = next => setPage(Math.min(Math.max(next, 0), Math.max(pageCount - 1, 0)));
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">Identity management</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-slate-400">Manage access, roles and account lifecycle.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refreshUsers} disabled={refreshing} className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-900 disabled:opacity-50">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" onClick={() => Promise.resolve()} className="h-10 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-300">
              Add user
            </button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 md:flex-row md:items-center">
            <input
              type="search"
              value={query}
              onChange={event => { setQuery(event.target.value); setPage(0); }}
              placeholder="Search users..."
              aria-label="Search users"
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-cyan-500 md:max-w-sm"
            />
            <select
              value={status}
              onChange={event => { setStatus(event.target.value); setPage(0); }}
              className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-cyan-500"
            >
              {['all', 'active', 'invited', 'suspended'].map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
            </select>
            <p className="text-sm text-slate-400 md:ml-auto">{selected.length ? `${selected.length} selected` : `${filteredUsers.length} users`}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" aria-label="Select visible users" checked={visibleUsers.length > 0 && visibleUsers.every(user => selected.includes(user.id))} onChange={togglePage} /></th>
                  {['User', 'Role', 'Status', 'Last active', ''].map(label => <th key={label || 'actions'} className="px-4 py-3">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleUsers.length ? visibleUsers.map(user => (
                  <tr key={user.id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-4"><input type="checkbox" aria-label={`Select ${user.name}`} checked={selected.includes(user.id)} onChange={() => toggleUser(user.id)} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-slate-800 text-xs font-bold text-cyan-300">{initials(user.name)}</span>
                        <div><p className="font-semibold">{user.name}</p><p className="text-sm text-slate-400">{user.email}</p></div>
                      </div>
                    </td>
                    <td className={cx('px-4 py-4 text-sm font-semibold', ROLE_STYLE[user.role])}>{user.role}</td>
                    <td className="px-4 py-4"><span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold ring-1', STATUS_STYLE[user.status])}>{user.status}</span></td>
                    <td className="px-4 py-4 text-sm text-slate-400">{user.lastSeen}</td>
                    <td className="px-4 py-4 text-right"><button type="button" onClick={() => Promise.resolve(user)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">Manage</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="px-4 py-16 text-center text-sm text-slate-400">No users match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {pageCount ? page + 1 : 0} of {pageCount}</p>
            <div className="flex gap-2">
              {[{ label: 'Previous', value: page - 1, disabled: page === 0 }, { label: 'Next', value: page + 1, disabled: !pageCount || page >= pageCount - 1 }].map(action => (
                <button key={action.label} type="button" disabled={action.disabled} onClick={() => changePage(action.value)} className="h-9 rounded-lg border border-slate-700 px-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-40">{action.label}</button>
              ))}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default UsersPage;