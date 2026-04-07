import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../../db';
import { posts } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const db = getDb(env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, params.id!)).limit(1);

  const title = post[0]?.title || 'Surbias';
  const category = post[0]?.category || '';

  // Escape for SVG
  const escTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 80);
  const escCat = category.charAt(0).toUpperCase() + category.slice(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f5f9f6"/>
    <rect x="0" y="0" width="1200" height="6" fill="#4a7c59"/>
    <text x="60" y="80" font-family="sans-serif" font-size="24" fill="#8fb89a" font-weight="600">SURBIAS</text>
    <text x="60" y="130" font-family="sans-serif" font-size="18" fill="#556b5c">${escCat}</text>
    <text x="60" y="300" font-family="sans-serif" font-size="48" fill="#161e18" font-weight="700">
      <tspan x="60" dy="0">${escTitle.slice(0, 40)}</tspan>
      ${escTitle.length > 40 ? `<tspan x="60" dy="60">${escTitle.slice(40, 80)}</tspan>` : ''}
    </text>
    <text x="60" y="560" font-family="sans-serif" font-size="20" fill="#8fb89a">surbias.com — Because failing is normal.</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
