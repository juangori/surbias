// Placeholder for Cloudflare AI-based spam detection
// In production, integrate with @cloudflare/ai Workers AI binding

export async function isSpam(text: string): Promise<boolean> {
  // Simple heuristic-based detection for now
  const spamSignals = [
    text.length < 10,
    (text.match(/https?:\/\//g) || []).length > 3,
    /(.)\1{5,}/.test(text), // Repeated characters
    text.toUpperCase() === text && text.length > 20, // ALL CAPS
  ];

  const spamScore = spamSignals.filter(Boolean).length;
  return spamScore >= 2;
}
