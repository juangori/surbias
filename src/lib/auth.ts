import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema';
import { hashPassword, verifyPassword } from './password';
import { sendEmail, passwordResetEmail, verificationEmail } from './email';

export function createAuth(env: CloudflareEnv) {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error('[auth] BETTER_AUTH_SECRET is not set. Add it via: wrangler secret put BETTER_AUTH_SECRET');
  }
  const db = getDb(env.DB);
  const resendKey = env.RESEND_API_KEY;
  const fromEmail = env.FROM_EMAIL || 'Surbias <noreply@surbias.com>';

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (resendKey) {
          const email = passwordResetEmail(url);
          await sendEmail(resendKey, fromEmail, { to: user.email, ...email });
        } else {
          console.log(`[PASSWORD RESET] User: ${user.email}, URL: ${url}`);
        }
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (resendKey) {
          const email = verificationEmail(url);
          await sendEmail(resendKey, fromEmail, { to: user.email, ...email });
        } else {
          console.log(`[EMAIL VERIFY] User: ${user.email}, URL: ${url}`);
        }
      },
      sendOnSignUp: !!resendKey,
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
        maxAge: 60 * 5,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
