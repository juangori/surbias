import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../db';
import { posts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCollection } from 'astro:content';

const SITE_URL = 'https://surbias.com';
const LOCALES = ['en', 'es', 'de', 'fr', 'pt'];

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/top', priority: '0.9', changefreq: 'daily' },
  { path: '/search', priority: '0.6', changefreq: 'weekly' },
  { path: '/support', priority: '0.6', changefreq: 'monthly' },
  { path: '/login', priority: '0.5', changefreq: 'monthly' },
  { path: '/enterprise', priority: '0.6', changefreq: 'monthly' },
  { path: '/stats', priority: '0.5', changefreq: 'daily' },
];

const STATIC_GLOBAL_PAGES = [
  { path: '/press', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/survivorship-bias', priority: '0.9', changefreq: 'monthly' },
  { path: '/famous-failures', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/glossary', priority: '0.6', changefreq: 'monthly' },
  { path: '/tags', priority: '0.6', changefreq: 'daily' },
  { path: '/vs/linkedin', priority: '0.7', changefreq: 'monthly' },
];

function localePrefix(locale: string): string {
  return locale === 'en' ? '' : `/${locale}`;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const db = getDb(env.DB);

  const allPosts = await db.select({
    id: posts.id,
    slug: posts.slug,
    locale: posts.locale,
    createdAt: posts.createdAt,
  })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.createdAt));

  let urls = '';

  for (const page of STATIC_GLOBAL_PAGES) {
    urls += `  <url>
    <loc>${escXml(SITE_URL + page.path)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
  }

  for (const page of STATIC_PAGES) {
    for (const locale of LOCALES) {
      const prefix = localePrefix(locale);
      const loc = `${SITE_URL}${prefix}${page.path}`;
      const alternates = LOCALES.map(l =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${localePrefix(l)}${page.path}" />`
      ).join('\n');
      urls += `  <url>
    <loc>${escXml(loc)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${alternates}
  </url>\n`;
    }
  }

  for (const post of allPosts) {
    const postPath = post.slug ? `/post/${post.slug}-${post.id}` : `/post/${post.id}`;
    const prefix = localePrefix(post.locale);
    const loc = `${SITE_URL}${prefix}${postPath}`;
    const lastmod = post.createdAt instanceof Date
      ? post.createdAt.toISOString().split('T')[0]
      : new Date(Number(post.createdAt) * 1000).toISOString().split('T')[0];
    urls += `  <url>
    <loc>${escXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }

  // Blog posts (markdown collection)
  try {
    const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
    for (const post of blogPosts) {
      const lastmod = (post.data.updatedAt || post.data.publishedAt).toISOString().split('T')[0];
      urls += `  <url>
    <loc>${escXml(`${SITE_URL}/blog/${post.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }
  } catch (_) { /* collection may not be available at runtime */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
};
