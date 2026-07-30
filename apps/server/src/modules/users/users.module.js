const ROLES = Object.freeze(['Admin', 'Manager', 'Analyst', 'Member']);
const STATUSES = Object.freeze(['active', 'invited', 'suspended']);
const SORT_FIELDS = new Set(['name', 'email', 'role', 'status', 'createdAt', 'lastSeen']);

const asInteger = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
};

const asEnum = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;
const normalizeId = value => {
  const id = String(value ?? '').trim();
  if (!id) {
    const error = new Error('User id is required');
    error.status = 400;
    throw error;
  }
  return id;
};

const normalizeQuery = query => Object.freeze({
  search: String(query.search ?? '').trim().slice(0, 100),
  role: asEnum(query.role, ROLES, null),
  status: asEnum(query.status, STATUSES, null),
  sort: SORT_FIELDS.has(query.sort) ? query.sort : 'createdAt',
  order: query.order === 'asc' ? 'asc' : 'desc',
  page: asInteger(query.page, 1, 1, 100000),
  limit: asInteger(query.limit, 20, 1, 100),
});

const asyncHandler = handler => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);
const createUsersModule = ({
  Router,
  usersService,
  authenticate,
  authorize,
  validate,
  schemas = {},
  logger,
}) => {
  if (typeof Router !== 'function') throw new TypeError('Router is required');
  if (!usersService) throw new TypeError('usersService is required');
  const router = Router();
  const secure = permission => [
    authenticate,
    authorize?.(permission),
  ].filter(Boolean);

  const execute = (handler, status = 200) => asyncHandler(async (request, response) => {
    const startedAt = Date.now();
    const data = await handler(request);
    logger?.info?.({
      event: 'users.request.completed',
      method: request.method,
      path: request.originalUrl,
      userId: request.user?.id,
      durationMs: Date.now() - startedAt,
    });

    response.status(status).json({
      success: true,
      data,
      meta: {
        requestId: request.id ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  });

  router.get(
    '/',
    ...secure('users:read'),
    execute(request => usersService.list({
      ...normalizeQuery(request.query),
      tenantId: request.user?.tenantId,
    })),
  );
  router.get(
    '/:id',
    ...secure('users:read'),
    execute(request => usersService.getById({
      id: normalizeId(request.params.id),
      tenantId: request.user?.tenantId,
    })),
  );
  router.post(
    '/',
    ...secure('users:create'),
    ...[validate?.(schemas.create)].filter(Boolean),
    execute(request => usersService.create({
      input: request.body,
      tenantId: request.user?.tenantId,
      actorId: request.user?.id,
    }), 201),
  );

  router.patch(
    '/:id',
    ...secure('users:update'),
    ...[validate?.(schemas.update)].filter(Boolean),
    execute(request => usersService.update({
      id: normalizeId(request.params.id),
      input: request.body,
      tenantId: request.user?.tenantId,
      actorId: request.user?.id,
    })),
  );
  router.patch(
    '/:id/status',
    ...secure('users:status:update'),
    ...[validate?.(schemas.status)].filter(Boolean),
    execute(request => usersService.updateStatus({
      id: normalizeId(request.params.id),
      status: request.body.status,
      tenantId: request.user?.tenantId,
      actorId: request.user?.id,
    })),
  );

  router.delete(
    '/:id',
    ...secure('users:delete'),
    execute(request => usersService.remove({
      id: normalizeId(request.params.id),
      tenantId: request.user?.tenantId,
      actorId: request.user?.id,
    })),
  );
  return Object.freeze({
    name: 'users',
    basePath: '/users',
    router,
  });
};

export { createUsersModule };
export default createUsersModule;
