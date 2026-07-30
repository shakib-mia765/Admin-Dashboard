import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

const createModule = () => ({
  name: 'users',
  basePath: '/users',
  router: ((express) => {
    const router = express.Router();
    router.get('/', (_request, response) => response.status(200).json({
      success: true,
      data: [{ id: 'usr_1', email: 'admin@example.com' }],
    }));
    router.post('/', (request, response) => response.status(201).json({
      success: true,
      data: { id: 'usr_2', ...request.body },
    }));
    router.get('/failure', () => {
      const error = new Error('Service unavailable');
      error.status = 503;
      error.code = 'SERVICE_UNAVAILABLE';
      throw error;
    });
    return router;
  })(require('express')),
});

const createTestApp = ({
  modules = [createModule()],
  rateLimiter,
  errorHandler,
} = {}) => {
  const logger = { info: vi.fn(), error: vi.fn() };
  const app = createApp({ modules, rateLimiter, errorHandler, logger });
  return { app, logger };
};

describe('Admin Dashboard API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns service health and request metadata', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('x-request-id', 'req_health');
    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req_health');
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok' },
      meta: { requestId: 'req_health' },
    });
    expect(response.body.data.uptime).toEqual(expect.any(Number));
  });

  it('registers modules under the versioned API prefix', async () => {
    const { app, logger } = createTestApp();
    const response = await request(app).get('/api/v1/users');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { id: 'usr_1', email: 'admin@example.com' },
    ]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'module.registered',
        module: 'users',
        path: '/api/v1/users',
      }),
    );
  });

  it('parses JSON bodies and creates resources', async () => {
    const { app } = createTestApp();
    const input = { email: 'member@example.com', role: 'Member' };
    const response = await request(app)
      .post('/api/v1/users')
      .send(input);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { id: 'usr_2', ...input },
    });
  });

  it('returns a standardized response for unknown routes', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/v1/missing');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /api/v1/missing was not found',
      },
    });
  });

  it('forwards route failures to the global error handler', async () => {
    const { app, logger } = createTestApp();
    const response = await request(app).get('/api/v1/users/failure');
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
      },
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'request.failed',
        status: 503,
      }),
    );
  });

  it('executes injected middleware before API routes', async () => {
    const rateLimiter = vi.fn((_request, _response, next) => next());
    const { app } = createTestApp({ rateLimiter });
    await request(app).get('/api/v1/users');
    expect(rateLimiter).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed module definitions', () => {
    expect(() => createApp({
      modules: [{ name: 'broken' }],
    })).toThrow('Every module requires basePath and router');
  });
});
