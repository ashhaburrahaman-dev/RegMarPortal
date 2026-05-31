CREATE TABLE IF NOT EXISTS `marriages` (
  `id` text PRIMARY KEY NOT NULL,
  `reg_book_no` text NOT NULL,
  `page_no` text NOT NULL,
  `reg_year` integer NOT NULL,
  `memo_number` text NOT NULL UNIQUE,
  `marriage_date` text NOT NULL,
  `registration_date` text NOT NULL,
  `dower_amount` real NOT NULL,
  `payment_method` text NOT NULL CHECK(`payment_method` IN ('CASH', 'DEFERRED')),
  `deferred_amount` real NOT NULL DEFAULT 0,
  `prompt_amount` real NOT NULL DEFAULT 0,
  `created_by` text REFERENCES `users`(`id`),
  `created_at` integer,
  `updated_at` integer
);
