import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { posts, reactions, comments } from '../../db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { createAuth } from '../../lib/auth';

// GET /api/notifications?since=<unix-seconds>
// Returns recent reactions + comments on the current user's posts.
export const GET: APIRoute = async ({ request }) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ items: [], unread: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const sinceParam = parseInt(url.searchParams.get('since') || '0', 10);
  const sinceDate = new Date((sinceParam || Math.floor(Date.now() / 1000) - 30 * 86400) * 1000);

  const db = getDb(env.DB);

  // Recent reactions on my posts
  const recentReactions = await db
    .select({
      id: reactions.id,
      type: reactions.type,
      createdAt: reactions.createdAt,
      postId: posts.id,
      postSlug: posts.slug,
      postTitle: posts.title,
    })
    .from(reactions)
    .innerJoin(posts, eq(reactions.postId, posts.id))
    .where(and(
      eq(posts.userId, userId),
      gte(reactions.createdAt, sinceDate),
    ))
    .orderBy(desc(reactions.createdAt))
    .limit(20);

  // Recent comments on my posts (excluding mine)
  const recentComments = await db
    .select({
      id: comments.id,
      body: comments.body,
      isAnonymous: comments.isAnonymous,
      authorName: comments.authorName,
      createdAt: comments.createdAt,
      commenterId: comments.userId,
      postId: posts.id,
      postSlug: posts.slug,
      postTitle: posts.title,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(and(
      eq(posts.userId, userId),
      gte(comments.createdAt, sinceDate),
      sql`${comments.userId} != ${userId}`,
    ))
    .orderBy(desc(comments.createdAt))
    .limit(20);

  type Item = {
    type: 'reaction' | 'comment';
    id: string;
    reactionType?: string;
    body?: string;
    actor?: string;
    postId: string;
    postSlug: string | null;
    postTitle: string;
    createdAt: number;
  };

  const items: Item[] = [];
  for (const r of recentReactions) {
    const ts = r.createdAt instanceof Date ? Math.floor(r.createdAt.getTime() / 1000) : Number(r.createdAt);
    items.push({
      type: 'reaction',
      id: r.id,
      reactionType: r.type,
      postId: r.postId,
      postSlug: r.postSlug,
      postTitle: r.postTitle,
      createdAt: ts,
    });
  }
  for (const c of recentComments) {
    const ts = c.createdAt instanceof Date ? Math.floor(c.createdAt.getTime() / 1000) : Number(c.createdAt);
    items.push({
      type: 'comment',
      id: c.id,
      body: c.body.slice(0, 100),
      actor: c.isAnonymous ? 'Anonymous' : (c.authorName || 'Anonymous'),
      postId: c.postId,
      postSlug: c.postSlug,
      postTitle: c.postTitle,
      createdAt: ts,
    });
  }

  items.sort((a, b) => b.createdAt - a.createdAt);

  // Unread = items newer than `since`
  const unread = sinceParam ? items.filter((i) => i.createdAt > sinceParam).length : items.length;

  return new Response(JSON.stringify({ items: items.slice(0, 30), unread }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
};
