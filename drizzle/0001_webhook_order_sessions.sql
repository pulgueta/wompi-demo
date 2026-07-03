CREATE TABLE IF NOT EXISTS `checkout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount_in_cents` integer NOT NULL,
	`currency` text DEFAULT 'COP' NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`legal_id_type` text,
	`legal_id` text,
	`shipping_address_line_1` text,
	`shipping_address_line_2` text,
	`shipping_city` text,
	`shipping_region` text,
	`shipping_postal_code` text,
	`wompi_reference` text NOT NULL,
	`wompi_checkout_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `checkout_sessions_wompi_reference_unique` ON `checkout_sessions` (`wompi_reference`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `checkout_sessions_user_id_idx` ON `checkout_sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `checkout_sessions_wompi_reference_idx` ON `checkout_sessions` (`wompi_reference`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `checkout_session_items` (
	`id` text PRIMARY KEY NOT NULL,
	`checkout_session_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`unit_price_in_cents` integer NOT NULL,
	`quantity` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`checkout_session_id`) REFERENCES `checkout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `checkout_session_items_session_id_idx` ON `checkout_session_items` (`checkout_session_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `checkout_session_items_product_id_idx` ON `checkout_session_items` (`product_id`);
--> statement-breakpoint
ALTER TABLE `orders` ADD `wompi_transaction_id` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `wompi_payment_method_type` text;
