const APP_NAME = "Admin Dashboard";
const API_VERSION = "v1";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
});

class AppError extends Error {
  constructor(message, { status = 500, code = ERROR_CODES.INTERNAL_ERROR, details = null, cause } = {}) {
    super(message, { cause });
    Object.assign(this, {
      name: "AppError",
      status,
      code,
      details,
      operational: true
    });
    Error.captureStackTrace?.(this, AppError);
  }
}

const invariant = (condition, message = "Invariant violation.") => {
  if (!condition) throw new AppError(message, {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: "INVARIANT_VIOLATION"
  });
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const createPagination = (input = {}) => {
  const page = parsePositiveInteger(input.page, 1);
  const limit = clamp(
    parsePositiveInteger(input.limit, DEFAULT_PAGE_SIZE),
    1,
    MAX_PAGE_SIZE
  );
  return Object.freeze({
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit
  });
};

const createPageMeta = ({ page, limit, total }) => {
  const safeTotal = Math.max(0, Number(total) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit));
  return Object.freeze({
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  });
};

const createSuccess = (data, meta) => Object.freeze({
  success: true,
  data,
  ...(meta ? { meta } : null)
});

const createFailure = (error) => {
  const normalized = error instanceof AppError ? error : new AppError(
    "An unexpected error occurred.",
    { cause: error }
  );
  return Object.freeze({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : null)
    }
  });
};

const asyncHandler = (handler) => {
  invariant(typeof handler === "function", "Handler must be a function.");
  return (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);
};
const compactObject = (value = {}) => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined)
);
const unique = (values = []) => [...new Set(values)];

export {
  API_VERSION,
  APP_NAME,
  AppError,
  DEFAULT_PAGE_SIZE,
  ERROR_CODES,
  HTTP_STATUS,
  MAX_PAGE_SIZE,
  asyncHandler,
  clamp,
  compactObject,
  createFailure,
  createPageMeta,
  createPagination,
  createSuccess,
  invariant,
  parsePositiveInteger,
  unique
};
