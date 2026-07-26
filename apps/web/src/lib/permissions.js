const ACTIONS = Object.freeze({
    READ: "read",
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    MANAGE: "manage"
});

const RESOURCES = Object.freeze({
    DASHBOARD: "dashboard",
    USERS: "users",
    ROLES: "roles",
    ANALYTICS: "analytics",
    BILLING: "billing",
    SETTINGS: "settings",
    AUDIT: "audit"
});
const ROLES = Object.freeze({
    SUPER_ADMIN: "super-admin",
    ADMIN: "admin",
    MANAGER: "manager",
    SUPPORT: "support",
    ANALYST: "analyst",
    VIEWER: "viewer"
});

const permission = (resource, action) => `${resource}:${action}`;
const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.SUPER_ADMIN]: Object.freeze(["*"]),
    [ROLES.ADMIN]: Object.freeze([
        "dashboard:read", "users:manage", "roles:manage", "analytics:read",
        "billing:manage", "settings:update", "audit:read"
    ]),
    [ROLES.MANAGER]: Object.freeze([
        "dashboard:read", "users:read", "users:create", "users:update",
        "analytics:read", "audit:read"
    ]),
    [ROLES.SUPPORT]: Object.freeze([
        "dashboard:read", "users:read", "users:update"
    ]),
    [ROLES.ANALYST]: Object.freeze([
        "dashboard:read", "analytics:read", "billing:read"
    ]),
    [ROLES.VIEWER]: Object.freeze(["dashboard:read"])
});

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const toArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const unique = (values) => [...new Set(values.map(normalize).filter(Boolean))];
const getPermissions = (subject = {}) => {
    const roles = unique([...toArray(subject.role), ...toArray(subject.roles)]);
    const inherited = roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []);
    return new Set(unique([...inherited, ...toArray(subject.permissions)]));
};
const matches = (granted, required) => {
    if (granted === "*" || granted === required) return true;
    const [grantedResource, grantedAction] = granted.split(":");
    const [requiredResource, requiredAction] = required.split(":");
    const resourceMatch = grantedResource === "*" || grantedResource === requiredResource;
    const actionMatch = grantedAction === "*" ||
        grantedAction === ACTIONS.MANAGE ||
        grantedAction === requiredAction;
    return resourceMatch && actionMatch;
};

const can = (subject, resource, action) => {
    const normalizedResource = normalize(resource);
    const normalizedAction = normalize(action);
    if (!normalizedResource || !normalizedAction) return false;
    const required = permission(normalizedResource, normalizedAction);
    return [...getPermissions(subject)].some((granted) => matches(granted, required));
};
const canAny = (subject, requirements = []) => requirements.some(
    ({ resource, action }) => can(subject, resource, action)
);
const canAll = (subject, requirements = []) => requirements.every(
    ({ resource, action }) => can(subject, resource, action)
);
const authorize = (subject, resource, action) => {
    if (can(subject, resource, action)) return true;
    const error = new Error(`Forbidden: ${permission(resource, action)}`);
    Object.assign(error, { name: "AuthorizationError", code: "FORBIDDEN", status: 403 });
    throw error;
};
const filterAuthorized = (subject, items = []) => items.filter(
    ({ resource, action }) => can(subject, resource, action)
);

export {
    ACTIONS,
    RESOURCES,
    ROLES,
    ROLE_PERMISSIONS,
    permission,
    getPermissions,
    can,
    canAny,
    canAll,
    authorize,
    filterAuthorized
};