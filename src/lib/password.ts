/**
 * Cloudflare Workers-compatible password hashing using Web Crypto PBKDF2.
 *
 * The default better-auth scrypt implementation (N=16384, r=16) exceeds
 * Cloudflare Workers' CPU time limits, causing 503 errors on sign-in.
 * This uses PBKDF2-SHA256 with 100k iterations via the native Web Crypto API,
 * which is hardware-accelerated on Cloudflare's edge.
 */

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

const ITERATIONS = 100_000;
const HASH = 'SHA-256';
const KEY_LENGTH = 64; // bytes

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = arrayBufferToHex(salt.buffer);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH },
    keyMaterial,
    KEY_LENGTH * 8,
  );

  return `pbkdf2:${saltHex}:${arrayBufferToHex(derived)}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  // Handle our PBKDF2 format: "pbkdf2:<salt>:<key>"
  if (hash.startsWith('pbkdf2:')) {
    const [, saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) return false;

    const salt = new Uint8Array(hexToArrayBuffer(saltHex));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );

    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH },
      keyMaterial,
      KEY_LENGTH * 8,
    );

    const expected = new Uint8Array(hexToArrayBuffer(keyHex));
    const actual = new Uint8Array(derived);
    if (expected.length !== actual.length) return false;

    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected[i] ^ actual[i];
    }
    return diff === 0;
  }

  // Legacy better-auth scrypt format: "<salt>:<key>" — cannot verify on Workers
  // User must reset their password
  return false;
}
