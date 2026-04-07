import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../../db';
import { posts } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuth } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request }) => {
  const db = getDb(env.DB);
  const postId = params.id!;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Only allow owner to delete their own post
  const post = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.userId, session.user.id))).limit(1);
  if (!post[0]) {
    return new Response(JSON.stringify({ error: 'Not found or not owner' }), { status: 404 });
  }

  await db.update(posts).set({ status: 'deleted', deletedAt: new Date() }).where(eq(posts.id, postId));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
