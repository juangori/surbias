import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { bookmarks } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuth } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, params }) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const postId = params.id;
  if (!postId) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb(env.DB);
  const userId = session.user.id;

  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
    return new Response(JSON.stringify({ bookmarked: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    await db.insert(bookmarks).values({
      id: nanoid(12),
      userId,
      postId,
      createdAt: new Date(),
    });
    return new Response(JSON.stringify({ bookmarked: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
