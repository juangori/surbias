ALTER TABLE `posts` ADD COLUMN `is_seed` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX `posts_is_seed_idx` ON `posts` (`is_seed`);
