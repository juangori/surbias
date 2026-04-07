import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, params.id!)).limit(1);
  if (!post[0]) return new Response('Not found', { status: 404 });

  const p = post[0];
  const html = `<!DOCTYPE html>
<html><head><style>
  body{margin:0;font-family:'Outfit',sans-serif;padding:16px;max-width:600px;}
  .card{border:1px solid #d4e3d9;border-radius:10px;padding:16px;background:#fff;}
  .cat{font-size:12px;color:#556b5c;background:#f0f5f1;padding:2px 8px;border-radius:99px;display:inline-block;margin-bottom:8px;}
  h2{margin:0 0 8px;font-size:18px;color:#161e18;}
  p{margin:0 0 12px;color:#556b5c;font-size:14px;line-height:1.6;}
  a{color:#4a7c59;font-size:13px;text-decoration:none;font-weight:500;}
</style></head><body>
<div class="card">
  <span class="cat">${p.category}</span>
  <h2>${p.title.replace(/</g, '&lt;')}</h2>
  <p>${p.body.slice(0, 200).replace(/</g, '&lt;')}...</p>
  <a href="https://surbias.com/post/${p.id}" target="_blank">Read on Surbias →</a>
</div>
</body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'ALLOWALL',
    },
  });
};
