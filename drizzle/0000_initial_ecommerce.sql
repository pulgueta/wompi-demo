CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `clerk_user_id` text NOT NULL,
  `email` text NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_user_id_unique` ON `users` (`clerk_user_id`);
--> statement-breakpoint
CREATE INDEX `users_clerk_user_id_idx` ON `users` (`clerk_user_id`);
--> statement-breakpoint
CREATE TABLE `products` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `image_path` text NOT NULL,
  `price_in_cents` integer NOT NULL,
  `inventory` integer NOT NULL,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);
--> statement-breakpoint
CREATE INDEX `products_active_idx` ON `products` (`active`);
--> statement-breakpoint
CREATE INDEX `products_slug_idx` ON `products` (`slug`);
--> statement-breakpoint
CREATE TABLE `orders` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `amount_in_cents` integer NOT NULL,
  `currency` text DEFAULT 'COP' NOT NULL,
  `customer_email` text NOT NULL,
  `customer_name` text NOT NULL,
  `wompi_reference` text NOT NULL,
  `wompi_payment_link_id` text,
  `wompi_checkout_url` text,
  `wompi_error` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_wompi_reference_unique` ON `orders` (`wompi_reference`);
--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);
--> statement-breakpoint
CREATE INDEX `orders_wompi_reference_idx` ON `orders` (`wompi_reference`);
--> statement-breakpoint
CREATE TABLE `order_items` (
  `id` text PRIMARY KEY NOT NULL,
  `order_id` text NOT NULL,
  `product_id` text NOT NULL,
  `product_name` text NOT NULL,
  `unit_price_in_cents` integer NOT NULL,
  `quantity` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);
--> statement-breakpoint
CREATE INDEX `order_items_product_id_idx` ON `order_items` (`product_id`);
