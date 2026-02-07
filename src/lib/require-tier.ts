const TIER_HIERARCHY: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  ADMIN: 2,
};

export function requireTier(
  userTier: string,
  minimumTier: "FREE" | "PRO" | "ADMIN"
): boolean {
  const userLevel = TIER_HIERARCHY[userTier] ?? -1;
  const minimumLevel = TIER_HIERARCHY[minimumTier] ?? 0;

  return userLevel >= minimumLevel;
}
