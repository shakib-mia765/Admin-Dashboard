import { jwtVerify } from "jose";
import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || "admin-dashboard-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "admin-dashboard";
const ALGORITHMS = Object.freeze(["HS256"]);
const createError = (status, message, code) => {
  const error = new Error(message);
  return Object.assign(error, { name: "AuthError", status, code });
};

const getSecret = () => {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw createError(500, "Authentication is not configured.", "AUTH_CONFIG_ERROR");
  }
  return new TextEncoder().encode(JWT_SECRET);
};
const getBearerToken = (request) => {
  const header = request.headers.authorization;
  if (typeof header !== "string") return null;
  const [scheme, token, ...extra] = header.trim().split(/\s+/);
  return /^Bearer$/i.test(scheme) && token && !extra.length ? token : null;
};
const normalizePermissions = (permissions = []) => [
  ...new Set(permissions.map(({ key, resource, action }) =>
    key || `${resource}:${action}`
  ).filter(Boolean))
];

const loadUser = (id) => prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    status: true,
    role: {
      select: {
        name: true,
        permissions: {
          select: { key: true, resource: true, action: true }
        }
      }
    }
  }
});

const resolveIdentity = async (request) => {
  const token = getBearerToken(request);
  if (!token) throw createError(401, "Authentication required.", "TOKEN_REQUIRED");
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSecret(), {
      algorithms: ALGORITHMS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }));
  } catch {
    throw createError(401, "Invalid or expired access token.", "TOKEN_INVALID");
  }
  if (typeof payload.sub !== "string") {
    throw createError(401, "Invalid access token subject.", "TOKEN_SUBJECT_INVALID");
  }
  const user = await loadUser(payload.sub);
  if (!user) throw createError(401, "User account not found.", "USER_NOT_FOUND");
  if (user.status !== "ACTIVE") {
    throw createError(403, "User account is not active.", "USER_INACTIVE");
  }

  const permissions = normalizePermissions(user.role?.permissions);
  return Object.freeze({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role?.name ?? null,
    permissions: Object.freeze(permissions),
    tokenId: payload.jti ?? null
  });
};

const authenticate = async (request, response, next) => {
  try {
    request.auth = await resolveIdentity(request);
    next();
  } catch (error) {
    next(error);
  }
};
const optionalAuth = async (request, response, next) => {
  if (!getBearerToken(request)) return next();
  return authenticate(request, response, next);
};
const hasPermission = (permissions, required) => {
  if (permissions.includes("*") || permissions.includes(required)) return true;
  const [resource, action] = required.split(":");
  return permissions.some((permission) => {
    const [grantedResource, grantedAction] = permission.split(":");
    return (grantedResource === "*" || grantedResource === resource) &&
      (grantedAction === "*" || grantedAction === "manage" || grantedAction === action);
  });
};

const requireRoles = (...roles) => (request, response, next) => {
  if (!request.auth) return next(createError(401, "Authentication required.", "AUTH_REQUIRED"));
  if (roles.includes(request.auth.role)) return next();
  return next(createError(403, "Role access denied.", "ROLE_FORBIDDEN"));
};
const requirePermissions = (...required) => (request, response, next) => {
  if (!request.auth) return next(createError(401, "Authentication required.", "AUTH_REQUIRED"));
  const allowed = required.every((permission) =>
    hasPermission(request.auth.permissions, permission)
  );
  return allowed ? next() : next(createError(403, "Permission denied.", "PERMISSION_FORBIDDEN"));
};

export {
  authenticate,
  optionalAuth,
  requireRoles,
  requirePermissions,
  resolveIdentity
};