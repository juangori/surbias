import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name'),
  image: text('image'),
  locale: text('locale').default('es'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// --- App tables ---

export const CATEGORIES = ['career', 'business', 'education', 'relationships', 'health', 'financial', 'other'] as const;
export type Category = typeof CATEGORIES[number];

export const LOCALES = ['es', 'en', 'de', 'fr', 'pt'] as const;
export type Locale = typeof LOCALES[number];

export const REACTION_TYPES = ['metoo', 'hug', 'strength', 'respect', 'solidarity'] as const;
export type ReactionType = typeof REACTION_TYPES[number];

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  category: text('category').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  locale: text('locale').notNull().default('es'),
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull().default(true),
  status: text('status').notNull().default('published'),
  flagCount: integer('flag_count').notNull().default(0),
  reactionCounts: text('reaction_counts').notNull().default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const reactions = sqliteTable('reactions', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionHash: text('session_hash'),
  type: text('type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('reaction_user_unique').on(table.postId, table.userId),
  uniqueIndex('reaction_session_unique').on(table.postId, table.sessionHash),
]);

export const flags = sqliteTable('flags', {
  id: text('id').primaryKey(),
  targetType: text('target_type').notNull(), // 'post'
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(), // 'spam', 'offensive', 'harmful', 'other'
  reporterHash: text('reporter_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('flag_unique').on(table.targetType, table.targetId, table.reporterHash),
]);
