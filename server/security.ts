// Security middleware and utilities
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Express } from "express";

// Security headers using Helmet
export function setupSecurityHeaders(app: Express) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"], // Allow images from any HTTPS source
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for compatibility
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );
}

// Rate limiting for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general requests
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  }

  if (!/[a-z]/.test(password) && !/[A-Z]/.test(password) && !/[أ-ي]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على حروف" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل" };
  }

  // Check for common weak passwords
  const commonPasswords = ["password", "12345678", "qwerty", "admin", "letmein"];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, message: "كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى" };
  }

  return { valid: true };
}

// Sanitize user input (basic XSS protection)
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim()
    .slice(0, 10000); // Limit length
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
}

