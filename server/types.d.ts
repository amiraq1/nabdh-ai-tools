import type { User as DbUser } from "@shared/schema";

declare module "passport-microsoft";

declare global {
  namespace Express {
    interface User extends Omit<DbUser, "password"> {
      password?: DbUser["password"];
    }
  }
}

export {};
