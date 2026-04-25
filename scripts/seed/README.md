# Seed data

Bootstrap content for surbias.com so first-time visitors land on a populated
feed instead of an empty page. All seeded rows carry `posts.is_seed = 1` and
can be wiped in one statement when there is enough real activity.

## Files

- `stories.json` — 30 unique stories, each translated to en/es/pt/fr/de.
- `generate.mjs` — deterministic generator (seeded PRNG) that turns
  `stories.json` into `seed.sql`. Same input → same output.
- `seed.sql` — generated artifact, committed so the apply step does not need
  Node.

## Regenerate

```sh
node scripts/seed/generate.mjs
```

Edits to `stories.json` (add/remove stories, tweak content) require a
regenerate. The PRNG is seeded with a fixed value so reactions/dates are
reproducible across runs.

## Apply to remote D1

```sh
npx wrangler d1 execute surbias-db --file=scripts/seed/seed.sql --remote
```

The migration `0010_is_seed.sql` must already be applied (the deploy workflow
runs `d1 migrations apply` automatically; if applying manually:
`npx wrangler d1 migrations apply surbias-db --remote`).

## Apply to local D1 (for `wrangler dev`)

```sh
npx wrangler d1 migrations apply surbias-db --local
npx wrangler d1 execute surbias-db --file=scripts/seed/seed.sql --local
```

## Purge when no longer needed

`reactions.post_id` has `ON DELETE CASCADE`, so deleting seed posts also
removes their reactions, comments, and post-tag links.

```sh
npx wrangler d1 execute surbias-db --remote \
  --command "DELETE FROM posts WHERE is_seed = 1"
```

## Distribution

- 30 stories × 5 locales = 150 posts.
- Categories: career (8), business (5), relationships (5), education (4),
  financial (4), health (3), other (1).
- Reactions per post (Pareto-ish): 30% have 0–2, 40% have 3–10, 20% have
  10–30, 10% have 30–80.
- `created_at` spread across the last 120 days, weighted toward recent.
- Reactions use `session_hash` of `seed:<random>` so they don't collide with
  real users; `user_id` is NULL.
