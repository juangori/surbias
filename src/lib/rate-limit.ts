interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

// Simple rate limiting using D1 raw queries
export async function checkRateLimit(
  db: any,
  ipHash: string,
  action: string,
  maxPerHour: number
): Promise<RateLimitResult> {
  const oneHourAgo = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);

  // Clean old entries
  await db.prepare('DELETE FROM rate_limits WHERE created_at < ?').bind(oneHourAgo).run();

  // Count recent actions
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM rate_limits WHERE ip_hash = ? AND action = ?'
  ).bind(ipHash, action).first() as { count: number } | null;

  const count = result?.count ?? 0;
  const allowed = count < maxPerHour;

  if (allowed) {
    await db.prepare(
      'INSERT INTO rate_limits (ip_hash, action, created_at) VALUES (?, ?, ?)'
    ).bind(ipHash, action, Math.floor(Date.now() / 1000)).run();
  }

  return { allowed, remaining: Math.max(0, maxPerHour - count - (allowed ? 1 : 0)) };
}

export function getIpHash(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const str = `${ip}:${ua}:${day}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
