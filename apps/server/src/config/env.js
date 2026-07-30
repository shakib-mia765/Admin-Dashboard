const NODE_ENVS = Object.freeze(['development', 'test', 'production']);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const REQUIRED = Symbol('required');

const read = (name, fallback = REQUIRED) => {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== REQUIRED) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
};

const asEnum = (name, values, fallback) => {
  const value = read(name, fallback);
  if (values.includes(value)) return value;
  throw new Error(`${name} must be one of: ${values.join(', ')}`);
};
const asNumber = (name, { fallback, min = -Infinity, max = Infinity, integer = false } = {}) => {
  const raw = read(name, fallback);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value)) {
    throw new Error(`${name} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`);
  }
  return value;
};

const asBoolean = (name, fallback = false) => {
  const value = read(name, String(fallback)).toLowerCase();
  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;
  throw new Error(`${name} must be a boolean`);
};
const asUrl = (name, fallback) => {
  const value = read(name, fallback);
  try { return new URL(value).toString(); }
  catch { throw new Error(`${name} must be a valid URL`); }
};

const asList = (name, fallback = '') => Object.freeze(
  read(name, fallback).split(',').map(value => value.trim()).filter(Boolean),
);

const nodeEnv = asEnum('NODE_ENV', NODE_ENVS, 'development');
const isProduction = nodeEnv === 'production';
const port = asNumber('PORT', { fallback: 4000, min: 1, max: 65535, integer: true });
const host = read('HOST', '0.0.0.0');
const logLevel = asEnum(
  'LOG_LEVEL',
  ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
  isProduction ? 'info' : 'debug',
);
const databaseUrl = asUrl('DATABASE_URL');
const redisUrl = asUrl('REDIS_URL', 'redis://127.0.0.1:6379');
const clientOrigin = asUrl('CLIENT_ORIGIN', 'http://localhost:5173');
const jwtSecret = read('JWT_SECRET');
const jwtExpiresIn = read('JWT_EXPIRES_IN', '15m');
const refreshSecret = read('REFRESH_TOKEN_SECRET');
const refreshExpiresIn = read('REFRESH_TOKEN_EXPIRES_IN', '7d');
const trustProxy = asBoolean('TRUST_PROXY', isProduction);
const corsOrigins = asList('CORS_ORIGINS', clientOrigin);
const rateLimitWindowMs = asNumber('RATE_LIMIT_WINDOW_MS', {
  fallback: 900000,
  min: 1000,
  integer: true,
});
const rateLimitMax = asNumber('RATE_LIMIT_MAX', {
  fallback: 100,
  min: 1,
  integer: true,
});
const bodyLimit = read('BODY_LIMIT', '1mb');
const shutdownTimeoutMs = asNumber('SHUTDOWN_TIMEOUT_MS', {
  fallback: 10000,
  min: 1000,
  integer: true,
});

const assertSecureSecrets = () => {
  if (!isProduction) return;
  [
    ['JWT_SECRET', jwtSecret],
    ['REFRESH_TOKEN_SECRET', refreshSecret],
  ].forEach(([name, value]) => {
    if (value.length < 32) {
      throw new Error(`${name} must contain at least 32 characters in production`);
    }
  });

  if (corsOrigins.includes('*')) {
    throw new Error('CORS_ORIGINS cannot contain * in production');
  }
};

assertSecureSecrets();
const env = Object.freeze({
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  isProduction,
  server: Object.freeze({
    host,
    port,
    trustProxy,
    bodyLimit,
    shutdownTimeoutMs,
  }),
  database: Object.freeze({ url: databaseUrl }),
  redis: Object.freeze({ url: redisUrl }),
  auth: Object.freeze({
    jwtSecret,
    jwtExpiresIn,
    refreshSecret,
    refreshExpiresIn,
  }),
  cors: Object.freeze({ origins: corsOrigins }),
  rateLimit: Object.freeze({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
  }),
  logging: Object.freeze({ level: logLevel }),
});

export { env };
export default env;