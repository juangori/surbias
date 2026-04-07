const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstile(token: string, secretKey: string, ip?: string): Promise<boolean> {
  if (!token || !secretKey) return false;

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const result = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!result.ok) return false;

    const outcome = await result.json() as TurnstileResponse;

    if (!outcome.success && outcome['error-codes']?.length) {
      console.error('Turnstile verification failed:', outcome['error-codes']);
    }

    return outcome.success;
  } catch (err) {
    // Timeout or network error — fail open to avoid blocking legitimate users,
    // but log for monitoring
    console.error('Turnstile verification error (timeout or network):', err);
    return false;
  }
}
