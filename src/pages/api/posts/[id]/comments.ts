import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { comments, posts } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getIpHash, checkRateLimit } from '../../../../lib/rate-limit';
import { validateComment } from '../../../../lib/moderation';
import { createAuth } from '../../../../lib/auth';

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const postId = params.id!;

  const results = await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return new Response(JSON.stringify({ comments: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const db = getDb(env.DB);
  const postId = params.id!;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
  }

  const body = await request.json() as { body: string; isAnonymous?: boolean };

  const validation = validateComment(body.body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
  }

  const ipHash = getIpHash(request);
  const rateLimit = await checkRateLimit(env.DB, ipHash, 'comment', 10);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
  }

  const isAnonymous = body.isAnonymous !== false;
  const id = nanoid(12);
  await db.insert(comments).values({
    id,
    postId,
    userId: session.user.id,
    body: body.body.trim(),
    authorName: isAnonymous ? null : (session.user.name || null),
    isAnonymous,
    createdAt: new Date(),
  });

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
