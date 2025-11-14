const buckets: Record<string, number[]> = {};

export const rateLimit = (
  key: string,
  limit: number,
  intervalMs: number,
): { allowed: boolean; retryAfter: number } => {
  const now = Date.now();
  const entries = buckets[key] ?? [];
  const fresh = entries.filter((timestamp) => now - timestamp < intervalMs);

  if (fresh.length >= limit) {
    const retryAfter = intervalMs - (now - fresh[0]);
    buckets[key] = fresh;
    return { allowed: false, retryAfter };
  }

  fresh.push(now);
  buckets[key] = fresh;
  return { allowed: true, retryAfter: 0 };
};

