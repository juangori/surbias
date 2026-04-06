import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts, users, flags } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const body = await request.json() as { postId?: string; userId?: string; action: string };
  const { postId, userId, action } = body;

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

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin moderate error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
