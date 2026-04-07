import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../db';
import { posts } from '../../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRateLimit, getIpHash } from '../../../lib/rate-limit';
import { validatePost, isHoneypotFilled } from '../../../lib/moderation';

const POSTS_PER_PAGE = 20;
// Fetch extra rows for JS-side sorting (hot/popular) so we have enough after sort
const SORT_FETCH_MULTIPLIER = 5;

function totalReactions(reactionCounts: string): number {
  try {
    const obj = JSON.parse(reactionCounts || '{}') as Record<string, number>;
    return Object.values(obj).reduce((sum, v) => sum + (v || 0), 0);
  } catch (err) {
    console.error('Failed to parse reactionCounts:', err);
    return 0;
  }
}

export const GET: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const category = url.searchParams.get('category');
  const locale = url.searchParams.get('locale');
  const sort = url.searchParams.get('sort') || 'recent'; // 'recent' | 'hot' | 'popular'
  const offset = (page - 1) * POSTS_PER_PAGE;

  const conditions = [eq(posts.status, 'published')];
  if (category) conditions.push(eq(posts.category, category));
  if (locale) conditions.push(eq(posts.locale, locale));

  // For 'hot', restrict to last 7 days
  if (sort === 'hot') {
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    conditions.push(sql`${posts.createdAt} >= ${sevenDaysAgo}`);
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(where);

  const total = countResult[0]?.count || 0;

  let results;

  if (sort === 'hot' || sort === 'popular') {
    // Fetch a larger batch and sort in JS by total reactions
    const fetchLimit = POSTS_PER_PAGE * SORT_FETCH_MULTIPLIER;
    const allRows = await db
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(fetchLimit);

    allRows.sort((a, b) => totalReactions(b.reactionCounts) - totalReactions(a.reactionCounts));
    results = allRows.slice(offset, offset + POSTS_PER_PAGE);
  } else {
    // Default: recent — order by createdAt DESC
    results = await db
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset(offset);
  }

  return new Response(JSON.stringify({
    posts: results,
    page,
    totalPages: Math.ceil(total / POSTS_PER_PAGE),
    total,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, redirect }) => {
  const db = getDb(env.DB);

  const formData = await request.formData();
  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();
  const category = formData.get('category') as string;
  const locale = (formData.get('locale') as string) || 'en';
  const isAnonymous = formData.get('is_anonymous') === 'on';
  const honeypot = formData.get('website') as string;
  const turnstileToken = formData.get('cf-turnstile-response') as string;

  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  if (isHoneypotFilled(honeypot)) {
    return redirect(`${localePrefix}/post/new?error=generic`, 302);
  }

  if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY);
    if (!valid) {
      return redirect(`${localePrefix}/post/new?error=turnstile_failed`, 302);
    }
  }

  const validation = validatePost(title, body);
  if (!validation.valid) {
    return redirect(`${localePrefix}/post/new?error=${validation.error}`, 302);
  }

  const ipHash = getIpHash(request);
  const rateLimit = await checkRateLimit(env.DB, ipHash, 'post', 3);
  if (!rateLimit.allowed) {
    return redirect(`${localePrefix}/post/new?error=rate_limited`, 302);
  }

  const id = nanoid(12);
  await db.insert(posts).values({
    id,
    title,
    body,
    category,
    locale,
    isAnonymous,
    status: 'published',
    flagCount: 0,
    reactionCounts: '{}',
    createdAt: new Date(),
  });

  return redirect(`${localePrefix}/post/${id}`, 302);
};
