/**
 * Email adapter — supports multiple providers via env vars.
 *
 * Provider priority (first set wins):
 *   1. BREVO_API_KEY    — recommended (300/day free, no card)
 *   2. MAILJET_API_KEY + MAILJET_SECRET_KEY — 200/day free
 *   3. SENDGRID_API_KEY — 100/day free
 *   4. RESEND_API_KEY   — already in use elsewhere (account limit)
 *
 * Public API: sendEmail(env, opts)
 *   - opts.from is optional and falls back to env.FROM_EMAIL
 *   - opts.replyTo lets users reply directly back to the sender
 *
 * The previous (apiKey, from, opts) signature is preserved as
 * sendEmailLegacy() so older callers keep compiling.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

interface EmailEnv {
  BREVO_API_KEY?: string;
  MAILJET_API_KEY?: string;
  MAILJET_SECRET_KEY?: string;
  SENDGRID_API_KEY?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

function parseFrom(from: string): { email: string; name?: string } {
  // "Name <email@x.com>" or just "email@x.com"
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { email: from.trim() };
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function sendBrevo(apiKey: string, opts: Required<Pick<EmailOptions, 'to' | 'subject' | 'html'>> & EmailOptions): Promise<boolean> {
  const fromRaw = opts.from || 'noreply@surbias.com';
  const fromParsed = parseFrom(fromRaw);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromParsed.email, name: opts.fromName || fromParsed.name || 'Surbias' },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text || htmlToText(opts.html),
        replyTo: opts.replyTo ? { email: opts.replyTo } : undefined,
      }),
    });
    if (!res.ok) {
      console.error('[email/brevo] error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email/brevo] failed:', err);
    return false;
  }
}

async function sendMailjet(apiKey: string, secretKey: string, opts: EmailOptions): Promise<boolean> {
  const fromRaw = opts.from || 'noreply@surbias.com';
  const fromParsed = parseFrom(fromRaw);
  const auth = btoa(`${apiKey}:${secretKey}`);
  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromParsed.email, Name: opts.fromName || fromParsed.name || 'Surbias' },
          To: [{ Email: opts.to }],
          Subject: opts.subject,
          HTMLPart: opts.html,
          TextPart: opts.text || htmlToText(opts.html),
          ReplyTo: opts.replyTo ? { Email: opts.replyTo } : undefined,
        }],
      }),
    });
    if (!res.ok) {
      console.error('[email/mailjet] error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email/mailjet] failed:', err);
    return false;
  }
}

async function sendSendGrid(apiKey: string, opts: EmailOptions): Promise<boolean> {
  const fromRaw = opts.from || 'noreply@surbias.com';
  const fromParsed = parseFrom(fromRaw);
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: opts.to }] }],
        from: { email: fromParsed.email, name: opts.fromName || fromParsed.name || 'Surbias' },
        subject: opts.subject,
        content: [
          { type: 'text/plain', value: opts.text || htmlToText(opts.html) },
          { type: 'text/html', value: opts.html },
        ],
        reply_to: opts.replyTo ? { email: opts.replyTo } : undefined,
      }),
    });
    if (!res.ok) {
      console.error('[email/sendgrid] error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email/sendgrid] failed:', err);
    return false;
  }
}

async function sendResend(apiKey: string, opts: EmailOptions): Promise<boolean> {
  const from = opts.from || 'Surbias <noreply@surbias.com>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text || htmlToText(opts.html),
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) {
      console.error('[email/resend] error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email/resend] failed:', err);
    return false;
  }
}

/**
 * Provider-agnostic send. Picks first configured provider in priority order.
 * No-op (returns false) if no provider is configured.
 */
export async function sendEmail(env: EmailEnv, opts: EmailOptions): Promise<boolean> {
  const enriched: EmailOptions = { ...opts, from: opts.from || env.FROM_EMAIL };
  if (env.BREVO_API_KEY) return sendBrevo(env.BREVO_API_KEY, enriched as any);
  if (env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY) return sendMailjet(env.MAILJET_API_KEY, env.MAILJET_SECRET_KEY, enriched);
  if (env.SENDGRID_API_KEY) return sendSendGrid(env.SENDGRID_API_KEY, enriched);
  if (env.RESEND_API_KEY) return sendResend(env.RESEND_API_KEY, enriched);
  // No provider configured — silent no-op (don't break the app)
  return false;
}

/** Returns true if any email provider is configured. */
export function emailEnabled(env: EmailEnv): boolean {
  return !!(env.BREVO_API_KEY || (env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY) || env.SENDGRID_API_KEY || env.RESEND_API_KEY);
}

/**
 * Legacy signature kept for backwards compat with existing call sites:
 *   sendEmail(apiKey, from, opts) → forced Resend
 * New code should use the env-based version above.
 */
