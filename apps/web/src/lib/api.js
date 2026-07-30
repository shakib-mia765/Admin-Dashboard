const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");
const DEFAULT_TIMEOUT = 15_000;
const RETRY_STATUS = Object.freeze([408, 425, 429, 500, 502, 503, 504]);
const SAFE_METHODS = Object.freeze(["GET", "HEAD", "OPTIONS"]);
const TOKEN_KEY = "admin_access_token";

class ApiError extends Error {
  constructor(message, { status = 0, code = "API_ERROR", details = null } = {}) {
    super(message);
    Object.assign(this, { name: "ApiError", status, code, details });
  }
}
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseBody = async (response) => {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  const text = await response.text();
  return text || null;
};

const buildUrl = (path, query = {}) => {
  const url = new URL(`${API_URL}/${String(path).replace(/^\/+/, "")}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const createHeaders = (body, headers = {}) => {
  const token = getToken();
  const jsonBody = body !== undefined && !(body instanceof FormData);
  return {
    Accept: "application/json",
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  };
};

const request = async (path, options = {}) => {
  const {
    method = "GET",
    query,
    body,
    headers,
    timeout = DEFAULT_TIMEOUT,
    retries = 2,
    signal
  } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetch(buildUrl(path, query), {
          method,
          headers: createHeaders(body, headers),
          body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
          signal: controller.signal,
          credentials: "include"
        });
        const data = await parseBody(response);
        if (response.ok) return data;
        const error = new ApiError(
          data?.message || `Request failed with status ${response.status}.`,
          { status: response.status, code: data?.code, details: data?.errors || data }
        );

        const retryable = SAFE_METHODS.includes(method.toUpperCase()) &&
          RETRY_STATUS.includes(response.status) && attempt < retries;
        if (!retryable) throw error;
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 300 * 2 ** attempt);
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted) {
          throw new ApiError("Request timed out.", { code: "REQUEST_TIMEOUT" });
        }
        if (attempt >= retries || !SAFE_METHODS.includes(method.toUpperCase())) {
          throw new ApiError("Network request failed.", {
            code: "NETWORK_ERROR",
            details: error
          });
        }
        await sleep(300 * 2 ** attempt);
      }
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
};

const api = Object.freeze({
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
  upload: (path, formData, options = {}) => request(path, {
    ...options,
    method: options.method || "POST",
    body: formData
  })
});

export { API_URL, ApiError, api, getToken, setToken, request };