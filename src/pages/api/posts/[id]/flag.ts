import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { flags, posts } from '../../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getIpHash } from '../../../../lib/rate-limit';

const VALID_REASONS = ['spam', 'offensive', 'harmful', 'other'];
const AUTO_HIDE_THRESHOLD = 5;

export const POST: APIRoute = async ({ params, request }) => {
  const db = getDb(env.DB);
  const postId = params.id;

  if (!postId) {
    return new Response(JSON.stringify({ error: 'Missing post ID' }), { status: 400 });
  }

  const body = await request.json() as { reason: string };
  const reason = body.reason;

  if (!VALID_REASONS.includes(reason)) {
    return new Response(JSON.stringify({ error: 'Invalid reason' }), { status: 400 });
  }

  const reporterHash = getIpHash(request);

  try {
    // Insert flag (unique constraint prevents duplicates)
    await db.insert(flags).values({
      id: nanoid(12),
      targetType: 'post',
      targetId: postId,
      reason,
      reporterHash,
      createdAt: new Date(),
    });

    // Increment flag count on the post
    await db
      .update(posts)
      .set({ flagCount: sql`${posts.flagCount} + 1` })
      .where(eq(posts.id, postId));

    // Check if we need to auto-hide
    const post = await db.select({ flagCount: posts.flagCount }).from(posts).where(eq(posts.id, postId));
    if (post[0] && post[0].flagCount >= AUTO_HIDE_THRESHOLD) {
      await db
        .update(posts)
        .set({ status: 'flagged' })
        .where(eq(posts.id, postId));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Already flagged by this user (unique constraint violation) or other error
    console.error('Flag insert failed:', err);
    return new Response(JSON.stringify({ error: 'Already reported' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