export async function sendEmailLegacy(apiKey: string, from: string, opts: EmailOptions): Promise<boolean> {
  return sendResend(apiKey, { ...opts, from });
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

function emailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f9f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:14px;border:1px solid #d4e3d9;overflow:hidden;">
        <tr><td style="padding:8px 0 0;background:linear-gradient(90deg,#4a7c59,#8fb89a,#b8860b);height:4px;"></td></tr>
        <tr><td style="padding:24px 28px;">
          <div style="font-size:14px;font-weight:800;letter-spacing:0.16em;color:#4a7c59;margin-bottom:16px;">SURBIAS</div>
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #e7eee9;margin:24px 0 12px;">
          <p style="margin:0;font-size:11px;color:#8aaa92;line-height:1.5;">
            Surbias · Because failing is normal · <a href="https://surbias.com" style="color:#4a7c59;text-decoration:none;">surbias.com</a><br>
            <a href="https://surbias.com/settings" style="color:#8aaa92;text-decoration:underline;">Notification preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function passwordResetEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Surbias password',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;font-size:20px;color:#161e18;">Reset your password</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#161e18;">Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin:0 0 20px;"><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4a7c59;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;">Reset password</a></p>
      <p style="margin:0;font-size:13px;color:#556b5c;">If you didn't request this, you can safely ignore this email.</p>
    `),
  };
}

export function verificationEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Surbias email',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;font-size:20px;color:#161e18;">Welcome to Surbias 🫂</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#161e18;">Thanks for signing up. Please confirm your email so you can post and react.</p>
      <p style="margin:0 0 20px;"><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4a7c59;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;">Verify email</a></p>
      <p style="margin:0;font-size:13px;color:#556b5c;">Didn't sign up? Just ignore this — no account will be created.</p>
    `),
  };
}

export function reactionNotificationEmail(postTitle: string, reactionType: string, postUrl: string): { subject: string; html: string } {
  const labels: Record<string, string> = { metoo: 'Me too', hug: 'Hug', strength: 'Strength', respect: 'Respect', solidarity: 'Solidarity' };
  const emojis: Record<string, string> = { metoo: '🤝', hug: '🫂', strength: '💪', respect: '🙇', solidarity: '✊' };
  const label = labels[reactionType] || reactionType;
  const emoji = emojis[reactionType] || '💚';
  return {
    subject: `${emoji} Someone reacted "${label}" to your story`,
    html: emailLayout(`
      <h2 style="margin:0 0 12px;font-size:20px;color:#161e18;">${emoji} You're not alone</h2>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#161e18;">Someone reacted <strong>"${label}"</strong> to your story:</p>
      <blockquote style="margin:0 0 18px;padding:14px 18px;background:#f0f5f1;border-left:3px solid #4a7c59;border-radius:0 8px 8px 0;font-style:italic;color:#161e18;">${postTitle}</blockquote>
      <p style="margin:0 0 18px;"><a href="${postUrl}" style="display:inline-block;padding:10px 20px;background:#4a7c59;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;">View your story</a></p>
    `),
  };
}

export function commentNotificationEmail(postTitle: string, commentPreview: string, postUrl: string): { subject: string; html: string } {
  return {
    subject: '💬 Someone commented on your story',
    html: emailLayout(`
      <h2 style="margin:0 0 12px;font-size:20px;color:#161e18;">💬 New comment on your story</h2>
      <blockquote style="margin:0 0 14px;padding:12px 16px;background:#f0f5f1;border-left:3px solid #4a7c59;border-radius:0 8px 8px 0;font-style:italic;color:#161e18;font-size:14px;">${postTitle}</blockquote>
      <p style="margin:0 0 16px;padding:14px 18px;background:#fafaf7;border-radius:8px;color:#161e18;font-size:14px;line-height:1.6;">"${commentPreview}"</p>
      <p style="margin:0 0 18px;"><a href="${postUrl}" style="display:inline-block;padding:10px 20px;background:#4a7c59;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;">View comment</a></p>
    `),
  };
}

export function weeklyDigestEmail(stories: Array<{ title: string; url: string; reactions: number; preview: string }>): { subject: string; html: string } {
  const items = stories.map((s) => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #e7eee9;">
      <a href="${s.url}" style="display:block;text-decoration:none;color:#161e18;">
        <div style="font-size:15px;font-weight:700;line-height:1.4;margin-bottom:4px;">${s.title}</div>
        <div style="font-size:13px;color:#556b5c;line-height:1.5;margin-bottom:6px;">${s.preview}</div>
        <div style="font-size:12px;color:#4a7c59;font-weight:600;">${s.reactions} reactions →</div>
      </a>
    </td></tr>
  `).join('');
  return {
    subject: '🫂 Surbias weekly: stories worth reading',
    html: emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#161e18;">This week on Surbias</h2>
      <p style="margin:0 0 18px;font-size:14px;color:#556b5c;">The most-reacted failure stories from the last 7 days. No happy endings required.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
      <p style="margin:24px 0 0;text-align:center;"><a href="https://surbias.com/top?window=week" style="display:inline-block;padding:10px 20px;background:#4a7c59;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;">See all top stories</a></p>
    `),
  };
}
