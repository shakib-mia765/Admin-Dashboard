const DEFAULT_STATUS = 200;
const DEFAULT_ERROR_STATUS = 500;
const DEFAULT_ERROR_CODE = 'INTERNAL_ERROR';

const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const compactObject = value => Object.freeze(
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ),
);

const resolveRequestId = request =>
  request?.id ??
  request?.headers?.['x-request-id'] ??
  null
const createMeta = (request, meta = {}) => compactObject({
  requestId: resolveRequestId(request),
  timestamp: new Date().toISOString(),
  ...meta,
});

const createSuccessPayload = ({
  data = null,
  message,
  meta,
  request,
}) => Object.freeze({
  success: true,
  ...(message ? { message } : {}),
  data,
  meta: createMeta(request, meta),
});

const createErrorPayload = ({
  code = DEFAULT_ERROR_CODE,
  message = 'An unexpected error occurred',
  details,
  meta,
  request,
}) => Object.freeze({
  success: false,
  error: compactObject({
    code,
    message,
    details,
  }),
  meta: createMeta(request, meta),
});

const sendSuccess = (response, {
  status = DEFAULT_STATUS,
  data = null,
  message,
  meta,
  headers,
} = {}) => {
  if (!response) throw new TypeError('response is required');
  if (isObject(headers)) {
    Object.entries(headers).forEach(([name, value]) => {
      if (value !== undefined) response.setHeader(name, String(value));
    });
  }

  return response.status(status).json(
    createSuccessPayload({
      data,
      message,
      meta,
      request: response.req,
    }),
  );
};

const sendError = (response, {
  status = DEFAULT_ERROR_STATUS,
  code = DEFAULT_ERROR_CODE,
  message,
  details,
  meta,
  headers,
} = {}) => {
  if (!response) throw new TypeError('response is required');
  if (isObject(headers)) {
    Object.entries(headers).forEach(([name, value]) => {
      if (value !== undefined) response.setHeader(name, String(value));
    });
  }
  return response.status(status).json(
    createErrorPayload({
      code,
      message,
      details,
      meta,
      request: response.req,
    }),
  );
};

const sendCreated = (response, data, options = {}) =>
  sendSuccess(response, {
    status: 201,
    data,
    ...options,
  });

const sendAccepted = (response, data, options = {}) =>
  sendSuccess(response, {
    status: 202,
    data,
    ...options,
  });
const sendNoContent = response => {
  if (!response) throw new TypeError('response is required');
  return response.status(204).send();
};

const sendPaginated = (response, data, {
  page,
  limit,
  total,
  ...options
} = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 20, 1);
  const safeTotal = Math.max(Number(total) || 0, 0);
  return sendSuccess(response, {
    data,
    meta: {
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: safeTotal,
        pages: Math.ceil(safeTotal / safeLimit),
      },
      ...options.meta,
    },
    ...options,
  });
};

export {
  createErrorPayload,
  createSuccessPayload,
  sendAccepted,
  sendCreated,
  sendError,
  sendNoContent,
  sendPaginated,
  sendSuccess,
};