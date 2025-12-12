import type { Server } from "http";
import { pool } from "./db";
import { logger } from "./logger";

/**
 * Setup graceful shutdown handlers for the HTTP server
 * This ensures connections are closed properly when the app is terminated
 */
export function setupGracefulShutdown(httpServer: Server) {
  let isShuttingDown = false;
  let forceTimeout: NodeJS.Timeout | null = null;

  const shutdown = (signal: string) => {
    if (isShuttingDown) {
      logger.warn({ signal }, "Shutdown already in progress");
      return;
    }
    isShuttingDown = true;

    logger.info({ signal }, "Starting graceful shutdown");

    // Force shutdown after 30 seconds
    forceTimeout = setTimeout(() => {
      logger.error("Forceful shutdown after timeout");
      process.exit(1);
    }, 30_000);

    // Stop accepting new connections
    httpServer.close(async (err) => {
      logger.info({ err }, "HTTP server closed");

      try {
        // Close database connections
        await pool.end();
        logger.info("Database connections closed");

        if (forceTimeout) clearTimeout(forceTimeout);
        logger.info("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        if (forceTimeout) clearTimeout(forceTimeout);
        logger.error({ err: error }, "Error during graceful shutdown");
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
