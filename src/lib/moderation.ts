// Blocked keywords - expand as needed
const BLOCKED_WORDS = [
  // Spam patterns
  'buy now', 'click here', 'free money', 'earn money fast',
  'casino online', 'crypto investment', 'make money online',
];

const MAX_URLS = 3;
const MIN_LENGTH = 20;
const MAX_TITLE_LENGTH = 150;
const MAX_BODY_LENGTH = 5000;

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePost(title: string, body: string): ValidationResult {
  if (!title || title.trim().length < 3) {
    return { valid: false, error: 'title_too_short' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: 'title_too_long' };
  }
  if (!body || body.trim().length < MIN_LENGTH) {
    return { valid: false, error: 'body_too_short' };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { valid: false, error: 'body_too_long' };
  }

  // Count URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = body.match(urlPattern);
  if (urls && urls.length > MAX_URLS) {
    return { valid: false, error: 'too_many_urls' };
  }

  // Check blocked words
  const combined = `${title} ${body}`.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (combined.includes(word)) {
      return { valid: false, error: 'blocked_content' };
    }
  }

  return { valid: true };
}

// Check honeypot field - should be empty
export function isHoneypotFilled(value: string | undefined): boolean {
  return !!value && value.length > 0;
}
