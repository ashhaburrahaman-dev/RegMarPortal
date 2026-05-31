CREATE INDEX IF NOT EXISTS `idx_memo` ON `marriages` (`memo_number`);
CREATE INDEX IF NOT EXISTS `idx_year` ON `marriages` (`reg_year`);
CREATE INDEX IF NOT EXISTS `idx_persons_marriage` ON `persons` (`marriage_id`);
CREATE INDEX IF NOT EXISTS `idx_login_logs_user` ON `login_logs` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_login_logs_time` ON `login_logs` (`login_time`);
