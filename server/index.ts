import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupGracefulShutdown } from "./graceful-shutdown";
import { setupSecurityHeaders, generalRateLimiter } from "./security";
import { env } from "./config";
import { httpLogger, logger } from "./logger";

const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security headers (must be first)
setupSecurityHeaders(app);

// Rate limiting for all requests
app.use(generalRateLimiter);

// Structured request logging
app.use(httpLogger);

// Compression middleware - compress all responses
app.use(compression({
  level: 6, // Compression level (1-9, 6 is a good balance)
  filter: (req: express.Request, res: express.Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all text-based responses
    return compression.filter(req, res);
  }
}));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "10mb", // Limit JSON payload size
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log the error for debugging (server-side only)
    logger.error(
      {
        err,
        status,
        stack: env.NODE_ENV === "development" ? err.stack : undefined,
      },
      "Unhandled error"
    );
    
    // Don't expose internal error details to clients
    const message = status === 500 
      ? "حدث خطأ في الخادم. يرجى المحاولة لاحقاً."
      : err.message || "حدث خطأ";
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Railway uses port 8080 by default, Replit uses 5000
  // this serves both the API and the client.
  const port = env.PORT;
  // On Windows, use localhost instead of 0.0.0.0 to avoid ENOTSUP error
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
  const listenOptions = process.platform === "win32" 
    ? { port, host }
    : { port, host, reusePort: true };
  
  httpServer.listen(
    listenOptions,
    () => {
      logger.info(`serving on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check available at: http://${host}:${port}/health`);
    },
  );
  
  // Setup graceful shutdown handlers
  setupGracefulShutdown(httpServer);
})();
