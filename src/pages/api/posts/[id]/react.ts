import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { reactions, posts, users, notificationPrefs, REACTION_TYPES } from '../../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getIpHash } from '../../../../lib/rate-limit';
import { sendEmail, reactionNotificationEmail } from '../../../../lib/email';

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
    await db.insert(reactions).values({
      id: nanoid(12),
      postId,
      sessionHash,
      type,
      createdAt: new Date(),
    });

    const countRows = await db
      .select({ type: reactions.type, count: sql<number>`count(*)` })
      .from(reactions)
      .where(eq(reactions.postId, postId))
      .groupBy(reactions.type);

    const counts: Record<string, number> = {};
    for (const row of countRows) {
      counts[row.type] = row.count;
    }

    await db
      .update(posts)
      .set({ reactionCounts: JSON.stringify(counts) })
      .where(eq(posts.id, postId));

    if (env.RESEND_API_KEY) {
      try {
        const post = await db.select({ userId: posts.userId, title: posts.title, slug: posts.slug, id: posts.id })
          .from(posts).where(eq(posts.id, postId)).limit(1);
        if (post[0]?.userId) {
          const prefs = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, post[0].userId)).limit(1);
          const wantsNotif = !prefs[0] || prefs[0].onReaction;
          if (wantsNotif) {
            const author = await db.select({ email: users.email }).from(users).where(eq(users.id, post[0].userId)).limit(1);
            if (author[0]) {
              const postPath = post[0].slug ? `/post/${post[0].slug}-${post[0].id}` : `/post/${post[0].id}`;
              const postUrl = `${env.BETTER_AUTH_URL || 'https://surbias.com'}${postPath}`;
              const email = reactionNotificationEmail(post[0].title, type, postUrl);
              const from = env.FROM_EMAIL || 'Surbias <noreply@surbias.com>';
              sendEmail(env.RESEND_API_KEY, from, { to: author[0].email, ...email }).catch(() => {});
            }
          }
        }
      } catch (_) {}
    }

    return new Response(JSON.stringify({ reactionCounts: counts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reaction upsert failed:', err);
    const post = await db.select({ reactionCounts: posts.reactionCounts }).from(posts).where(eq(posts.id, postId));
    const counts = JSON.parse(post[0]?.reactionCounts || '{}');
    return new Response(JSON.stringify({ reactionCounts: counts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
