const DEFAULT_RANGE = Object.freeze({ from: null, to: null });
const ALLOWED_RANGES = new Set(['7d', '30d', '90d', '1y']);

const asInteger = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
};

const normalizeRange = query => {
  const range = ALLOWED_RANGES.has(query.range) ? query.range : '30d';
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : null;
  if (validFrom && validTo && validFrom > validTo) {
    const error = new Error('from must be earlier than to');
    error.status = 400;
    throw error;
  }

  return Object.freeze({
    range,
    from: validFrom ?? DEFAULT_RANGE.from,
    to: validTo ?? DEFAULT_RANGE.to,
  });
};

const asyncHandler = handler => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);
const createDashboardModule = ({
  Router,
  dashboardService,
  authenticate,
  authorize,
  cache,
  logger,
}) => {
  if (typeof Router !== 'function') throw new TypeError('Router is required');
  if (!dashboardService) throw new TypeError('dashboardService is required');
  const router = Router();
  const protect = [
    authenticate,
    authorize?.('dashboard:read'),
  ].filter(Boolean);

  const send = handler => asyncHandler(async (request, response) => {
    const startedAt = Date.now();
    const result = await handler(request);
    logger?.info?.({
      event: 'dashboard.request.completed',
      path: request.originalUrl,
      durationMs: Date.now() - startedAt,
      userId: request.user?.id,
    });

    response.status(200).json({
      success: true,
      data: result,
      meta: {
        requestId: request.id ?? null,
        generatedAt: new Date().toISOString(),
      },
    });
  });

  router.get(
    '/overview',
    ...protect,
    cache?.('dashboard:overview', 60) ?? [],
    send(request => dashboardService.getOverview({
      ...normalizeRange(request.query),
      tenantId: request.user?.tenantId,
    })),
  );

  router.get(
    '/metrics',
    ...protect,
    send(request => dashboardService.getMetrics({
      ...normalizeRange(request.query),
      tenantId: request.user?.tenantId,
      limit: asInteger(request.query.limit, 20, 1, 100),
    })),
  );
  router.get(
    '/activity',
    ...protect,
    send(request => dashboardService.getActivity({
      tenantId: request.user?.tenantId,
      cursor: request.query.cursor ?? null,
      limit: asInteger(request.query.limit, 20, 1, 100),
    })),
  );

  router.get(
    '/health',
    ...protect,
    send(request => dashboardService.getSystemHealth({
      tenantId: request.user?.tenantId,
    })),
  );

  router.post(
    '/refresh',
    ...protect,
    authorize?.('dashboard:refresh') ?? ((_request, _response, next) => next()),
    asyncHandler(async (request, response) => {
      const result = await dashboardService.refresh({
        tenantId: request.user?.tenantId,
        requestedBy: request.user?.id,
      });
      response.status(202).json({
        success: true,
        data: result,
        meta: {
          requestId: request.id ?? null,
          acceptedAt: new Date().toISOString(),
        },
      });
    }),
  );

  return Object.freeze({
    name: 'dashboard',
    basePath: '/dashboard',
    router,
  });
};

export { createDashboardModule };
export default createDashboardModule;
