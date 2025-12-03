import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL!,
    // ✅ خليها true عشان ينشئ جدول sessions لو مش موجود
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: "auto",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
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
            return done(null, false, { message: "يرجى إعادة تعيين كلمة المرور" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "كلمة المرور غير صحيحة" });
          }

          return done(null, user);
        } catch (error) {
          console.error("LocalStrategy error:", error); // 👈 يساعد في الـ Logs
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google profile missing email"), false);
          }

          let user = await storage.getUserByEmail(email);

          if (user) {
            return done(null, user);
          } else {
            // User does not exist, create a new one
            const usersCount = await storage.getUsersCount();
            const newUser = await storage.createUser({
              email,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              role: usersCount === 0 ? "admin" : "viewer",
              // No password for OAuth users
            });
            return done(null, newUser);
          }
        } catch (error) {
          console.error("GoogleStrategy error:", error);
          return done(error);
        }
      }
    )
  );

  // نخزّن فقط id في الـ session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // نسترجع المستخدم الكامل من الـ DB
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const usersCount = await storage.getUsersCount();

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: usersCount === 0 ? "admin" : "viewer",
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login after register error:", err);
          return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "حدث خطأ في التسجيل" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login strategy error:", err); // 👈 يوضح السبب في الـ Logs
        return res.status(500).json({ message: "خطأ في الخادم" });
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "فشل تسجيل الدخول" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("Session save error:", err); // 👈 لو المشكلة من sessions
          return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      session: true,
    }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect("/"); // Client-side will handle redirect to /dashboard
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
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

        if (!password || password.length < 6) {
          return res
            .status(400)
            .json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
        }

        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await storage.updateUserPassword(id, hashedPassword);

        if (!updatedUser) {
          return res.status(500).json({ message: "فشل في تحديث كلمة المرور" });
        }

        console.log(
          `Admin ${(req.user as any)?.email} reset password for user ${user.email}`
        );

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "حدث خطأ في تحديث كلمة المرور" });
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

export const requireRole = (roles: string[]): RequestHandler => {
  return async (req, res, next) => {
    const user = req.user as any;
    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser || !roles.includes(dbUser.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};