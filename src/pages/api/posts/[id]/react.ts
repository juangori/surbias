import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { reactions, posts, REACTION_TYPES } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getIpHash } from '../../../../lib/rate-limit';

export const POST: APIRoute = async ({ params, request }) => {
  const db = getDb(env.DB);
  const postId = params.id;

  if (!postId) {
    return new Response(JSON.stringify({ error: 'Missing post ID' }), { status: 400 });
  }

  const body = await request.json() as { type: string };
  const type = body.type;

  if (!REACTION_TYPES.includes(type as any)) {
    return new Response(JSON.stringify({ error: 'Invalid reaction type' }), { status: 400 });
  }

  const sessionHash = getIpHash(request);

  try {
    // Try to insert reaction (will fail on duplicate due to unique index)
    await db.insert(reactions).values({
      id: nanoid(12),
      postId,
      sessionHash,
      type,
      createdAt: new Date(),
    });

    // Update reaction counts on the post
    const allReactions = await db
      .select({ type: reactions.type })
      .from(reactions)
      .where(eq(reactions.postId, postId));

    const counts: Record<string, number> = {};
    for (const r of allReactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    await db
      .update(posts)
      .set({ reactionCounts: JSON.stringify(counts) })
      .where(eq(posts.id, postId));

    return new Response(JSON.stringify({ reactionCounts: counts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Duplicate reaction - return current counts
    const post = await db.select({ reactionCounts: posts.reactionCounts }).from(posts).where(eq(posts.id, postId));
    const counts = JSON.parse(post[0]?.reactionCounts || '{}');
    return new Response(JSON.stringify({ reactionCounts: counts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
