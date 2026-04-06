CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  author_name TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
