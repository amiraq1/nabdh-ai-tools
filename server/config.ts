import { z } from "zod";

const toBoolean = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return undefined;
};

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  COOKIE_DOMAIN: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  SESSION_COOKIE_SECURE: z
    .any()
    .optional()
    .transform(toBoolean)
    .pipe(z.boolean().optional()),
  DB_SSL_REQUIRED: z
    .any()
    .optional()
    .transform(toBoolean)
    .pipe(z.boolean().optional()),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_CALLBACK_URL: z.string().optional(),
  // Google Drive backup options
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(), // JSON string of service account
  GOOGLE_DRIVE_REFRESH_TOKEN: z.string().optional(), // OAuth2 refresh token
  // Replit environment
  ISSUER_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
  REPL_IDENTITY: z.string().optional(),
  WEB_REPL_RENEWAL: z.string().optional(),
  REPLIT_CONNECTORS_HOSTNAME: z.string().optional(),
});

const rawEnv = EnvSchema.parse(process.env);

export const env = {
  ...rawEnv,
  SESSION_COOKIE_SECURE:
    rawEnv.SESSION_COOKIE_SECURE ?? rawEnv.NODE_ENV === "production",
  DB_SSL_REQUIRED: rawEnv.DB_SSL_REQUIRED ?? rawEnv.NODE_ENV === "production",
};
