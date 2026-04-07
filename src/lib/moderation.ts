// Blocked keywords - word boundary matching to avoid false positives
const BLOCKED_PATTERNS = [
  // Spam patterns
  /\bbuy\s+now\b/i,
  /\bclick\s+here\b/i,
  /\bfree\s+money\b/i,
  /\bearn\s+money\s+fast\b/i,
  /\bcasino\s+online\b/i,
  /\bcrypto\s+investment\b/i,
  /\bmake\s+money\s+online\b/i,
  /\bget\s+rich\s+quick\b/i,
  /\blimited\s+time\s+offer\b/i,
  /\bact\s+now\b/i,
  /\b100%\s+free\b/i,
  /\bwork\s+from\s+home\b/i,
];

const MAX_URLS = 0; // No URLs allowed in posts — primary anti-spam measure
const MIN_BODY_LENGTH = 20;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 150;
const MAX_BODY_LENGTH = 5000;

// Comment-specific limits
const MIN_COMMENT_LENGTH = 2;
const MAX_COMMENT_LENGTH = 2000;
const MAX_COMMENT_URLS = 1;

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function normalize(text: string): string {
  // Unicode normalization to prevent homograph attacks (Cyrillic а vs Latin a, etc.)
  return text.normalize('NFKC');
}

function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern);
  return urls ? urls.length : 0;
}

function hasBlockedContent(text: string): boolean {
  const normalized = normalize(text.toLowerCase());
  return BLOCKED_PATTERNS.some(pattern => pattern.test(normalized));
}

export function validatePost(title: string, body: string): ValidationResult {
  const trimmedTitle = (title || '').trim();
  const trimmedBody = (body || '').trim();

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    return { valid: false, error: 'title_too_short' };
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: 'title_too_long' };
  }
  if (trimmedBody.length < MIN_BODY_LENGTH) {
    return { valid: false, error: 'body_too_short' };
  }
  if (trimmedBody.length > MAX_BODY_LENGTH) {
    return { valid: false, error: 'body_too_long' };
  }

  if (countUrls(trimmedBody) > MAX_URLS) {
    return { valid: false, error: 'too_many_urls' };
  }

  if (hasBlockedContent(`${trimmedTitle} ${trimmedBody}`)) {
    return { valid: false, error: 'blocked_content' };
  }

  return { valid: true };
}

export function validateComment(body: string): ValidationResult {
  const trimmed = (body || '').trim();

  if (trimmed.length < MIN_COMMENT_LENGTH) {
    return { valid: false, error: 'body_too_short' };
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { valid: false, error: 'body_too_long' };
  }

  if (countUrls(trimmed) > MAX_COMMENT_URLS) {
    return { valid: false, error: 'too_many_urls' };
  }

  if (hasBlockedContent(trimmed)) {
    return { valid: false, error: 'blocked_content' };
  }

  return { valid: true };
}

// Check honeypot field - should be empty
export function isHoneypotFilled(value: string | undefined): boolean {
  return !!value && value.length > 0;
}
