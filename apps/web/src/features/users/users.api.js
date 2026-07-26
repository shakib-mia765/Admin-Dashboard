const API_URL = String(
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
).replace(/\/+$/, "");

const USERS_ENDPOINT = `${API_URL}/users`;
const DEFAULT_TIMEOUT = 15_000;
const createAbortSignal = (timeout = DEFAULT_TIMEOUT, externalSignal) => {
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out.", "TimeoutError")),
    timeout,
  );

  const abort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timer);
      externalSignal?.removeEventListener("abort", abort);
    },
  };
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");
  if (response.ok) return data;

  const error = new Error(
    data?.message || data?.error || response.statusText || "Request failed.",
  );
  error.name = "ApiError";
  error.status = response.status;
  error.code = data?.code ?? null;
  error.details = data?.details ?? null;
  throw error;
};

const request = async (
  path = "",
  { method = "GET", body, headers, signal, timeout } = {},
) => {
  const abort = createAbortSignal(timeout, signal);
  try {
    const response = await fetch(`${USERS_ENDPOINT}${path}`, {
      method,
      credentials: "include",
      signal: abort.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await parseResponse(response);
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new Error("The request was cancelled or timed out.");
    }

    if (error instanceof TypeError) {
      throw new Error("Unable to connect to the API.");
    }
    throw error;
  } finally {
    abort.cleanup();
  }
};
const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const getUsers = (params = {}, options = {}) =>
  request(toQueryString(params), options);
export const getUserById = (userId, options = {}) =>
  request(`/${encodeURIComponent(userId)}`, options);
export const createUser = (payload, options = {}) =>
  request("", { ...options, method: "POST", body: payload });
export const updateUser = (userId, payload, options = {}) =>
  request(`/${encodeURIComponent(userId)}`, {
    ...options,
    method: "PATCH",
    body: payload,
  });

export const deleteUser = (userId, options = {}) =>
  request(`/${encodeURIComponent(userId)}`, {
    ...options,
    method: "DELETE",
  });

export const updateUserStatus = (userId, status, options = {}) =>
  request(`/${encodeURIComponent(userId)}/status`, {
    ...options,
    method: "PATCH",
    body: { status },
  });