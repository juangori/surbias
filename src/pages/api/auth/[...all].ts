import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAuth } from '../../../lib/auth';

export const ALL: APIRoute = async (context) => {
  try {
    const auth = createAuth(env);
    const response = await auth.handler(context.request);
    return response;
  } catch (err) {
    console.error('[auth-api] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal auth error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
