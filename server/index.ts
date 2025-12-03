import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupGracefulShutdown } from "./graceful-shutdown";
import { setupSecurityHeaders, generalRateLimiter } from "./security";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security headers (must be first)
setupSecurityHeaders(app);

// Rate limiting for all requests
app.use(generalRateLimiter);

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
    limit: '10mb', // Limit JSON payload size
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log the error for debugging (server-side only)
    console.error("[ERROR]", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      status,
      timestamp: new Date().toISOString(),
    });
    
    // Don't expose internal error details to clients
    const message = status === 500 
      ? "حدث خطأ في الخادم. يرجى المحاولة لاحقاً."
      : err.message || "حدث خطأ";
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Railway uses port 8080 by default, Replit uses 5000
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "8080", 10);
  // On Windows, use localhost instead of 0.0.0.0 to avoid ENOTSUP error
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
  const listenOptions = process.platform === "win32" 
    ? { port, host }
    : { port, host, reusePort: true };
  
  httpServer.listen(
    listenOptions,
    () => {
      log(`serving on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`Health check available at: http://${host}:${port}/health`);
    },
  );
  
  // Setup graceful shutdown handlers
  setupGracefulShutdown(httpServer);
})();
