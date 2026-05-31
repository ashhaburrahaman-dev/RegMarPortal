CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text REFERENCES `users`(`id`),
  `username` text NOT NULL,
  `ip_address` text,
  `login_status` text NOT NULL CHECK(`login_status` IN ('SUCCESS', 'FAILED', 'LOCKED')),
  `login_time` integer
);
