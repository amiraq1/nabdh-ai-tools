import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  COOKIE_DOMAIN: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  DB_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === "false") return false;
      if (val === "true") return true;
      return undefined;
    }),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_CALLBACK_URL: z.string().optional(),
  ISSUER_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
  REPL_IDENTITY: z.string().optional(),
  WEB_REPL_RENEWAL: z.string().optional(),
  REPLIT_CONNECTORS_HOSTNAME: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
