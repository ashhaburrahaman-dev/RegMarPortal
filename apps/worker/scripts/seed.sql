-- ─────────────────────────────────────────────────────────────────────────────
-- Seed file: Default admin and operator users
-- ─────────────────────────────────────────────────────────────────────────────
-- INSTRUCTIONS:
--   1. Run: node apps/worker/scripts/generateHash.mjs
--   2. Replace the placeholder hashes below with the generated output
--   3. Apply:
--        wrangler d1 execute marriage-registry --local --file=apps/worker/scripts/seed.sql
--        wrangler d1 execute marriage-registry --remote --file=apps/worker/scripts/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO users
  (id, full_name, username, password_hash, role, failed_attempts, created_at, updated_at)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'System Administrator',
    'admin',
    '$2a$12$iAn5VpWuLiCEdOyrBwL5aeamDZYp8Yn2qeOPLyPHKxiczp1M9rUrC',
    'ADMIN',
    0,
    strftime('%s', 'now'),
    strftime('%s', 'now')
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Office Operator',
    'operator',
    '$2a$12$5.kO4OjwqnFOO1sQcbJQj.ua8fqVI8blXL0O8.VPo28ec4jp6pVoa',
    'OPERATOR',
    0,
    strftime('%s', 'now'),
    strftime('%s', 'now')
  );
