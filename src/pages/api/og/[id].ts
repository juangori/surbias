import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

function escSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Word-wrap title into up to N lines of approximately maxChars wide
function wrapTitle(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? line + ' ' + w : w;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = w;
      if (lines.length >= maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (text.length > lines.join(' ').length) {
      lines[maxLines - 1] = last.replace(/.{0,3}$/, '…');
    }
  }
  return lines;
}

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      category: posts.category,
      isAnonymous: posts.isAnonymous,
      createdAt: posts.createdAt,
      reactionCounts: posts.reactionCounts,
      userName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, params.id!))
    .limit(1);

  const post = result[0];
  const title = post?.title || 'Surbias — Because failing is normal.';
  const category = post?.category || '';
  const author = post?.isAnonymous ? 'Anonymous' : (post?.userName || 'Anonymous');
  const reactionCounts = post?.reactionCounts ? JSON.parse(post.reactionCounts) as Record<string, number> : {};
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const escCat = escSvg((category.charAt(0).toUpperCase() + category.slice(1)) || 'Story');
  const escAuthor = escSvg(author);
  const lines = wrapTitle(title, 28, 4);
  const lineHeight = 72;
  const startY = 290 - ((lines.length - 1) * lineHeight) / 2;
  const titleSvg = lines
    .map((l, idx) => `<tspan x="60" y="${startY + idx * lineHeight}">${escSvg(l)}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4faf6"/>
      <stop offset="100%" stop-color="#e6f1ea"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b8860b"/>
      <stop offset="50%" stop-color="#4a7c59"/>
      <stop offset="100%" stop-color="#8fb89a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>

  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif">
    <text x="60" y="86" font-size="22" fill="#4a7c59" font-weight="800" letter-spacing="6">SURBIAS</text>
    <text x="1140" y="86" font-size="18" fill="#556b5c" font-weight="500" text-anchor="end">Because failing is normal.</text>

    <rect x="60" y="120" width="${48 + escCat.length * 12}" height="36" rx="18" fill="#4a7c59"/>
    <text x="${84 + escCat.length * 6}" y="143" font-size="16" fill="#ffffff" font-weight="700" letter-spacing="1.5" text-anchor="middle">${escCat.toUpperCase()}</text>

    <text font-size="56" fill="#161e18" font-weight="800" letter-spacing="-1">${titleSvg}</text>

    <line x1="60" y1="520" x2="1140" y2="520" stroke="#cfdcd3" stroke-width="1"/>
    <text x="60" y="560" font-size="22" fill="#556b5c" font-weight="500">— ${escAuthor}</text>
    ${totalReactions > 0
      ? `<text x="1140" y="560" font-size="22" fill="#4a7c59" font-weight="700" text-anchor="end">${totalReactions} reactions</text>`
      : ''}
    <text x="60" y="595" font-size="16" fill="#8aaa92" font-weight="500">surbias.com</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
