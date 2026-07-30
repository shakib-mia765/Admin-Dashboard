import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema
} from "../schemas/auth.schema.js";

const ROUTES = Object.freeze({
  REGISTER: "/register",
  LOGIN: "/login",
  REFRESH: "/refresh",
  LOGOUT: "/logout",
  SESSION: "/session"
});

const assertDependencies = (dependencies) => {
  const required = ["authController", "authRateLimit"];
  const missing = required.filter((key) => !dependencies?.[key]);
  if (missing.length) {
    throw new TypeError(`Auth module missing: ${missing.join(", ")}`);
  }
};

const bind = (controller, method) => {
  const handler = controller?.[method];
  if (typeof handler !== "function") {
    throw new TypeError(`authController.${method} must be a function.`);
  }
  return asyncHandler(handler.bind(controller));
};

const createAuthModule = (dependencies = {}) => {
  assertDependencies(dependencies);
  const { authController, authRateLimit } = dependencies;
  const router = Router({ caseSensitive: true, strict: true });
  router.post(
    ROUTES.REGISTER,
    authRateLimit,
    validate(registerSchema),
    bind(authController, "register")
  );

  router.post(
    ROUTES.LOGIN,
    authRateLimit,
    validate(loginSchema),
    bind(authController, "login")
  );
  router.post(
    ROUTES.REFRESH,
    authRateLimit,
    validate(refreshSchema),
    bind(authController, "refresh")
  );

  router.post(
    ROUTES.LOGOUT,
    authenticate,
    bind(authController, "logout")
  );

  router.get(
    ROUTES.SESSION,
    authenticate,
    bind(authController, "session")
  );
  return router;
};

export { ROUTES, createAuthModule };
export default createAuthModule;