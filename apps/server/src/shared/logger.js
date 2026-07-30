const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, fatal: 50 });
const ENV = process.env.NODE_ENV || "development";
const SERVICE = process.env.SERVICE_NAME || "admin-dashboard-api";
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? (ENV === "production" ? 20 : 10);
const REDACT_KEYS = new Set([
  "authorization", "cookie", "password", "passwordHash", "accessToken",
  "refreshToken", "token", "secret", "apiKey"
]);

const isObject = (value) => value !== null && typeof value === "object";
const sanitize = (value, seen = new WeakSet()) => {
  if (!isObject(value)) return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      code: value.code,
      stack: ENV === "production" ? undefined : value.stack
    };
  }

  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      REDACT_KEYS.has(key) ? "[REDACTED]" : sanitize(item, seen)
    ])
  );
};

const normalize = (input) => {
  if (input instanceof Error) return { error: sanitize(input) };
  if (isObject(input)) return sanitize(input);
  return input === undefined ? {} : { message: String(input) };
};

const write = (level, context, message, metadata) => {
  if (LEVELS[level] < MIN_LEVEL) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    environment: ENV,
    ...context,
    ...normalize(metadata),
    ...(message ? { message } : null)
  };
  const output = JSON.stringify(entry);
  const stream = level === "error" || level === "fatal" ? process.stderr : process.stdout;
  stream.write(`${output}\n`);
};

const createLogger = (context = {}) => {
  const log = (level, input, message) => {
    const metadata = typeof input === "string" ? {} : input;
    const text = typeof input === "string" ? input : message;
    write(level, sanitize(context), text, metadata);
  };

  return Object.freeze({
    debug: (input, message) => log("debug", input, message),
    info: (input, message) => log("info", input, message),
    warn: (input, message) => log("warn", input, message),
    error: (input, message) => log("error", input, message),
    fatal: (input, message) => log("fatal", input, message),
    child: (bindings = {}) => createLogger({ ...context, ...sanitize(bindings) })
  });
};

const logger = createLogger();
const requestLogger = (request, response, next) => {
  const startedAt = performance.now();
  const requestId = request.id || request.headers["x-request-id"] || crypto.randomUUID();
  const log = logger.child({
    requestId,
    method: request.method,
    path: request.originalUrl || request.url
  });

  request.id = requestId;
  request.log = log;
  response.once("finish", () => {
    const metadata = {
      statusCode: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      userId: request.auth?.id
    };

    if (response.statusCode >= 500) log.error(metadata, "Request failed");
    else if (response.statusCode >= 400) log.warn(metadata, "Request rejected");
    else log.info(metadata, "Request completed");
  });

  next();
};

const captureProcessErrors = () => {
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught exception");
    process.exitCode = 1;
  });
};

export { createLogger, captureProcessErrors, logger, requestLogger };
export default logger;
