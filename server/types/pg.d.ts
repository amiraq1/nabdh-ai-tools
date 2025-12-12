// server/types.d.ts
export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string | null;
      role?: string;
    }
  }
}
