import type { Server } from "http";
import { pool } from "./db";
import { logger } from "./logger";

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

codex/conduct-inspection
    forceTimeout = setTimeout(() => {
      logger.error("Forceful shutdown after timeout");
      process.exit(1);
    }, 30000);
    // Force shutdown after 30 seconds
    forceTimeout = setTimeout(() => {
      logger.error("Forceful shutdown after timeout");
      process.exit(1);
    }, 30_000);

    // Stop accepting new connections
main
    httpServer.close(async (err) => {
      logger.info({ err }, "HTTP server closed");

      try {
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
