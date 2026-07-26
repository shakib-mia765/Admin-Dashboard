import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = Object.freeze([
    { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: '▦' },
    { id: 'users', label: 'Users', to: '/users', icon: '◎' },
    { id: 'analytics', label: 'Analytics', to: '/analytics', icon: '◫' },
    { id: 'billing', label: 'Billing', to: '/billing', icon: '◇' },
    { id: 'settings', label: 'Settings', to: '/settings', icon: '⚙' },
]);
const USER = Object.freeze({ name: 'Shakib Mia', email: 'r01227673@gmail.com', role: 'Administrator' });
const cx = (...classes) => classes.filter(Boolean).join(' ');
const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState('');
    const activePage = useMemo(
        () => NAV_ITEMS.find(item => location.pathname.startsWith(item.to))?.label ?? 'Admin',
        [location.pathname],
    );

    useEffect(() => {
        setSidebarOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);
    useEffect(() => {
        const closeProfile = event => {
            if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
        };
        const closeOnEscape = event => {
            if (event.key === 'Escape') {
                setSidebarOpen(false);
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', closeProfile);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeProfile);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    const signOut = useCallback(async () => {
        if (signingOut) return;
        setSigningOut(true);
        setError('');
        try {
            await Promise.resolve();
            navigate('/login', { replace: true });
        } catch (signOutError) {
            setError(signOutError?.message ?? 'Unable to sign out.');
        } finally {
            setSigningOut(false);
        }
    }, [navigate, signingOut]);
    const navigation = useMemo(
        () => NAV_ITEMS.map(item => (
            <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) => cx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                    isActive ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
            >
                <span aria-hidden="true" className="w-5 text-center text-base">{item.icon}</span>
                <span>{item.label}</span>
            </NavLink>
        )),
        [],
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {sidebarOpen && (
                <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" />
            )}

            <aside
                aria-label="Primary navigation"
                className={cx(
                    'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-900 p-4 transition-transform duration-200 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex h-14 items-center justify-between px-2">
                    <NavLink to="/dashboard" className="flex items-center gap-3 font-bold tracking-tight">
                        <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">A</span>
                        <span>AdminOS</span>
                    </NavLink>
                    <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Close sidebar">✕</button>
                </div>
                <nav className="mt-6 grid gap-1">{navigation}</nav>
                <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-sm font-semibold">{USER.name}</p>
                    <p className="truncate text-xs text-slate-400">{USER.email}</p>
                    <button type="button" disabled={signingOut} onClick={signOut} className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
                        {signingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-72">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur sm:px-6">
                    <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden" aria-label="Open sidebar">☰</button>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Admin workspace</p>
                        <h1 className="text-sm font-bold">{activePage}</h1>
                    </div>
                    <div ref={profileRef} className="relative ml-auto">
                        <button
                            type="button"
                            aria-expanded={profileOpen}
                            onClick={() => setProfileOpen(current => !current)}
                            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                            <span className="hidden text-right sm:block">
                                <span className="block text-sm font-semibold">{USER.name}</span>
                                <span className="block text-xs text-slate-400">{USER.role}</span>
                            </span>
                            <span className="grid size-9 place-items-center rounded-full bg-cyan-400 font-bold text-slate-950">SM</span>
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                                {[{ label: 'Profile', path: '/profile' }, { label: 'Settings', path: '/settings' }].map(item => (
                                    <button key={item.path} type="button" onClick={() => navigate(item.path)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-800">
                                        {item.label}
                                    </button>
                                ))}
                                <button type="button" onClick={signOut} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800">Sign out</button>
                            </div>
                        )}
                    </div>
                </header>
                {error && <div role="alert" className="mx-4 mt-4 rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 sm:mx-6">{error}</div>}
                <div className="min-w-0"><Outlet /></div>
            </div>
        </div>
    );
};

export default AdminLayout;
