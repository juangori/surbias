import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../db';
import { posts, tags, postTags } from '../../../db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRateLimit, getIpHash } from '../../../lib/rate-limit';
import { validatePost, isHoneypotFilled } from '../../../lib/moderation';
import { createAuth } from '../../../lib/auth';
import { generateSlug } from '../../../lib/slug';

const POSTS_PER_PAGE = 20;

export const GET: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const category = url.searchParams.get('category');
  const locale = url.searchParams.get('locale');
  const sort = url.searchParams.get('sort') || 'recent'; // 'recent' | 'hot' | 'popular'
  const query = url.searchParams.get('q');
  const offset = (page - 1) * POSTS_PER_PAGE;

  const conditions = [eq(posts.status, 'published')];
  if (category) conditions.push(eq(posts.category, category));
  if (locale) conditions.push(eq(posts.locale, locale));
  if (query && query.trim().length >= 2) {
    const searchTerm = `%${query.trim()}%`;
    conditions.push(sql`(${posts.title} LIKE ${searchTerm} OR ${posts.body} LIKE ${searchTerm})`);
  }

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
    const totalReactionsExpr = sql`(
      COALESCE(json_extract(${posts.reactionCounts}, '$.metoo'), 0) +
      COALESCE(json_extract(${posts.reactionCounts}, '$.hug'), 0) +
      COALESCE(json_extract(${posts.reactionCounts}, '$.strength'), 0) +
      COALESCE(json_extract(${posts.reactionCounts}, '$.respect'), 0) +
      COALESCE(json_extract(${posts.reactionCounts}, '$.solidarity'), 0)
    )`;

    results = await db
      .select()
      .from(posts)
      .where(where)
      .orderBy(sql`${totalReactionsExpr} DESC`, desc(posts.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset(offset);
  } else {
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

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    const reqLocale = new URL(request.url).searchParams.get('locale') || 'en';
    const prefix = reqLocale === 'en' ? '' : `/${reqLocale}`;
    return redirect(`${prefix}/login`, 302);
  }

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
  const slug = generateSlug(title);
  await db.insert(posts).values({
    id,
    userId: session.user.id,
    slug,
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

  // Extract hashtags from body
  const hashtagPattern = /#(\w{2,30})/g;
  const tagMatches = body.match(hashtagPattern);
  if (tagMatches) {
    const uniqueTags = [...new Set(tagMatches.map(t => t.slice(1).toLowerCase()))].slice(0, 5);
    for (const tagName of uniqueTags) {
      const existing = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
      let tagId: string;
      if (existing[0]) {
        tagId = existing[0].id;
        await db.update(tags).set({ count: sql`${tags.count} + 1` }).where(eq(tags.id, tagId));
      } else {
        tagId = nanoid(12);
        await db.insert(tags).values({ id: tagId, name: tagName, count: 1 });
      }
      await db.insert(postTags).values({ id: nanoid(12), postId: id, tagId }).catch(() => {});
    }
  }

  const postPath = slug ? `${slug}-${id}` : id;
  return redirect(`${localePrefix}/post/${postPath}`, 302);
};
