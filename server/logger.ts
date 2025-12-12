import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./config";

export const logger = pino({
  level: env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true },
        },
});

export const httpLogger = pinoHttp({
  logger,
  redact: ["req.headers.authorization", "req.headers.cookie"],
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/api/health",
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
