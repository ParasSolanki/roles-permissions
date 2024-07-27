CREATE TABLE `user_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_key` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_keys_user_id_provider_key_unique` ON `user_keys` (`user_id`,`provider_key`);