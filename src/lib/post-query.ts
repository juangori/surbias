import { posts } from '../db/schema';
import { sql } from 'drizzle-orm';

export const postWithAuthor = {
  id: posts.id,
  userId: posts.userId,
  slug: posts.slug,
  category: posts.category,
  title: posts.title,
  body: posts.body,
  locale: posts.locale,
  isAnonymous: posts.isAnonymous,
  status: posts.status,
  flagCount: posts.flagCount,
  reactionCounts: posts.reactionCounts,
  pinned: posts.pinned,
  createdAt: posts.createdAt,
  deletedAt: posts.deletedAt,
  userName: sql<string | null>`(SELECT name FROM users WHERE id = ${posts.userId})`.as('user_name'),
  commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id})`.as('comment_count'),
};
