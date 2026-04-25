import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json() as { name?: string };
  const name = body.name?.trim();

  if (!name || name.length < 2 || name.length > 30) {
    return new Response(JSON.stringify({ error: 'Name must be 2-30 characters' }), { status: 400 });
  }

  const db = getDb(env.DB);
  await db.update(users)
    .set({ name, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return new Response(JSON.stringify({ success: true, name }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
