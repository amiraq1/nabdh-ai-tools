export type UserLike = { password?: unknown } & Record<string, unknown>;

export const sanitizeUser = <T extends UserLike | null | undefined>(user: T) => {
  if (!user) return user;
  const { password: _pw, ...safe } = user as UserLike;
  return safe as Omit<T, "password">;
};

export const sanitizeUsers = <T extends UserLike>(users: T[]) => users.map((u) => sanitizeUser(u));
