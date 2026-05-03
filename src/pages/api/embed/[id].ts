import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const result = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      body: posts.body,
      category: posts.category,
      isAnonymous: posts.isAnonymous,
      createdAt: posts.createdAt,
      reactionCounts: posts.reactionCounts,
      locale: posts.locale,
      userName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, params.id!))
    .limit(1);

  const p = result[0];
  if (!p) return new Response('Not found', { status: 404 });

  const author = p.isAnonymous ? 'Anonymous' : (p.userName || 'Anonymous');
  const counts = JSON.parse(p.reactionCounts || '{}') as Record<string, number>;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const created = p.createdAt instanceof Date ? p.createdAt : new Date(Number(p.createdAt) * 1000);
  const dateStr = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const localePrefix = p.locale && p.locale !== 'en' ? `/${p.locale}` : '';
  const slugPath = p.slug ? `/post/${p.slug}-${p.id}` : `/post/${p.id}`;
  const fullUrl = `https://surbias.com${localePrefix}${slugPath}`;
  const preview = (p.body.length > 240 ? p.body.slice(0, 240) + '…' : p.body);

  const html = `<!DOCTYPE html>
<html lang="${escHtml(p.locale || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base target="_parent">
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:transparent;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;padding:8px;color:#161e18;line-height:1.55}
  .card{
    position:relative;
    border:1.5px solid #d4e3d9;
    border-radius:14px;
    padding:18px 20px 16px;
    background:#fff;
    box-shadow:0 1px 3px rgba(22,30,24,.06),0 1px 2px rgba(22,30,24,.04);
    overflow:hidden;
    transition:box-shadow .2s, border-color .2s;
  }
  .card:hover{box-shadow:0 4px 14px rgba(22,30,24,.10);border-color:#8fb89a}
  .card::before{
    content:'';position:absolute;top:0;left:0;width:4px;height:100%;
    background:linear-gradient(180deg,#4a7c59,#8fb89a);
    border-radius:14px 0 0 14px;opacity:.55;
  }
  .meta{font-size:12px;color:#556b5c;display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
  .cat{
    background:#f0f5f1;color:#4a7c59;border:1px solid rgba(143,184,154,.28);
    padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;text-transform:capitalize;
  }
  .sep{color:#d4e3d9}
  h2{
    margin:0 0 8px;font-size:16px;font-weight:700;line-height:1.35;color:#161e18;letter-spacing:-.01em;
  }
  p{margin:0 0 14px;color:#556b5c;font-size:13.5px;}
  .footer{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;}
  .reactions{color:#4a7c59;font-weight:600;}
  .read-link{
    color:#4a7c59;text-decoration:none;font-weight:700;font-size:12px;
    display:inline-flex;align-items:center;gap:4px;
  }
  .read-link:hover{text-decoration:underline}
  .brand{color:#8aaa92;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase}
</style>
</head>
<body>
  <a class="card" href="${escHtml(fullUrl)}" style="display:block;text-decoration:none;color:inherit">
    <div class="meta">
      <span class="cat">${escHtml(p.category)}</span>
      <span class="sep">•</span>
      <span>${escHtml(author)}</span>
      <span class="sep">•</span>
      <span>${escHtml(dateStr)}</span>
    </div>
    <h2>${escHtml(p.title)}</h2>
    <p>${escHtml(preview)}</p>
    <div class="footer">
      <span class="brand">SURBIAS</span>
      ${total > 0 ? `<span class="reactions">${total} reaction${total === 1 ? '' : 's'}</span>` : ''}
      <span class="read-link">Read on surbias.com →</span>
    </div>
  </a>
  <script>
    // Auto-resize via postMessage so embedding sites can adjust iframe height.
    (function(){
      function send(){
        var h = document.documentElement.scrollHeight;
        try { parent.postMessage({type:'surbias:resize', height: h}, '*'); } catch(_){}
      }
      window.addEventListener('load', send);
      window.addEventListener('resize', send);
      setTimeout(send, 100);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'ALLOWALL',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
};
