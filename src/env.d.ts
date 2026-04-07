/// <reference types="astro/client" />

// In Astro v6 with Cloudflare, env is accessed via:
// import { env } from "cloudflare:workers"
// Bindings are defined in wrangler.json and typed below.

interface CloudflareEnv {
  DB: import('@cloudflare/workers-types').D1Database;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_EMAIL: string;
}

// Type the cloudflare:workers module
declare module 'cloudflare:workers' {
  const env: CloudflareEnv;
  export { env };
}

// Global helpers injected by Base.astro (is:inline script)
interface Window {
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  showModal: (opts: {
    title?: string;
    html?: string;
    buttons?: Array<{ text: string; class?: string; onClick?: () => void | Promise<void> }>;
  }) => void;
}
