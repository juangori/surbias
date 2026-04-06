import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { comments } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getIpHash, checkRateLimit } from '../../../../lib/rate-limit';

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

  const body = await request.json() as { body: string; authorName?: string; isAnonymous?: boolean };

  if (!body.body || body.body.trim().length < 2 || body.body.length > 2000) {
    return new Response(JSON.stringify({ error: 'Invalid comment' }), { status: 400 });
  }

  const ipHash = getIpHash(request);
  const rateLimit = await checkRateLimit(env.DB, ipHash, 'comment', 10);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
  }

  const id = nanoid(12);
  await db.insert(comments).values({
    id,
    postId,
    body: body.body.trim(),
    authorName: body.isAnonymous ? null : (body.authorName || null),
    isAnonymous: body.isAnonymous !== false,
    createdAt: new Date(),
  });

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
