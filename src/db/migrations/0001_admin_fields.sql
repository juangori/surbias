ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE posts ADD COLUMN deleted_at INTEGER;
