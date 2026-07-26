```jsx
import { Navigate, Outlet, RouterProvider, createBrowserRouter, redirect, useRouteError } from "react-router-dom";

const ROUTES = Object.freeze({
  ROOT: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  ANALYTICS: "/analytics",
  BILLING: "/billing",
  AUDIT_LOG: "/audit-log",
  SYSTEM: "/system",
  SETTINGS: "/settings",
});

const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: "admin-dashboard.access-token",
});
const lazyPage = (load) => async () => {
  const module = await load();
  return { Component: module.default };
};
const getAccessToken = () =>
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const requireGuest = async () =>
  getAccessToken() ? redirect(ROUTES.DASHBOARD) : null;
const requireAuth = async () =>
  getAccessToken() ? null : redirect(ROUTES.LOGIN);
const LoadingScreen = () => (
  <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      <span className="text-sm font-medium text-slate-300">Loading dashboard</span>
    </div>
  </main>
);

const RouteError = () => {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "The requested page could not be loaded.";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-lg rounded-2xl border border-rose-500/20 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
          Navigation error
        </p>
        <h1 className="mt-3 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <a
          href={ROUTES.DASHBOARD}
          className="mt-6 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Return to dashboard
        </a>
      </section>
    </main>
  );
};
const PublicLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <Outlet />
  </div>
);

const AdminLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <Outlet />
  </div>
);

const publicRoutes = [
  {
    element: <PublicLayout />,
    loader: requireGuest,
    errorElement: <RouteError />,
    children: [
      {
        path: ROUTES.LOGIN,
        lazy: lazyPage(() => import("./(auth)/login/page")),
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        lazy: lazyPage(() => import("./(auth)/forgot-password/page")),
      },
      {
        path: ROUTES.RESET_PASSWORD,
        lazy: lazyPage(() => import("./(auth)/reset-password/page")),
      },
    ],
  },
];

const adminRoutes = [
  {
    element: <AdminLayout />,
    loader: requireAuth,
    errorElement: <RouteError />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        lazy: lazyPage(() => import("./(admin)/dashboard/page")),
        handle: { title: "Dashboard", permission: "dashboard:read" },
      },
      {
        path: ROUTES.USERS,
        lazy: lazyPage(() => import("./(admin)/users/page")),
        handle: { title: "Users", permission: "users:read" },
      },
      {
        path: `${ ROUTES.USERS }/:userId`,
lazy: lazyPage(() => import("./(admin)/users/[id]/page")),
  handle: { title: "User Details", permission: "users:read" },
      },
{
  path: ROUTES.ROLES,
    lazy: lazyPage(() => import("./(admin)/roles/page")),
      handle: { title: "Roles", permission: "roles:read" },
},
{
  path: ROUTES.PERMISSIONS,
    lazy: lazyPage(() => import("./(admin)/permissions/page")),
      handle: { title: "Permissions", permission: "permissions:read" },
},
{
  path: ROUTES.ANALYTICS,
    lazy: lazyPage(() => import("./(admin)/analytics/page")),
      handle: { title: "Analytics", permission: "analytics:read" },
},
{
  path: ROUTES.BILLING,
    lazy: lazyPage(() => import("./(admin)/billing/page")),
      handle: { title: "Billing", permission: "billing:read" },
},
{
  path: ROUTES.AUDIT_LOG,
    lazy: lazyPage(() => import("./(admin)/audit-log/page")),
      handle: { title: "Audit Log", permission: "audit:read" },
},
{
  path: ROUTES.SYSTEM,
    lazy: lazyPage(() => import("./(admin)/system/page")),
      handle: { title: "System", permission: "system:read" },
},
{
  path: ROUTES.SETTINGS,
    lazy: lazyPage(() => import("./(admin)/settings/page")),
      handle: { title: "Settings", permission: "settings:read" },
},
    ],
  },
];

const routeConfig = [
  {
    path: ROUTES.ROOT,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  ...publicRoutes,
  ...adminRoutes,
  {
    path: "*",
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
];
export const router = createBrowserRouter(routeConfig);
const AppRouter = () => (
  <RouterProvider router={router} fallbackElement={<LoadingScreen />} />
);

export default AppRouter;