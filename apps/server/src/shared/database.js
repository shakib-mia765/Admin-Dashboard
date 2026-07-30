import { PrismaClient } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";
const globalDatabase = globalThis;
const createClient = () => new PrismaClient({
  log: isProduction ? ["error"] : ["query", "info", "warn", "error"],
  errorFormat: isProduction ? "minimal" : "pretty",
  transactionOptions: {
    maxWait: 5_000,
    timeout: 10_000,
    isolationLevel: "ReadCommitted"
  }
});

const database = globalDatabase.__database__ ?? createClient();
if (!isProduction) globalDatabase.__database__ = database;
let connected = false;
let connecting = null;
const connect = async () => {
  if (connected) return database;
  if (connecting) return connecting;
  connecting = database.$connect()
    .then(() => {
      connected = true;
      return database;
    })
    .catch((error) => {
      connected = false;
      throw Object.assign(new Error("Database connection failed."), {
        name: "DatabaseConnectionError",
        code: "DATABASE_CONNECTION_FAILED",
        cause: error
      });
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
};

const disconnect = async () => {
  if (!connected && !connecting) return;
  await connecting?.catch(() => undefined);
  await database.$disconnect();
  connected = false;
};

const healthCheck = async () => {
  const startedAt = performance.now();
  try {
    await database.$queryRaw`SELECT 1`;
    return Object.freeze({
      status: "healthy",
      latencyMs: Math.round(performance.now() - startedAt)
    });
  } catch (error) {
    return Object.freeze({
      status: "unhealthy",
      latencyMs: Math.round(performance.now() - startedAt),
      error: error?.code ?? "DATABASE_UNAVAILABLE"
    });
  }
};

const transaction = (operation, options = {}) => {
  if (typeof operation !== "function") {
    throw new TypeError("Transaction operation must be a function.");
  }

  return database.$transaction(
    (client) => operation(client),
    {
      maxWait: options.maxWait ?? 5_000,
      timeout: options.timeout ?? 10_000,
      isolationLevel: options.isolationLevel ?? "ReadCommitted"
    }
  );
};
const registerShutdown = () => {
  const shutdown = async (signal) => {
    try {
      await disconnect();
    } finally {
      process.exitCode = signal === "SIGTERM" ? 0 : 1;
    }
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

export {
  connect,
  database,
  disconnect,
  healthCheck,
  registerShutdown,
  transaction
};

export default database;
