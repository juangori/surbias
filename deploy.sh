#!/bin/bash
# Build and deploy surbias to Cloudflare Workers
set -e

# ---------------------------------------------------------------------------
# Configuration — override via environment variables or .env before running
# KV_NAMESPACE_ID: Cloudflare KV namespace ID bound as SESSION in wrangler.json
# ---------------------------------------------------------------------------
KV_NAMESPACE_ID="${KV_NAMESPACE_ID:-cd7ad2b79517430ab2e9bcc0f469385c}"

# ---------------------------------------------------------------------------
# Validate required wrangler secrets are configured before deploying.
# These must be set via: npx wrangler secret put <NAME>
# ---------------------------------------------------------------------------
echo "Validating wrangler secrets..."
REQUIRED_SECRETS=("BETTER_AUTH_SECRET" "TURNSTILE_SECRET_KEY")
MISSING=()

for SECRET in "${REQUIRED_SECRETS[@]}"; do
  if ! npx wrangler secret list 2>/dev/null | grep -q "\"$SECRET\""; then
    MISSING+=("$SECRET")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "ERROR: The following required secrets are not set in Cloudflare:"
  for S in "${MISSING[@]}"; do
    echo "  - $S  (run: npx wrangler secret put $S)"
  done
  exit 1
fi

echo "Building..."
npm run build

# ---------------------------------------------------------------------------
# Post-build wrangler.json manipulation:
# Astro's Cloudflare adapter writes a wrangler.json for Pages deployment.
# We strip Pages-only fields (pages_build_output_dir, rules, images, no_bundle)
# and inject the KV namespace binding required by the Workers runtime.
# ---------------------------------------------------------------------------
echo "Preparing deploy config..."
node -e "
const f = 'dist/server/wrangler.json';
const c = JSON.parse(require('fs').readFileSync(f, 'utf8'));

// Remove Pages-only fields not valid for Workers deploy
delete c.pages_build_output_dir;
delete c.rules;
delete c.images;
delete c.no_bundle;

// Inject KV namespace binding for session storage
c.kv_namespaces = [{ binding: 'SESSION', id: '${KV_NAMESPACE_ID}' }];

require('fs').writeFileSync(f, JSON.stringify(c, null, 2));
console.log('wrangler.json patched for Workers deployment.');
"

echo "Deploying..."
cd dist/server && npx wrangler deploy --config wrangler.json

echo "Done!"
