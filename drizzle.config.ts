import type { Config } from 'drizzle-kit';

export default {
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
} satisfies Config;
