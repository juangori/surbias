import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../db';
import { posts } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb(env.DB);
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  const latestPosts = await db.select().from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  const items = latestPosts.map(p => {
    const date = p.createdAt instanceof Date ? p.createdAt : new Date(Number(p.createdAt) * 1000);
    return `<item>
      <title><![CDATA[${p.title}]]></title>
      <description><![CDATA[${p.body.slice(0, 300)}]]></description>
      <link>https://surbias.com/post/${p.id}</link>
      <guid>https://surbias.com/post/${p.id}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      <category>${p.category}</category>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Surbias - The Survivorship Bias Destroyer</title>
    <description>Failure stories without happy endings.</description>
    <link>https://surbias.com</link>
    <atom:link href="https://surbias.com/feed.xml" rel="self" type="application/rss+xml" />
    <language>${locale}</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
