import type { Server } from "http";
import { pool } from "./db";

/**
 * Setup graceful shutdown handlers for the HTTP server
 * This ensures connections are closed properly when the app is terminated
 */
export function setupGracefulShutdown(httpServer: Server) {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    httpServer.close(async () => {
      console.log("HTTP server closed");
      
      try {
        // Close database connections
        await pool.end();
        console.log("Database connections closed");
        
        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error("Forceful shutdown after timeout");
      process.exit(1);
    }, 30000);
  };
  
  // Listen for termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  
  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    shutdown("UNCAUGHT_EXCEPTION");
  });
  
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutdown("UNHANDLED_REJECTION");
  });
}
