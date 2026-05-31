CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `full_name` text NOT NULL,
  `username` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `role` text NOT NULL CHECK(`role` IN ('ADMIN', 'OPERATOR')),
  `failed_attempts` integer NOT NULL DEFAULT 0,
  `locked_until` integer,
  `last_login` integer,
  `created_at` integer,
  `updated_at` integer
);
