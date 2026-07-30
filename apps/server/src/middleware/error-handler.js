const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PRODUCTION = NODE_ENV === "production";

const STATUS_BY_CODE = Object.freeze({
  VALIDATION_ERROR: 400,
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT_ERROR: 429,
  INTERNAL_ERROR: 500
});

const SAFE_MESSAGES = Object.freeze({
  400: "Invalid request.",
  401: "Authentication required.",
  403: "You do not have permission to perform this action.",
  404: "Resource not found.",
  409: "The request conflicts with the current resource state.",
  429: "Too many requests. Please try again later.",
  500: "An unexpected server error occurred."
});

const normalizeStatus = (error) => {
  const candidate = Number(error?.statusCode ?? error?.status);
  if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) return candidate;
  return STATUS_BY_CODE[error?.code] ?? 500;
};

const normalizeMessage = (error, status) => {
  if (!IS_PRODUCTION && typeof error?.message === "string") return error.message;
  if (error?.expose === true && typeof error?.message === "string") return error.message;
  return SAFE_MESSAGES[status] ?? SAFE_MESSAGES[500];
};

const normalizeIssues = (error) => {
  if (Array.isArray(error?.issues)) return error.issues;
  if (Array.isArray(error?.errors)) return error.errors;
  return undefined;
};

const getRequestId = (req, res) => {
  const value = res.locals?.requestId ?? req.id ?? req.headers["x-request-id"];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const logError = (error, context) => {
  const logger = context.req.app?.locals?.logger ?? console;
  const method = context.status >= 500 ? "error" : "warn";
  logger[method]?.({
    event: "request_failed",
    status: context.status,
    method: context.req.method,
    path: context.req.originalUrl,
    requestId: context.requestId,
    code: error?.code,
    message: error?.message,
    stack: context.status >= 500 ? error?.stack : undefined
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found.",
      method: req.method,
      path: req.originalUrl,
      requestId: getRequestId(req, res)
    }
  });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status = normalizeStatus(error);
  const requestId = getRequestId(req, res);
  const issues = normalizeIssues(error);

  logError(error, { req, status, requestId });

  const payload = {
    success: false,
    error: {
      code: error?.code ?? (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
      message: normalizeMessage(error, status),
      ...(issues?.length ? { issues } : {}),
      ...(requestId ? { requestId } : {}),
      ...(!IS_PRODUCTION && error?.stack ? { stack: error.stack } : {})
    }
  };

  return res.status(status).json(payload);
};
