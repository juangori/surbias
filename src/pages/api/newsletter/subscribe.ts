import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../db';
import { newsletterSubscribers } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { email?: string; locale?: string };
  const email = body?.email?.trim().toLowerCase();
  const locale = body?.locale || 'en';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Valid email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb(env.DB);

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    // Re-subscribe if previously unsubscribed
    if (existing[0].unsubscribedAt) {
      await db
        .update(newsletterSubscribers)
        .set({ unsubscribedAt: null, locale })
        .where(eq(newsletterSubscribers.email, email));
      return new Response(JSON.stringify({ subscribed: true, resubscribed: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ subscribed: true, already: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.insert(newsletterSubscribers).values({
    id: nanoid(12),
    email,
    locale,
    subscribedAt: new Date(),
  });

  return new Response(JSON.stringify({ subscribed: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
