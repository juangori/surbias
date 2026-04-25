ALTER TABLE `posts` ADD COLUMN `slug` text;
--> statement-breakpoint
CREATE INDEX `posts_slug_idx` ON `posts` (`slug`);
