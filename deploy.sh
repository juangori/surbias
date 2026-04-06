#!/bin/bash
# Build and deploy surbias to Cloudflare Workers
set -e

echo "Building..."
npm run build

echo "Preparing deploy config..."
node -e "
const f='dist/server/wrangler.json';
const c=JSON.parse(require('fs').readFileSync(f,'utf8'));
delete c.pages_build_output_dir;
delete c.rules;
delete c.images;
delete c.no_bundle;
c.kv_namespaces = [{binding: 'SESSION', id: 'cd7ad2b79517430ab2e9bcc0f469385c'}];
require('fs').writeFileSync(f,JSON.stringify(c,null,2));
"

echo "Deploying..."
cd dist/server && npx wrangler deploy --config wrangler.json

echo "Done!"
