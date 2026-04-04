import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const body = await request.json() as { postId: string; action: string };
  const { postId, action } = body;

  if (action === 'restore') {
    await db.update(posts).set({ status: 'published', flagCount: 0 }).where(eq(posts.id, postId));
  } else if (action === 'delete') {
    await db.delete(posts).where(eq(posts.id, postId));
  } else {
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
