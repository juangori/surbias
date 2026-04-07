import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { users, posts } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = getDb(env.DB);
  const userId = session.user.id;

  // Anonymize user's posts (set userId to null)
  await db.update(posts).set({ userId: null, isAnonymous: true }).where(eq(posts.userId, userId));

  // Delete user (cascades sessions, accounts)
  await db.delete(users).where(eq(users.id, userId));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
