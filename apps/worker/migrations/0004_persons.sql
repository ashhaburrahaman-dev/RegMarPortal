CREATE TABLE IF NOT EXISTS `persons` (
  `id` text PRIMARY KEY NOT NULL,
  `marriage_id` text NOT NULL REFERENCES `marriages`(`id`) ON DELETE CASCADE,
  `role` text NOT NULL CHECK(`role` IN ('GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2')),
  `full_name` text NOT NULL,
  `father_name` text,
  `pincode` text,
  `post_office` text,
  `state_name` text,
  `district_name` text,
  `police_station` text,
  `village_city` text
);
