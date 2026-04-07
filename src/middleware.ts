import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // CSRF: validate Origin/Referer BEFORE processing the request
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.request.method)) {
    const url = new URL(context.request.url);
    if (url.pathname.startsWith('/api/')) {
      const origin = context.request.headers.get('origin');
      const referer = context.request.headers.get('referer');
      const host = url.host;

      const originHost = origin ? new URL(origin).host : null;
      const refererHost = referer ? new URL(referer).host : null;
      const validHost = originHost === host || refererHost === host;

      if (!validHost) {
        return new Response(JSON.stringify({ error: 'CSRF check failed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const response = await next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache static pages at CDN edge
  const url = new URL(context.request.url);
  if (
    context.request.method === 'GET' &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/admin/') &&
    !url.pathname.startsWith('/profile')
  ) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
