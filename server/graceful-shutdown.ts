import type { Server } from "http";
import { pool } from "./db";
import { logger } from "./logger";

/**
 * Setup graceful shutdown handlers for the HTTP server
 * This ensures connections are closed properly when the app is terminated
 */
export function setupGracefulShutdown(httpServer: Server) {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Starting graceful shutdown");
    
    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info("HTTP server closed");
      
      try {
        // Close database connections
        await pool.end();
        logger.info("Database connections closed");
        
        logger.info("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, "Error during graceful shutdown");
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error("Forceful shutdown after timeout");
      process.exit(1);
    }, 30000);
  };
  
  // Listen for termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  
  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught Exception");
    shutdown("UNCAUGHT_EXCEPTION");
  });
  
  process.on("unhandledRejection", (reason, promise) => {
    logger.error({ promise, reason }, "Unhandled Rejection");
    shutdown("UNHANDLED_REJECTION");
  });
}
