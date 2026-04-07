// Simple A/B test utility based on visitor hash
export function getVariant(testName: string, variants: string[], visitorId: string): string {
  let hash = 0;
  const key = testName + visitorId;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return variants[Math.abs(hash) % variants.length];
}
