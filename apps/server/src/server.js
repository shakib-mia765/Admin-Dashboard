import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { connect, disconnect, healthCheck } from "./shared/database.js";
import logger, { captureProcessErrors } from "./shared/logger.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const SHUTDOWN_TIMEOUT = Number.parseInt(
  process.env.SHUTDOWN_TIMEOUT_MS || "10000",
  10
);
const assertConfig = () => {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
};
const server = http.createServer(app);
const sockets = new Set();
let shuttingDown = false;
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 30_000;
server.maxRequestsPerSocket = 1_000;
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.once("close", () => sockets.delete(socket));
});
server.on("clientError", (error, socket) => {
  logger.warn({ error }, "Invalid HTTP client request");
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});
server.on("error", (error) => {
  logger.fatal({ error }, "HTTP server failure");
  process.exitCode = 1;
});
const closeServer = () => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
});
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");
  const forceTimer = setTimeout(() => {
    logger.fatal({ openSockets: sockets.size }, "Graceful shutdown timed out");
    sockets.forEach((socket) => socket.destroy());
    process.exitCode = 1;
  }, SHUTDOWN_TIMEOUT);
  forceTimer.unref();
  try {
    server.closeIdleConnections?.();
    await closeServer();
    await disconnect();
    clearTimeout(forceTimer);
    logger.info({ signal }, "Graceful shutdown completed");
  } catch (error) {
    logger.error({ error, signal }, "Graceful shutdown failed");
    sockets.forEach((socket) => socket.destroy());
    process.exitCode = 1;
  }
};
const start = async () => {
  assertConfig();
  captureProcessErrors();
  await connect();
  const database = await healthCheck();
  if (database.status !== "healthy") {
    throw new Error("Database health check failed.");
  }
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, () => {
      server.off("error", reject);
      resolve();
    });
  });
  logger.info({
    host: HOST,
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    databaseLatencyMs: database.latencyMs
  }, "API server started");
};
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
start().catch(async (error) => {
  logger.fatal({ error }, "API startup failed");
  await disconnect().catch((disconnectError) => {
    logger.error({ error: disconnectError }, "Database disconnect failed");
  });
  process.exitCode = 1;
});

export { server, shutdown, start };
