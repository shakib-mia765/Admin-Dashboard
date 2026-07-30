import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.js';
import { sendError, sendSuccess } from './shared/response.js';

const API_PREFIX = '/api/v1';
const REQUEST_ID_HEADER = 'x-request-id';
const HTTP_METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const createRequestId = () => {
  const value = globalThis.crypto?.randomUUID?.();
  return value ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const requestContext = (request, response, next) => {
  const requestId = request.get(REQUEST_ID_HEADER)?.trim() || createRequestId();
  request.id = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};
const notFound = (request, response) =>
  sendError(response, {
    status: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${request.method} ${request.originalUrl} was not found`,
  });

const createApp = ({
  modules = [],
  errorHandler,
  logger,
  rateLimiter,
  authenticate,
} = {}) => {
  if (!Array.isArray(modules)) throw new TypeError('modules must be an array');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.server.trustProxy);
  app.use(requestContext);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.isProduction ? undefined : false,
  }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || env.cors.origins.includes(origin)) return callback(null, true);
      const error = new Error('Origin is not allowed by CORS');
      error.status = 403;
      return callback(error);
    },
    methods: HTTP_METHODS,
    credentials: true,
    maxAge: 86400,
  }));
  app.use(compression());
  app.use(express.json({
    limit: env.server.bodyLimit,
    strict: true,
  }));
  app.use(express.urlencoded({
    extended: false,
    limit: env.server.bodyLimit,
  }));
  if (rateLimiter) app.use(rateLimiter);
  if (authenticate) app.use((request, response, next) => {
    request.authenticate = () => authenticate(request, response, next);
    next();
  });

  app.get('/health', (_request, response) =>
    sendSuccess(response, {
      data: {
        status: 'ok',
        environment: env.nodeEnv,
        uptime: Math.floor(process.uptime()),
      },
    }),
  );
  modules.forEach(module => {
    if (!module?.basePath || !module?.router) {
      throw new TypeError('Every module requires basePath and router');
    }

    app.use(`${API_PREFIX}${module.basePath}`, module.router);
    logger?.info?.({
      event: 'module.registered',
      module: module.name ?? module.basePath,
      path: `${API_PREFIX}${module.basePath}`,
    });
  });

  app.use(notFound);
  app.use(errorHandler ?? ((error, request, response, _next) => {
    const status = Number.isInteger(error.status) ? error.status : 500;
    logger?.error?.({
      event: 'request.failed',
      requestId: request.id,
      method: request.method,
      path: request.originalUrl,
      status,
      error: error.message,
      stack: env.isProduction ? undefined : error.stack,
    });

    sendError(response, {
      status,
      code: error.code ?? 'INTERNAL_ERROR',
      message: status >= 500 && env.isProduction
        ? 'An unexpected error occurred'
        : error.message,
      details: env.isProduction ? undefined : error.details,
    });
  }));

  return app;
};

export { API_PREFIX, createApp };
export default createApp;