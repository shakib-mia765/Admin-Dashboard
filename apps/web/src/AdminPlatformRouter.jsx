import { Suspense, lazy, useMemo, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
const AuthPage = lazy(() => import("../features/auth/AuthPage"));
const ROUTES = Object.freeze({
  auth: "/auth",
  dashboard: "/dashboard",
  users: "/users",
  analytics: "/analytics",
  settings: "/settings",
});
const NAV_ITEMS = Object.freeze([
  ["Dashboard", ROUTES.dashboard, "◫"],
  ["Users", ROUTES.users, "◎"],
  ["Analytics", ROUTES.analytics, "↗"],
  ["Settings", ROUTES.settings, "⚙"],
]);
const STATS = Object.freeze([
  ["users", "Total users", "24,892", "+12.4%", "primary"],
  ["revenue", "Monthly revenue", "$184,320", "+8.7%", "success"],
  ["sessions", "Active sessions", "8,421", "+16.2%", "warning"],
  ["incidents", "Open incidents", "3", "-40.0%", "danger"],
]);
const COLUMNS = Object.freeze([
  { key: "name", label: "User" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "lastActive", label: "Last active" },
]);
const USERS = Object.freeze([
  ["usr-1001", "Ariana Morgan", "ariana@example.com", "Administrator", "Active", "2 minutes ago"],
  ["usr-1002", "Noah Williams", "noah@example.com", "Analyst", "Active", "14 minutes ago"],
  ["usr-1003", "Sophia Chen", "sophia@example.com", "Support", "Pending", "1 hour ago"],
  ["usr-1004", "Liam Carter", "liam@example.com", "Viewer", "Suspended", "3 days ago"],
].map(([id, name, email, role, status, lastActive]) =>
  Object.freeze({ id, name, email, role, status, lastActive }),
));
const PAGE_METRICS = Object.freeze({
  analytics: [
    ["Conversion rate", "18.6%"],
    ["Average session", "8m 42s"],
    ["Retention", "84.2%"],
  ],
  settings: [
    ["Security policies", "12"],
    ["Connected services", "8"],
    ["Active webhooks", "16"],
  ],
});
const sleep = (ms) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const titleFromPath = (pathname) =>
  NAV_ITEMS.find(([, path]) => pathname.startsWith(path))?.[0] ??
  "Admin platform";
const Loader = () => (
  <main
    role="status"
    aria-label="Loading workspace"
    className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"
  >
    <span className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
      <i className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      Loading workspace
    </span>
  </main>
);
const RouteError = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const message =
    error?.statusText ||
    error?.message ||
    "The requested page is unavailable.";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 dark:bg-slate-950">
      <section className="max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-rose-600">
          Navigation error
        </p>
        <h1 className="mt-3 text-2xl font-black dark:text-white">
          Unable to open this page
        </h1>
        <p className="mt-3 text-sm text-slate-500">{message}</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.dashboard, { replace: true })}
          className="mt-6 h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
        >
          Return to dashboard
        </button>
      </section>
    </main>
  );
};
const AdminShell = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const signOut = async () => {
    await sleep(250);
    navigate(ROUTES.auth, { replace: true });
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="border-b bg-white dark:border-slate-800 dark:bg-slate-900 lg:min-h-screen lg:border-b-0 lg:border-r">
        <NavLink
          to={ROUTES.dashboard}
          className="flex h-16 items-center gap-3 px-5 lg:h-20"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white">
            A
          </span>
          <span>
            <b className="block text-sm">Apex Admin</b>
            <small className="text-slate-500">Control platform</small>
          </span>
        </NavLink>
        <nav
          aria-label="Primary navigation"
          className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1"
        >
          {NAV_ITEMS.map(([label, path, icon]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`
              }
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b bg-white px-5 dark:border-slate-800 dark:bg-slate-900 lg:h-20 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
              Administration
            </p>
            <h1 className="mt-1 text-lg font-black">{title}</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </header>
        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </section>
    </div>
  );
};
const UsersTable = ({ onSelect }) => (
  <DataTable
    columns={COLUMNS}
    data={USERS}
    rowKey="id"
    onRowClick={onSelect}
  />
);
const DashboardPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(([id, title, value, change, variant]) => (
          <StatCard
            key={id}
            title={title}
            value={value}
            change={change}
            variant={variant}
          />
        ))}
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black">Recent users</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Review platform access and account activity.
        </p>
        <UsersTable onSelect={setSelectedUser} />
      </section>
      <Modal
        open={Boolean(selectedUser)}
        title="User overview"
        onClose={() => setSelectedUser(null)}
      >
        <div className="text-sm">
          {Object.entries(selectedUser ?? {})
            .filter(([key]) => key !== "id")
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-6 border-b py-2 last:border-0 dark:border-slate-800"
              >
                <span className="capitalize text-slate-500">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                <strong className="text-right">{value}</strong>
              </div>
            ))}
        </div>
      </Modal>
    </section>
  );
};
const UsersPage = () => (
  <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h2 className="text-lg font-black">User management</h2>
    <p className="mb-5 mt-1 text-sm text-slate-500">
      Search, review, and manage platform users.
    </p>
    <UsersTable />
  </section>
);
const MetricsPage = ({ title, description, items }) => (
  <section>
    <h2 className="text-2xl font-black">{title}</h2>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {items.map(([label, value]) => (
        <article
          key={label}
          className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </article>
      ))}
    </div>
  </section>
);
const router = createBrowserRouter([
  { path: "/", element: <Navigate to={ROUTES.dashboard} replace /> },
  {
    path: ROUTES.auth,
    element: <AuthPage />,
    errorElement: <RouteError />,
  },
  {
    element: <AdminShell />,
    errorElement: <RouteError />,
    children: [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.users, element: <UsersPage /> },
      {
        path: ROUTES.analytics,
        element: (
          <MetricsPage
            title="Analytics"
            description="Track product performance and operational health."
            items={PAGE_METRICS.analytics}
          />
        ),
      },
      {
        path: ROUTES.settings,
        element: (
          <MetricsPage
            title="Settings"
            description="Configure platform security and integrations."
            items={PAGE_METRICS.settings}
          />
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to={ROUTES.dashboard} replace /> },
]);
const AdminPlatformRouter = () => (
  <Suspense fallback={<Loader />}>
    <RouterProvider router={router} />
  </Suspense>
);
export default AdminPlatformRouter;