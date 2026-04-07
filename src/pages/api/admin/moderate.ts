import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts, users, flags, comments, auditLogs } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';
import { nanoid } from 'nanoid';
import { getIpHash, checkRateLimit } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  // Role-based admin check
  const [userRecord] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRecord || userRecord.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  // Rate limit admin moderation actions (30 per hour per IP)
  const ipHash = getIpHash(request);
  const rateLimit = await checkRateLimit(env.DB, ipHash, 'admin_moderate', 30);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
  }

  const body = await request.json() as { postId?: string; userId?: string; commentId?: string; action: string };
  const { postId, userId, commentId, action } = body;

  try {
    if (action === 'restore' || action === 'restore_post') {
      if (!postId) return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 });
      await db.update(posts).set({ status: 'published', flagCount: 0 }).where(eq(posts.id, postId));

    } else if (action === 'delete' || action === 'delete_post') {
      if (!postId) return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 });
      await db.update(posts)
        .set({ status: 'deleted', deletedAt: new Date() })
        .where(eq(posts.id, postId));

    } else if (action === 'dismiss_flags') {
      if (!postId) return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 });
      await db.delete(flags).where(eq(flags.targetId, postId));
      await db.update(posts).set({ status: 'published', flagCount: 0 }).where(eq(posts.id, postId));

    } else if (action === 'ban_user') {
      if (!userId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
      await db.update(users).set({ banned: true }).where(eq(users.id, userId));

    } else if (action === 'unban_user') {
      if (!userId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
      await db.update(users).set({ banned: false }).where(eq(users.id, userId));

    } else if (action === 'delete_comment') {
      if (!commentId) return new Response(JSON.stringify({ error: 'Missing commentId' }), { status: 400 });
      await db.delete(comments).where(eq(comments.id, commentId));

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    // Audit log
    const targetId = commentId ?? postId ?? userId ?? '';
    const targetType = action.includes('user') ? 'user' : action.includes('comment') ? 'comment' : 'post';
    await db.insert(auditLogs).values({
      id: nanoid(12),
      actorId: session.user.id,
      actorEmail: session.user.email,
      action,
      targetType,
      targetId,
      details: JSON.stringify({ action, postId, userId, commentId }),
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin moderate error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
