const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(apiKey: string, from: string, opts: EmailOptions): Promise<boolean> {
  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error('[email] Resend error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

export function passwordResetEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Surbias password',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4a7c59;">Surbias</h2>
        <p>You requested a password reset. Click the button below to choose a new password:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #4a7c59; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #888;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

export function verificationEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Surbias email',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4a7c59;">Surbias</h2>
        <p>Welcome! Please verify your email address:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #4a7c59; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify email</a>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #888;">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  };
}

export function reactionNotificationEmail(postTitle: string, reactionType: string, postUrl: string): { subject: string; html: string } {
  const reactionLabels: Record<string, string> = {
    metoo: 'Me too',
    hug: 'Hug',
    strength: 'Strength',
    respect: 'Respect',
    solidarity: 'Solidarity',
  };
  const label = reactionLabels[reactionType] || reactionType;
  return {
    subject: `Someone reacted "${label}" to your story`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4a7c59;">Surbias</h2>
        <p>Someone reacted <strong>"${label}"</strong> to your story:</p>
        <p style="padding: 1rem; background: #f5f9f6; border-left: 3px solid #4a7c59; border-radius: 4px; font-style: italic;">${postTitle}</p>
        <a href="${postUrl}" style="display: inline-block; padding: 10px 20px; background: #4a7c59; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View your story</a>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #888;">You're receiving this because someone connected with your story.</p>
      </div>
    `,
  };
}

export function commentNotificationEmail(postTitle: string, commentPreview: string, postUrl: string): { subject: string; html: string } {
  return {
    subject: 'Someone commented on your story',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4a7c59;">Surbias</h2>
        <p>Someone left a comment on your story:</p>
        <p style="padding: 1rem; background: #f5f9f6; border-left: 3px solid #4a7c59; border-radius: 4px; font-style: italic;">${postTitle}</p>
        <p style="padding: 0.75rem; background: #fafafa; border-radius: 4px; color: #333;">"${commentPreview}"</p>
        <a href="${postUrl}" style="display: inline-block; padding: 10px 20px; background: #4a7c59; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View comment</a>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #888;">You're receiving this because someone responded to your story.</p>
      </div>
    `,
  };
}
