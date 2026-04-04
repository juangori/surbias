import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAuth } from '../../../lib/auth';

export const ALL: APIRoute = async (context) => {
  const auth = createAuth(env);
  return auth.handler(context.request);
};
