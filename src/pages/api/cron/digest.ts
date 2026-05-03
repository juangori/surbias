/**
 * Weekly digest job. Trigger via:
 *   - Cloudflare Cron Trigger:  fire a fetch to /api/cron/digest with header `x-cron-secret: <CRON_SECRET>`
 *   - Or invoke manually:       curl -H "x-cron-secret: ..." https://surbias.com/api/cron/digest
 *
 * Sends each subscriber the top 5 stories of the last 7 days, in their preferred locale.
 * Idempotent-ish: respects user notification prefs and skips if no stories.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts, newsletterSubscribers } from '../../../db/schema';
import { and, eq, sql, isNull, desc } from 'drizzle-orm';
import { sendEmail, emailEnabled, weeklyDigestEmail } from '../../../lib/email';
import { postWithAuthor } from '../../../lib/post-query';

export const POST: APIRoute = async ({ request }) => handle(request);
export const GET: APIRoute = async ({ request }) => handle(request);

async function handle(request: Request): Promise<Response> {
  // Auth
  const secret = env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
    if (provided !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  } else {
    // No secret configured: refuse in production for safety
    return new Response(JSON.stringify({ error: 'CRON_SECRET not configured' }), { status: 503 });
  }

  if (!emailEnabled(env)) {
    return new Response(JSON.stringify({ error: 'No email provider configured', skipped: true }), { status: 200 });
  }

  const db = getDb(env.DB);
  const sevenDaysAgoSec = Math.floor((Date.now() - 7 * 86400 * 1000) / 1000);

  // Active subscribers
  const subs = await db
    .select({ email: newsletterSubscribers.email, locale: newsletterSubscribers.locale })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));

  if (subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no subscribers' }), { status: 200 });
  }

  const totalReactionsExpr = sql`(
    COALESCE(json_extract(${posts.reactionCounts}, '$.metoo'), 0) +
    COALESCE(json_extract(${posts.reactionCounts}, '$.hug'), 0) +
    COALESCE(json_extract(${posts.reactionCounts}, '$.strength'), 0) +
    COALESCE(json_extract(${posts.reactionCounts}, '$.respect'), 0) +
    COALESCE(json_extract(${posts.reactionCounts}, '$.solidarity'), 0)
  )`;

  // Group subscribers by locale to query top stories once per locale
  const byLocale = new Map<string, string[]>();
  for (const s of subs) {
    const list = byLocale.get(s.locale) || [];
    list.push(s.email);
    byLocale.set(s.locale, list);
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [locale, emails] of byLocale) {
    const top = await db
      .select(postWithAuthor)
      .from(posts)
      .where(and(
        eq(posts.status, 'published'),
        eq(posts.locale, locale),
        sql`${posts.createdAt} >= ${sevenDaysAgoSec}`,
      ))
      .orderBy(sql`${totalReactionsExpr} DESC`, desc(posts.createdAt))
      .limit(5);

    if (top.length === 0) { skipped += emails.length; continue; }

    const stories = top.map((p) => {
      const path = p.slug ? `/post/${p.slug}-${p.id}` : `/post/${p.id}`;
      const localePrefix = locale === 'en' ? '' : `/${locale}`;
      const counts = JSON.parse(p.reactionCounts || '{}') as Record<string, number>;
      const reactions = Object.values(counts).reduce((a, b) => a + b, 0);
      return {
        title: p.title,
        url: `https://surbias.com${localePrefix}${path}`,
        reactions,
        preview: p.body.slice(0, 140) + (p.body.length > 140 ? '…' : ''),
      };
    });

    const tpl = weeklyDigestEmail(stories);

    for (const email of emails) {
      const ok = await sendEmail(env, { to: email, subject: tpl.subject, html: tpl.html });
      if (ok) sent++;
      else errors.push(email);
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, skipped, errors: errors.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
