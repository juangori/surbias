import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // CSRF: validate Origin/Referer BEFORE processing the request
  // Excludes /api/auth/* — better-auth handles its own CSRF internally
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.request.method)) {
    const url = new URL(context.request.url);
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/')) {
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
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://ssl.gstatic.com https://www.gstatic.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
      "frame-src https://challenges.cloudflare.com https://www.googletagmanager.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Allow embeds (iframe) for /api/embed/* — block everywhere else
  const reqUrl = new URL(context.request.url);
  if (reqUrl.pathname.startsWith('/api/embed/')) {
    response.headers.delete('X-Frame-Options');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache control: authenticated users always get fresh content
  const url2 = new URL(context.request.url);
  const hasSession = context.request.headers.get('cookie')?.includes('better-auth');
  if (hasSession) {
    response.headers.set('Cache-Control', 'private, no-store');
  } else if (
    context.request.method === 'GET' &&
    !url2.pathname.startsWith('/api/') &&
    !url2.pathname.startsWith('/admin/') &&
    !url2.pathname.startsWith('/login')
  ) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
