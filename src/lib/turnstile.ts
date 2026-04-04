const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, secretKey: string, ip?: string): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const result = await fetch(VERIFY_URL, {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json() as { success: boolean };
  return outcome.success;
}
