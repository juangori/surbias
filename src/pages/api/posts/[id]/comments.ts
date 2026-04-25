import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { nanoid } from 'nanoid';
import { getDb } from '../../../../db';
import { comments, posts, users, notificationPrefs } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getIpHash, checkRateLimit } from '../../../../lib/rate-limit';
import { validateComment } from '../../../../lib/moderation';
import { createAuth } from '../../../../lib/auth';
import { sendEmail, commentNotificationEmail } from '../../../../lib/email';

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const postId = params.id!;

  const results = await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return new Response(JSON.stringify({ comments: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const db = getDb(env.DB);
  const postId = params.id!;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const post = await db.select({ id: posts.id, userId: posts.userId, title: posts.title, slug: posts.slug })
    .from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
  }

  const body = await request.json() as { body: string; isAnonymous?: boolean };

  const validation = validateComment(body.body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
  }

  const ipHash = getIpHash(request);
  const rateLimit = await checkRateLimit(env.DB, ipHash, 'comment', 10);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
  }

  const isAnonymous = body.isAnonymous !== false;
  const id = nanoid(12);
  await db.insert(comments).values({
    id,
    postId,
    userId: session.user.id,
    body: body.body.trim(),
    authorName: isAnonymous ? null : (session.user.name || null),
    isAnonymous,
    createdAt: new Date(),
  });

  if (env.RESEND_API_KEY && post[0].userId && post[0].userId !== session.user.id) {
    try {
      const prefs = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, post[0].userId)).limit(1);
      const wantsNotif = !prefs[0] || prefs[0].onComment;
      if (wantsNotif) {
        const author = await db.select({ email: users.email }).from(users).where(eq(users.id, post[0].userId)).limit(1);
        if (author[0]) {
          const postPath = post[0].slug ? `/post/${post[0].slug}-${post[0].id}` : `/post/${post[0].id}`;
          const postUrl = `${env.BETTER_AUTH_URL || 'https://surbias.com'}${postPath}`;
          const preview = body.body.trim().slice(0, 100);
          const email = commentNotificationEmail(post[0].title, preview, postUrl);
          const from = env.FROM_EMAIL || 'Surbias <noreply@surbias.com>';
          sendEmail(env.RESEND_API_KEY, from, { to: author[0].email, ...email }).catch(() => {});
        }
      }
    } catch (_) {}
  }

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
