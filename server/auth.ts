import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { userRoles, type UserRole } from "@shared/schema";
import { authRateLimiter, validatePasswordStrength, isValidEmail, sanitizeInput } from "./security";
import { env } from "./config";
import { logger } from "./logger";

const isUserRole = (role: unknown): role is UserRole =>
  typeof role === "string" && (userRoles as readonly string[]).includes(role);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    name: "sessionId",
    cookie: {
      httpOnly: true,
      secure: env.SESSION_COOKIE_SECURE,
      sameSite: "lax",
      maxAge: sessionTtl,
      domain: env.COOKIE_DOMAIN || undefined,
    },
    rolling: true,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // LocalStrategy لتسجيل الدخول بالبريد وكلمة المرور
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "البريد الإلكتروني غير مسجل" });
          }

          if (!user.password) {
            return done(null, false, { message: "الحساب لا يدعم تسجيل الدخول بكلمة مرور" });
          }

          // Add small delay to prevent timing attacks
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return done(null, false, { message: "كلمة المرور غير صحيحة" });
          }

          return done(null, user);
        } catch (error) {
          logger.error({ err: error }, "LocalStrategy error");
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      let { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبة" });
      }

      email = sanitizeInput(email.toLowerCase().trim());

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "صيغة البريد الإلكتروني غير صحيحة" });
      }

      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      firstName = firstName ? sanitizeInput(firstName) : null;
      lastName = lastName ? sanitizeInput(lastName) : null;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل مسبقاً" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const usersCount = await storage.getUsersCount();

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: usersCount === 0 ? "admin" : "viewer",
      });

      req.login(user, (err) => {
        if (err) {
          logger.error({ err }, "Login after register error");
          return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      logger.error({ err: error }, "Registration error");
      res.status(500).json({ message: "حدث خطأ غير متوقع أثناء التسجيل" });
    }
  });

  app.post("/api/auth/login", authRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        logger.error({ err }, "Login strategy error");
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "بيانات الدخول غير صحيحة" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          logger.error({ err: loginErr }, "Session save error");
          return res.status(500).json({ message: "حدث خطأ أثناء حفظ الجلسة" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.patch(
    "/api/users/:id/password",
    isAuthenticated,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { password } = req.body;

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
          return res.status(400).json({ message: passwordValidation.message });
        }

        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await storage.updateUserPassword(id, hashedPassword);

        if (!updatedUser) {
          return res.status(500).json({ message: "تعذر تحديث كلمة المرور" });
        }

        logger.info(
          { admin: (req.user as any)?.email, userEmail: user.email },
          "Admin reset password for user"
        );

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        logger.error({ err: error }, "Password reset error");
        res.status(500).json({ message: "حدث خطأ غير متوقع أثناء إعادة التعيين" });
      }
    }
  );
}

// middlewares
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (roles: UserRole[]): RequestHandler => {
  return async (req, res, next) => {
    const user = req.user as any;
    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await storage.getUser(user.id);
    const dbUserRole = isUserRole(dbUser?.role) ? dbUser.role : null;

    if (!dbUserRole || !roles.includes(dbUserRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
