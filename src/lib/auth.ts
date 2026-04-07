import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '../db';

export function createAuth(env: CloudflareEnv) {
  const db = getDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        // Placeholder: log the reset URL. In production, integrate with an email service (Resend, SendGrid, etc.)
        console.log(`[PASSWORD RESET] User: ${user.email}, URL: ${url}`);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        // Placeholder: log the verification URL. In production, integrate with an email service.
        console.log(`[EMAIL VERIFY] User: ${user.email}, URL: ${url}`);
      },
      sendOnSignUp: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
