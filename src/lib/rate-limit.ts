interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  db: any,
  ipHash: string,
  action: string,
  maxPerHour: number
): Promise<RateLimitResult> {
  const oneHourAgo = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);

  await db.prepare('DELETE FROM rate_limits WHERE created_at < ?').bind(oneHourAgo).run();

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
  const str = `${ip}:${ua}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x811c9dc5);
  }
  return ((h1 >>> 0) * 0x100000000 + (h2 >>> 0)).toString(36);
}
