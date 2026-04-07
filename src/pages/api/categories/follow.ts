import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../db';
import { categoryFollows } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createAuth } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as { category?: string };
  const category = body?.category;

  if (!category) {
    return new Response(JSON.stringify({ error: 'category required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb(env.DB);
  const userId = session.user.id;

  const existing = await db
    .select()
    .from(categoryFollows)
    .where(and(eq(categoryFollows.userId, userId), eq(categoryFollows.category, category)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(categoryFollows).where(
      and(eq(categoryFollows.userId, userId), eq(categoryFollows.category, category))
    );
    return new Response(JSON.stringify({ following: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    await db.insert(categoryFollows).values({
      id: nanoid(12),
      userId,
      category,
      createdAt: new Date(),
    });
    return new Response(JSON.stringify({ following: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
